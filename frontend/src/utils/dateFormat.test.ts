import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatRelativeDate } from "./dateFormat";

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T15:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format a same-day timestamp as Today, <time>", () => {
    const result = formatRelativeDate("2026-04-14T10:15:00Z");

    expect(result).toBe("Today, 3:45 PM");
  });

  it("should format a previous-day timestamp as Yesterday, <time>", () => {
    const result = formatRelativeDate("2026-04-13T09:10:00Z");

    expect(result).toBe("Yesterday, 2:40 PM");
  });

  it("should format dates within the last week as relative day + time", () => {
    const result = formatRelativeDate("2026-04-12T08:00:00Z");

    expect(result).toBe("2 days ago, 1:30 PM");
  });

  it("should format dates older than a week as a full date+time", () => {
    const result = formatRelativeDate("2026-04-01T13:15:00Z");

    expect(result).toBe("Apr 1, 2026, 6:45 PM");
  });
});

describe("formatDate", () => {
  it("should format a new date as mmm dd, yyyy", () => {
    const result = formatDate("2026-04-01T10:15:00Z");

    expect(result).toBe("April 1, 2026");
  });
});
