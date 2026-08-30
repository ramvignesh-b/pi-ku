import { useCallback, useEffect, useRef, useState } from "react";

/** Long enough for the wave to travel and settle; short enough not to read as a wait. */
const FLOOR_MS = 900;
/** The wave going still, then the splash fading off the content beneath it. */
const SETTLE_MS = 400;
const SEEN_KEY = "piku.booted";

export type BootPhase = "running" | "settling" | "gone";

/**
 * Once per session rather than once per mount, so a remount - StrictMode, a
 * route bounce - cannot replay the boot splash.
 */
let sessionBooted = false;

function hasVisitedBefore() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private windows and blocked storage land here. Showing the moment again
    // is the pleasant failure; withholding it is not.
    return false;
  }
}

/**
 * Drives the boot splash: the first splash of a session, whatever route the
 * visitor arrived on - a share link is that person's boot, and the one place
 * this most wants to be seen.
 *
 * It reports no progress. The only thing it has to say truthfully is when it
 * is over, which is why the floor and the settle live here rather than in the
 * component: they are about pacing, not about painting.
 */
export function useBootSplash() {
  const [phase, setPhase] = useState<BootPhase>(() =>
    sessionBooted ? "gone" : "running",
  );

  // Read before markReady writes the key, or every visitor looks like a
  // returning one on their very first load.
  const returning = useRef(hasVisitedBefore());
  const startedAt = useRef(performance.now());
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );

  const markReady = useCallback(() => {
    if (sessionBooted) return;
    sessionBooted = true;

    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Nothing to do; a visitor whose storage is blocked simply sees it again.
    }

    // A returning visitor has the assets cached and is owed no ceremony.
    const floor = returning.current ? 0 : FLOOR_MS;
    const held = Math.max(0, floor - (performance.now() - startedAt.current));

    timers.current.push(
      window.setTimeout(() => {
        setPhase("settling");
        timers.current.push(
          window.setTimeout(() => setPhase("gone"), SETTLE_MS),
        );
      }, held),
    );
  }, []);

  return { phase, visible: phase !== "gone", markReady };
}
