import { useAnimationControls, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type RevealState = "SEALED" | "REVEALED" | "BURNED" | "BURNING";

// The reveal, in beats. The letter comes out of the envelope widthways first
// and only then unfolds top and bottom, the way a folded sheet opens — so the
// two axes are deliberately staggered rather than scaled together.
const WIDEN_S = 1;
const EXPAND_S = 2.2;
const INK_S = 1.6;
// a canvas that never reports ready still gets its words
const INK_FALLBACK_MS = 1500;

// Drives the reveal. The letter is mounted and measured behind the
// envelope from the start, so opening it is a transform on a box that is
// already its final size — no mount, no reflow. The envelope hands over the
// exact rect its own letter occupied, and the expansion carries on from there.
export function useReveal(
  revealState: RevealState,
  setRevealState: (state: RevealState) => void,
) {
  const paperRef = useRef<HTMLDivElement>(null);
  const envelopeLetterRef = useRef<HTMLButtonElement>(null);
  const wasRevealedRef = useRef(false);

  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [inkFallbackElapsed, setInkFallbackElapsed] = useState(false);

  const reduceMotion = useReducedMotion();
  const paperControls = useAnimationControls();

  const isRevealed = revealState === "REVEALED";
  const showInk = isRevealed && (isCanvasReady || inkFallbackElapsed);

  // The expansion is this paper, not a stand-in that gets swapped for it: the
  // card starts folded onto the envelope's letter rect and unfolds to its own.
  // One element at full opacity throughout, so nothing ever double-paints.
  const handleRevealComplete = useCallback(() => {
    const from = envelopeLetterRef.current?.getBoundingClientRect();
    const to = paperRef.current?.getBoundingClientRect();

    paperControls.set(
      from && to && to.width > 0 && to.height > 0
        ? {
            opacity: 1,
            x: from.left - to.left,
            y: from.top - to.top,
            scaleX: from.width / to.width,
            scaleY: from.height / to.height,
          }
        : { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 },
    );
    setRevealState("REVEALED");
    const widen = { duration: WIDEN_S, ease: [0.33, 0, 0.2, 1] as const };
    const unfold = { duration: EXPAND_S, ease: [0.65, 0, 0.35, 1] as const };

    paperControls.start({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { x: widen, scaleX: widen, y: unfold, scaleY: unfold },
    });
  }, [paperControls, reduceMotion, setRevealState]);

  // nothing to read until the letter is out
  useEffect(() => {
    if (isRevealed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isRevealed]);

  // burning re-seals the letter, which puts the envelope back in view
  useEffect(() => {
    if (isRevealed) {
      wasRevealedRef.current = true;
      return;
    }
    if (!wasRevealedRef.current) return;
    wasRevealedRef.current = false;
    paperControls.set({ opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 });
    window.scrollTo(0, 0);
  }, [isRevealed, paperControls]);

  useEffect(() => {
    if (!isRevealed || isCanvasReady) return;
    const timer = setTimeout(
      () => setInkFallbackElapsed(true),
      INK_FALLBACK_MS,
    );
    return () => clearTimeout(timer);
  }, [isRevealed, isCanvasReady]);

  return {
    paperRef,
    envelopeLetterRef,
    paperControls,
    handleRevealComplete,
    markCanvasReady: useCallback(() => setIsCanvasReady(true), []),
    isRevealed,
    showInk,
    // the words follow the paper rather than arriving with it
    inkTransition: {
      duration: reduceMotion ? 0 : INK_S,
      delay: showInk && !reduceMotion ? EXPAND_S : 0,
      ease: "easeOut" as const,
    },
    // The envelope stays put and stays opaque: the letter is drawn out and
    // unfolds on top of it. It only leaves once the letter covers it, so what
    // fades is the border around the letter, over the page — never through it.
    envelopeExit: {
      opacity: 0,
      transition: reduceMotion
        ? { duration: 0 }
        : { delay: 1.2, duration: 0.9, ease: "easeOut" as const },
    },
  };
}
