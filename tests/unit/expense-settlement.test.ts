import { describe, it, expect } from "vitest";
import { calculateSettlementPure } from "@/services/billing/expense.service";
import { buildDeepLinkUrl } from "@/services/billing/settlement.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALICE = { userId: "aaa-111", name: "Alice" };
const BOB = { userId: "bbb-222", name: "Bob" };
const CHARLIE = { userId: "ccc-333", name: "Charlie" };

// ---------------------------------------------------------------------------
// calculateSettlementPure
// ---------------------------------------------------------------------------

describe("Expense Settlement -- calculateSettlementPure (pure)", () => {
  describe("equal split", () => {
    it("3 members, 1 expense $300 equal split: payer owed $200 by the other two", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 300,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      // Alice paid $300, owes $100 (her share), net = +$200
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(300);
      expect(alice.totalOwed).toBe(100);
      expect(alice.netPosition).toBe(200);
      expect(alice.owesTo).toHaveLength(0);

      // Bob paid $0, owes $100, net = -$100
      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.totalPaid).toBe(0);
      expect(bob.totalOwed).toBe(100);
      expect(bob.netPosition).toBe(-100);
      expect(bob.owesTo).toHaveLength(1);
      expect(bob.owesTo[0].userId).toBe(ALICE.userId);
      expect(bob.owesTo[0].amount).toBe(100);

      // Charlie paid $0, owes $100, net = -$100
      const charlie = result.memberBalances.find((m) => m.userId === CHARLIE.userId)!;
      expect(charlie.totalPaid).toBe(0);
      expect(charlie.totalOwed).toBe(100);
      expect(charlie.netPosition).toBe(-100);
      expect(charlie.owesTo).toHaveLength(1);
      expect(charlie.owesTo[0].userId).toBe(ALICE.userId);
      expect(charlie.owesTo[0].amount).toBe(100);
    });

    it("2 members, equal split of $50: each owes $25", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 50,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB],
        []
      );

      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.netPosition).toBe(25);

      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.netPosition).toBe(-25);
      expect(bob.owesTo[0].amount).toBe(25);
    });
  });

  describe("custom splits", () => {
    it("custom splits with different amounts", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 300,
            splitMethod: "custom",
            customSplits: [
              { userId: ALICE.userId, amount: 100 },
              { userId: BOB.userId, amount: 50 },
              { userId: CHARLIE.userId, amount: 150 },
            ],
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      // Alice paid $300, owes $100, net = +$200
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(300);
      expect(alice.totalOwed).toBe(100);
      expect(alice.netPosition).toBe(200);

      // Bob owes $50, net = -$50
      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.totalOwed).toBe(50);
      expect(bob.netPosition).toBe(-50);

      // Charlie owes $150, net = -$150
      const charlie = result.memberBalances.find((m) => m.userId === CHARLIE.userId)!;
      expect(charlie.totalOwed).toBe(150);
      expect(charlie.netPosition).toBe(-150);
    });

    it("custom splits where payer is not included", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 200,
            splitMethod: "custom",
            customSplits: [
              { userId: BOB.userId, amount: 100 },
              { userId: CHARLIE.userId, amount: 100 },
            ],
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(200);
      expect(alice.totalOwed).toBe(0);
      expect(alice.netPosition).toBe(200);
    });
  });

  describe("exclude split", () => {
    it("exclude one member from split", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 200,
            splitMethod: "exclude",
            customSplits: null,
            excludedUserIds: [CHARLIE.userId],
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      // Split among Alice and Bob only: $100 each
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(200);
      expect(alice.totalOwed).toBe(100);
      expect(alice.netPosition).toBe(100);

      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.totalOwed).toBe(100);
      expect(bob.netPosition).toBe(-100);

      // Charlie excluded -- owes nothing
      const charlie = result.memberBalances.find((m) => m.userId === CHARLIE.userId)!;
      expect(charlie.totalOwed).toBe(0);
      expect(charlie.netPosition).toBe(0);
    });

    it("exclude multiple members from split", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 300,
            splitMethod: "exclude",
            customSplits: null,
            excludedUserIds: [BOB.userId, CHARLIE.userId],
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      // Only Alice is eligible -- she pays $300, owes $300, net = 0
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(300);
      expect(alice.totalOwed).toBe(300);
      expect(alice.netPosition).toBe(0);
    });
  });

  describe("multiple expenses and net positions", () => {
    it("two expenses cancel out -- net positions are zero", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 100,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
          {
            payerId: BOB.userId,
            amount: 100,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB],
        []
      );

      // Alice paid $100, owes $100 (50+50), net = 0
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(100);
      expect(alice.totalOwed).toBe(100);
      expect(alice.netPosition).toBe(0);
      expect(alice.owesTo).toHaveLength(0);

      // Bob paid $100, owes $100 (50+50), net = 0
      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.totalPaid).toBe(100);
      expect(bob.totalOwed).toBe(100);
      expect(bob.netPosition).toBe(0);
      expect(bob.owesTo).toHaveLength(0);
    });

    it("multiple expenses with partial offset", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 300,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
          {
            payerId: BOB.userId,
            amount: 150,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [ALICE, BOB, CHARLIE],
        []
      );

      // Alice paid $300, owes $150 (100+50), net = +$150
      const alice = result.memberBalances.find((m) => m.userId === ALICE.userId)!;
      expect(alice.totalPaid).toBe(300);
      expect(alice.totalOwed).toBe(150);
      expect(alice.netPosition).toBe(150);

      // Bob paid $150, owes $150 (100+50), net = 0
      const bob = result.memberBalances.find((m) => m.userId === BOB.userId)!;
      expect(bob.totalPaid).toBe(150);
      expect(bob.totalOwed).toBe(150);
      expect(bob.netPosition).toBe(0);

      // Charlie paid $0, owes $150 (100+50), net = -$150
      const charlie = result.memberBalances.find((m) => m.userId === CHARLIE.userId)!;
      expect(charlie.totalPaid).toBe(0);
      expect(charlie.totalOwed).toBe(150);
      expect(charlie.netPosition).toBe(-150);
      expect(charlie.owesTo).toHaveLength(1);
      expect(charlie.owesTo[0].userId).toBe(ALICE.userId);
      expect(charlie.owesTo[0].amount).toBe(150);
    });
  });

  describe("edge cases", () => {
    it("no expenses returns zero balances", () => {
      const result = calculateSettlementPure([], [ALICE, BOB], []);

      for (const balance of result.memberBalances) {
        expect(balance.totalPaid).toBe(0);
        expect(balance.totalOwed).toBe(0);
        expect(balance.netPosition).toBe(0);
        expect(balance.owesTo).toHaveLength(0);
      }
    });

    it("no members returns empty", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 100,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [],
        []
      );

      expect(result.memberBalances).toHaveLength(0);
    });

    it("single member with expense has zero net position", () => {
      const result = calculateSettlementPure(
        [
          {
            payerId: ALICE.userId,
            amount: 100,
            splitMethod: "equal",
            customSplits: null,
            excludedUserIds: null,
          },
        ],
        [ALICE],
        []
      );

      const alice = result.memberBalances[0];
      expect(alice.totalPaid).toBe(100);
      expect(alice.totalOwed).toBe(100);
      expect(alice.netPosition).toBe(0);
    });
  });

  describe("platform fees", () => {
    it("includes platform fees in summary", () => {
      const result = calculateSettlementPure(
        [],
        [ALICE, BOB],
        [
          { userId: ALICE.userId, amount: 5 },
          { userId: BOB.userId, amount: 5 },
        ]
      );

      expect(result.platformFees.total).toBe(10);
      expect(result.platformFees.perMember).toHaveLength(2);

      const aliceFee = result.platformFees.perMember.find(
        (f) => f.userId === ALICE.userId
      )!;
      expect(aliceFee.amount).toBe(5);
    });

    it("aggregates multiple fees per user", () => {
      const result = calculateSettlementPure(
        [],
        [ALICE],
        [
          { userId: ALICE.userId, amount: 3 },
          { userId: ALICE.userId, amount: 7 },
        ]
      );

      expect(result.platformFees.total).toBe(10);
      expect(result.platformFees.perMember).toHaveLength(1);
      expect(result.platformFees.perMember[0].amount).toBe(10);
    });
  });
});

