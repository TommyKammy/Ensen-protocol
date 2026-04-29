import assert from "node:assert/strict";
import { afterEach, describe, it as nodeIt } from "node:test";

type AsymmetricMatcher =
  | { kind: "arrayContaining"; expected: unknown[] }
  | { kind: "objectContaining"; expected: Record<string, unknown> };

function isMatcher(value: unknown): value is AsymmetricMatcher {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value.kind === "arrayContaining" || value.kind === "objectContaining")
  );
}

function matchesExpected(actual: unknown, expected: unknown): boolean {
  if (!isMatcher(expected)) {
    try {
      assert.deepStrictEqual(actual, expected);
      return true;
    } catch {
      return false;
    }
  }

  if (expected.kind === "arrayContaining") {
    if (!Array.isArray(actual)) {
      return false;
    }

    return expected.expected.every((expectedItem) =>
      actual.some((actualItem) => matchesExpected(actualItem, expectedItem))
    );
  }

  if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
    return false;
  }

  return Object.entries(expected.expected).every(([key, expectedValue]) =>
    matchesExpected((actual as Record<string, unknown>)[key], expectedValue)
  );
}

function formatTitle(title: string, value: unknown): string {
  return title.replace(/%s/g, String(value));
}

function getProperty(value: unknown, propertyPath: string): unknown {
  return propertyPath
    .split(".")
    .reduce<unknown>(
      (current, part) =>
        typeof current === "object" && current !== null
          ? (current as Record<string, unknown>)[part]
          : undefined,
      value
    );
}

function each<T>(cases: readonly T[]) {
  return (title: string, fn: (arg: T) => void | Promise<void>): void => {
    for (const testCase of cases) {
      nodeIt(formatTitle(title, testCase), () => fn(testCase));
    }
  };
}

type ItWithEach = typeof nodeIt & { each: typeof each };

const it: ItWithEach = Object.assign(nodeIt, { each });

function expect(actual: unknown, message?: string) {
  return {
    toBe(expected: unknown): void {
      assert.strictEqual(actual, expected, message);
    },
    toBeGreaterThan(expected: number): void {
      assert.equal(typeof actual, "number", message ?? "actual value must be a number");
      const actualNumber = actual as number;
      assert.ok(
        actualNumber > expected,
        message ?? `expected ${actualNumber} to be greater than ${expected}`
      );
    },
    toContain(expected: unknown): void {
      if (typeof actual === "string") {
        assert.equal(typeof expected, "string", "string containment expects a string");
        assert.ok(
          actual.includes(expected as string),
          message ?? `expected string to contain ${String(expected)}`
        );
        return;
      }

      assert.ok(Array.isArray(actual), message ?? "containment expects an array or string");
      assert.ok(
        actual.some((item) => matchesExpected(item, expected)),
        message ?? `expected array to contain ${String(expected)}`
      );
    },
    toEqual(expected: unknown): void {
      assert.ok(
        matchesExpected(actual, expected),
        message ?? `expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`
      );
    },
    toHaveProperty(propertyPath: string, expected?: unknown): void {
      const value = getProperty(actual, propertyPath);
      assert.notStrictEqual(value, undefined, message ?? `missing property ${propertyPath}`);

      if (arguments.length > 1) {
        assert.ok(
          matchesExpected(value, expected),
          message ?? `unexpected value for property ${propertyPath}`
        );
      }
    },
    toMatch(expected: RegExp): void {
      assert.equal(typeof actual, "string", message ?? "regular expression match expects a string");
      assert.match(actual as string, expected, message);
    },
    toThrow(expected: RegExp): void {
      assert.equal(typeof actual, "function", message ?? "throw assertion expects a function");
      assert.throws(actual as () => void, expected, message);
    }
  };
}

expect.arrayContaining = (expected: unknown[]): AsymmetricMatcher => ({
  kind: "arrayContaining",
  expected
});

expect.objectContaining = (expected: Record<string, unknown>): AsymmetricMatcher => ({
  kind: "objectContaining",
  expected
});

export { afterEach, describe, expect, it };
