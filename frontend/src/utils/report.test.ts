import { beforeEach, describe, expect, it } from "vitest";
import {
  clearReports,
  describeError,
  getLastRequestId,
  getRecentReports,
  rememberRequestId,
  report,
} from "./report";

describe("report", () => {
  beforeEach(() => {
    clearReports();
  });

  it("keeps what was reported", () => {
    report("error", "letter_burn_failed", new Error("network down"));

    const [entry] = getRecentReports();
    expect(entry.level).toBe("error");
    expect(entry.event).toBe("letter_burn_failed");
    expect(entry.detail).toBe("network down");
  });

  it("attaches the last seen request id", () => {
    rememberRequestId("abc-123");
    report("warn", "session_restore_failed");

    expect(getLastRequestId()).toBe("abc-123");
    expect(getRecentReports()[0].requestId).toBe("abc-123");
  });

  it("ignores an absent request id rather than clearing the last one", () => {
    rememberRequestId("abc-123");
    rememberRequestId(undefined);

    expect(getLastRequestId()).toBe("abc-123");
  });

  it("holds a bounded number of entries", () => {
    for (let i = 0; i < 60; i++) {
      report("warn", `event_${i}`);
    }

    const entries = getRecentReports();
    expect(entries).toHaveLength(50);
    expect(entries[0].event).toBe("event_10");
    expect(entries[49].event).toBe("event_59");
  });

  it("describes non-Error throws without losing them", () => {
    expect(describeError("plain string")).toBe("plain string");
    expect(describeError(new Error("boom"))).toBe("boom");
  });
});