// ---------------------------------------------------------------------------
// buildDeepLinkUrl
// ---------------------------------------------------------------------------

describe("Settlement Deep Links -- buildDeepLinkUrl (pure)", () => {
  it("generates Venmo deep link with correct format", () => {
    const url = buildDeepLinkUrl("venmo", "johndoe", 50, "Trip settlement");
    expect(url).toBe(
      "venmo://paycharge?txn=pay&recipients=johndoe&amount=50.00&note=Trip%20settlement"
    );
  });

  it("generates Venmo deep link with special characters in recipient", () => {
    const url = buildDeepLinkUrl("venmo", "john doe", 25.5, "Golf trip");
    expect(url).toContain("venmo://paycharge?txn=pay");
    expect(url).toContain("recipients=john%20doe");
    expect(url).toContain("amount=25.50");
  });

  it("generates Zelle mailto link", () => {
    const url = buildDeepLinkUrl("zelle", "user@example.com", 100, "Settlement");
    expect(url).toContain("mailto:");
    expect(url).toContain("user%40example.com");
    expect(url).toContain("subject=");
    expect(url).toContain("100.00");
  });

  it("generates PayPal link with correct format", () => {
    const url = buildDeepLinkUrl("paypal", "johndoe", 75, "Trip payment");
    expect(url).toBe(
      "https://www.paypal.com/paypalme/johndoe/75.00"
    );
  });

  it("generates Cash App link with correct format", () => {
    const url = buildDeepLinkUrl("cashapp", "johndoe", 30, "Golf trip");
    expect(url).toBe("https://cash.app/$johndoe/30.00");
  });

  it("formats amount to two decimal places", () => {
    const url = buildDeepLinkUrl("venmo", "user", 100, "Test");
    expect(url).toContain("amount=100.00");
  });

  it("handles zero amount", () => {
    const url = buildDeepLinkUrl("paypal", "user", 0, "Test");
    expect(url).toContain("0.00");
  });

  it("encodes special characters in note", () => {
    const url = buildDeepLinkUrl("venmo", "user", 10, "Alice & Bob's split");
    expect(url).toContain("note=Alice%20%26%20Bob's%20split");
  });
});
