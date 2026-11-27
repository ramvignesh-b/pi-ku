import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../config/routes";

let beginRequest: Promise<typeof import("../pages/Begin")> | undefined;

export function loadBegin() {
  beginRequest ??= import("../pages/Begin").catch((error: unknown) => {
    beginRequest = undefined;
    throw error;
  });
  return beginRequest;
}

export function warmBegin() {
  void loadBegin().catch(() => {});
}

interface ViewportPoint {
  x: number;
  y: number;
}

function readOrb(element: HTMLDivElement | null) {
  if (!element) return null;
  const { left, top, width, height } = element.getBoundingClientRect();
  if (!(width && height)) return null;

  const style = getComputedStyle(element);
  const blur = Number(style.filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0);
  // The soft gradient includes the falloff outside the orb's solid box.
  const diameter = width + 2 * blur;
  const peak = blur ? 1 - Math.exp(-(width ** 2) / (8 * blur ** 2)) : 1;
  return {
    origin: { x: left + width / 2, y: top + height / 2 },
    diameter,
    color: style.backgroundColor,
    opacity: Number(style.opacity) * peak,
  };
}

interface Attempt {
  from: string;
  phase: "loading" | "navigating" | "revealing";
  covered: boolean;
  loaded: boolean;
  navigate: () => void;
  heading?: HTMLHeadingElement;
  notice: number;
  deadline: number;
}

function dispose(attempt: Attempt) {
  clearTimeout(attempt.notice);
  clearTimeout(attempt.deadline);
}

export function useBeginHandoff() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = useRef<Attempt | null>(null);
  const focusTarget = useRef<HTMLElement | null>(null);
  const [handoff, setHandoff] = useState<{
    orb: ReturnType<typeof readOrb>;
  } | null>(null);
  const [destination, setDestination] = useState<ViewportPoint | null>(null);
  const [showOpening, setShowOpening] = useState(false);
  const [failed, setFailed] = useState(false);

  const finish = useCallback((attempt: Attempt, focus?: HTMLElement) => {
    if (active.current !== attempt) return;
    active.current = null;
    dispose(attempt);
    focusTarget.current = focus ?? null;
    setHandoff(null);
    setShowOpening(false);
  }, []);

  useEffect(() => {
    if (handoff || !focusTarget.current) return;
    focusTarget.current.focus({ preventScroll: true });
    focusTarget.current = null;
  }, [handoff]);

  useEffect(() => {
    const cancel = () => {
      if (active.current) finish(active.current);
    };
    window.addEventListener("popstate", cancel);
    return () => {
      window.removeEventListener("popstate", cancel);
      if (!active.current) return;
      dispose(active.current);
      active.current = null;
    };
  }, [finish]);

  useEffect(() => {
    const attempt = active.current;
    if (!attempt || location.key === attempt.from) return;
    if (location.pathname !== ROUTES.BEGIN || attempt.phase === "loading") {
      finish(attempt);
    }
  }, [finish, location.key, location.pathname]);

  const advance = useCallback((attempt: Attempt) => {
    if (
      active.current !== attempt ||
      attempt.phase !== "loading" ||
      !attempt.covered ||
      !attempt.loaded
    )
      return;
    attempt.phase = "navigating";
    dispose(attempt);
    setShowOpening(false);
    attempt.navigate();
  }, []);

  const onCovered = useCallback(() => {
    const attempt = active.current;
    if (!attempt) return;
    attempt.covered = true;
    advance(attempt);
  }, [advance]);

  const onRevealed = useCallback(() => {
    const attempt = active.current;
    if (attempt?.phase === "revealing") finish(attempt, attempt.heading);
  }, [finish]);

  const start = (
    trigger: HTMLButtonElement,
    element: HTMLDivElement | null,
  ) => {
    if (active.current) return;
    const canAnimate =
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      typeof Element.prototype.animate === "function";
    const orb = canAnimate ? readOrb(element) : null;
    const attempt: Attempt = {
      from: location.key,
      phase: "loading",
      covered: !orb,
      loaded: false,
      navigate: () => navigate(ROUTES.BEGIN, { replace: true }),
      notice: 0,
      deadline: 0,
    };
    active.current = attempt;
    setDestination(null);
    setFailed(false);
    setHandoff({ orb });

    const fail = () => {
      if (active.current !== attempt) return;
      setFailed(true);
      finish(attempt, trigger);
    };
    attempt.notice = window.setTimeout(() => setShowOpening(true), 1500);
    attempt.deadline = window.setTimeout(fail, 8000);
    void loadBegin().then(() => {
      attempt.loaded = true;
      advance(attempt);
    }, fail);
  };

  const onBeginReady = useCallback(
    (heading: HTMLHeadingElement) => {
      const attempt = active.current;
      if (attempt?.phase !== "navigating") return;
      attempt.phase = "revealing";
      attempt.heading = heading;
      window.scrollTo({ top: 0, behavior: "instant" });
      if (!handoff?.orb) {
        finish(attempt, heading);
        return;
      }

      const form = heading.closest("form")?.getBoundingClientRect();
      setDestination(
        form
          ? {
              x: form.left + form.width / 2,
              y: Math.min(
                form.top + form.height * 0.72,
                window.innerHeight * 0.8,
              ),
            }
          : { x: window.innerWidth / 2, y: window.innerHeight * 0.75 },
      );
    },
    [finish, handoff],
  );

  return {
    handoff,
    onCovered,
    onRevealed,
    destination,
    showOpening,
    failed: failed && location.pathname === ROUTES.HOME,
    start,
    onBeginReady,
  };
}
