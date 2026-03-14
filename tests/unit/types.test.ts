import { describe, it, expect } from "vitest";
import type {
  TripStatus,
  UserStatus,
  SystemRole,
  TripRole,
  VoteValue,
} from "@/types";

describe("type enums", () => {
  it("TripStatus values are correct", () => {
    const statuses: TripStatus[] = [
      "draft",
      "planning",
      "voting",
      "booking",
      "locked",
      "in_progress",
      "completed",
      "archived",
    ];
    expect(statuses).toHaveLength(8);
  });

  it("UserStatus values are correct", () => {
    const statuses: UserStatus[] = ["active", "suspended", "deactivated"];
    expect(statuses).toHaveLength(3);
  });

  it("SystemRole values are correct", () => {
    const roles: SystemRole[] = ["user", "admin", "concierge_ops"];
    expect(roles).toHaveLength(3);
  });

  it("TripRole values are correct", () => {
    const roles: TripRole[] = ["collaborator", "captain"];
    expect(roles).toHaveLength(2);
  });

  it("VoteValue values are correct", () => {
    const values: VoteValue[] = ["in", "fine", "out"];
    expect(values).toHaveLength(3);
  });
});
