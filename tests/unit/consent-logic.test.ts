import { describe, it, expect } from "vitest";
import {
  canTransition,
  validateTransition,
} from "@/services/media/state-machines/photo-asset-sm";
import type { PublishState, ConsentState } from "@/types";

/**
 * Consent workflow logic tests.
 *
 * These verify the pure logic behind consent-driven state transitions:
 * - All tagged users approved -> photo becomes publish_eligible
 * - Any tagged user vetoes -> photo immediately moves to withdrawn
 * - Partial pending consents -> photo stays in review_pending
 *
 * The actual DB interactions are in consent.service.ts; these tests
 * verify the underlying state machine and decision rules.
 */

/** Simulate consent evaluation: given consents array, determine target photo state */
function evaluateConsents(
  currentPhotoState: PublishState,
  consents: { consentState: ConsentState }[]
): PublishState {
  // If any consent is vetoed, photo must be withdrawn
  const hasVeto = consents.some((c) => c.consentState === "vetoed");
  if (hasVeto) {
    if (canTransition(currentPhotoState, "withdrawn")) {
      return "withdrawn";
    }
    return currentPhotoState;
  }

  // If all consents are approved, photo becomes publish_eligible
  const allApproved =
    consents.length > 0 &&
    consents.every((c) => c.consentState === "approved");
  if (allApproved) {
    if (canTransition(currentPhotoState, "publish_eligible")) {
      return "publish_eligible";
    }
    return currentPhotoState;
  }

  // Otherwise, some are still pending — photo stays in current state
  return currentPhotoState;
}

describe("Consent Workflow Logic", () => {
  describe("all approved -> publish_eligible", () => {
    it("single user approves -> publish_eligible", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "approved" },
      ]);
      expect(result).toBe("publish_eligible");
    });

    it("multiple users all approve -> publish_eligible", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "approved" },
        { consentState: "approved" },
        { consentState: "approved" },
      ]);
      expect(result).toBe("publish_eligible");
    });

    it("state machine allows review_pending -> publish_eligible", () => {
      expect(canTransition("review_pending", "publish_eligible")).toBe(true);
      const result = validateTransition("review_pending", "publish_eligible");
      expect(result).toEqual({ valid: true });
    });
  });

  describe("any vetoed -> withdrawn", () => {
    it("single user vetoes -> withdrawn", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "vetoed" },
      ]);
      expect(result).toBe("withdrawn");
    });

    it("one veto among approvals -> withdrawn", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "approved" },
        { consentState: "vetoed" },
        { consentState: "approved" },
      ]);
      expect(result).toBe("withdrawn");
    });

    it("one veto among pending -> withdrawn", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "pending" },
        { consentState: "vetoed" },
      ]);
      expect(result).toBe("withdrawn");
    });

    it("veto immediately makes asset ineligible (FR-58)", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "vetoed" },
      ]);
      expect(result).toBe("withdrawn");
      // Withdrawn is terminal — cannot be published
      expect(canTransition("withdrawn", "published")).toBe(false);
      expect(canTransition("withdrawn", "publish_eligible")).toBe(false);
    });

    it("state machine allows review_pending -> withdrawn", () => {
      expect(canTransition("review_pending", "withdrawn")).toBe(true);
      const result = validateTransition("review_pending", "withdrawn");
      expect(result).toEqual({ valid: true });
    });

    it("veto from publish_eligible state -> withdrawn", () => {
      const result = evaluateConsents("publish_eligible", [
        { consentState: "vetoed" },
      ]);
      expect(result).toBe("withdrawn");
    });
  });

  describe("partial pending -> stays review_pending", () => {
    it("some pending, some approved -> stays review_pending", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "approved" },
        { consentState: "pending" },
      ]);
      expect(result).toBe("review_pending");
    });

    it("all pending -> stays review_pending", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "pending" },
        { consentState: "pending" },
        { consentState: "pending" },
      ]);
      expect(result).toBe("review_pending");
    });

    it("single pending -> stays review_pending", () => {
      const result = evaluateConsents("review_pending", [
        { consentState: "pending" },
      ]);
      expect(result).toBe("review_pending");
    });
  });

  describe("edge cases", () => {
    it("no consents -> stays in current state (no approvals means not all approved)", () => {
      const result = evaluateConsents("review_pending", []);
      expect(result).toBe("review_pending");
    });

    it("withdrawn state cannot transition further even with approvals", () => {
      const result = evaluateConsents("withdrawn", [
        { consentState: "approved" },
      ]);
      // Cannot transition from withdrawn
      expect(result).toBe("withdrawn");
    });

    it("private state cannot skip to publish_eligible even with all approvals", () => {
      const result = evaluateConsents("private", [
        { consentState: "approved" },
      ]);
      // private -> publish_eligible is not a valid transition
      expect(result).toBe("private");
    });
  });

  describe("takedown flow (FR-61)", () => {
    it("published photos can be taken down (published -> withdrawn)", () => {
      expect(canTransition("published", "withdrawn")).toBe(true);
    });

    it("takedown is validated by state machine", () => {
      const result = validateTransition("published", "withdrawn");
      expect(result).toEqual({ valid: true });
    });

    it("withdrawn photos cannot be republished", () => {
      expect(canTransition("withdrawn", "published")).toBe(false);
      expect(canTransition("withdrawn", "publish_eligible")).toBe(false);
      expect(canTransition("withdrawn", "review_pending")).toBe(false);
    });
  });

  describe("publication flow", () => {
    it("only publish_eligible photos can be published", () => {
      expect(canTransition("publish_eligible", "published")).toBe(true);
      expect(canTransition("private", "published")).toBe(false);
      expect(canTransition("review_pending", "published")).toBe(false);
      expect(canTransition("withdrawn", "published")).toBe(false);
    });

    it("full lifecycle: private -> review_pending -> publish_eligible -> published", () => {
      expect(canTransition("private", "review_pending")).toBe(true);
      expect(canTransition("review_pending", "publish_eligible")).toBe(true);
      expect(canTransition("publish_eligible", "published")).toBe(true);
    });
  });

  describe("default privacy (FR-57, PRD Section 13)", () => {
    it("photos start in private state (no automatic publication)", () => {
      // private is the entry state — the only valid next state is review_pending
      // which requires explicit nomination
      const nextStates = ["review_pending"];
      expect(canTransition("private", "review_pending")).toBe(true);
      expect(canTransition("private", "publish_eligible")).toBe(false);
      expect(canTransition("private", "published")).toBe(false);
      expect(canTransition("private", "withdrawn")).toBe(false);

      // private only allows manual nomination to review_pending
      const result = validateTransition("private", "published");
      expect(result.valid).toBe(false);
    });
  });
});
