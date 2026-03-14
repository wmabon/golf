import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/auth";
import {
  updateProfileSchema,
  createMembershipSchema,
} from "@/lib/validation/users";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = registerSchema.safeParse({
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts partial updates", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("accepts handicap as number", () => {
    const result = updateProfileSchema.safeParse({ handicap: 12.5 });
    expect(result.success).toBe(true);
  });

  it("accepts null handicap (clearing the field)", () => {
    const result = updateProfileSchema.safeParse({ handicap: null });
    expect(result.success).toBe(true);
  });

  it("rejects handicap out of range", () => {
    const result = updateProfileSchema.safeParse({ handicap: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("createMembershipSchema", () => {
  it("accepts valid membership", () => {
    const result = createMembershipSchema.safeParse({
      clubName: "Augusta National",
      accessType: "private",
      willingToSponsor: true,
      notes: "Can bring 2 guests on Tuesdays",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing club name", () => {
    const result = createMembershipSchema.safeParse({
      accessType: "private",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing access type", () => {
    const result = createMembershipSchema.safeParse({
      clubName: "Augusta National",
    });
    expect(result.success).toBe(false);
  });

  it("defaults willingToSponsor to false", () => {
    const result = createMembershipSchema.safeParse({
      clubName: "Augusta National",
      accessType: "private",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.willingToSponsor).toBe(false);
    }
  });
});
