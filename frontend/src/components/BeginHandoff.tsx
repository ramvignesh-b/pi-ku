import { useLayoutEffect, useRef } from "react";
import type { useBeginHandoff } from "../hooks/useBeginHandoff";

type HandoffProps = Pick<
  ReturnType<typeof useBeginHandoff>,
  "handoff" | "onCovered" | "onRevealed" | "destination" | "showOpening"
>;

export function BeginHandoff({
  handoff,
  onCovered,
  onRevealed,
  destination,
  showOpening,
}: HandoffProps) {
  const orb = handoff?.orb;
  const light = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!(orb && light.current && veil.current)) return;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const scale = (Math.max(width, height) * 1.3) / orb.diameter;
    const open = { opacity: 0.36, transform: `scale(${scale})` };
    const lightFrames = destination
      ? [
          open,
          {
            opacity: 0,
            transform: `translate(${destination.x - orb.origin.x}px, ${destination.y - orb.origin.y}px) scale(0.72)`,
          },
        ]
      : [{ opacity: orb.opacity, transform: "scale(1)" }, open];
    const options: KeyframeAnimationOptions = {
      duration: destination ? 1050 : 600,
      easing: "ease-in-out",
      fill: "both",
    };
    const animations = [
      light.current.animate(lightFrames, options),
      veil.current.animate(
        destination
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1 }],
        options,
      ),
    ];
    void Promise.all(animations.map((animation) => animation.finished)).then(
      destination ? onRevealed : onCovered,
      () => {},
    );
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [orb, destination, onCovered, onRevealed]);

  if (!(orb || showOpening)) return null;

  return (
    <div
      data-testid="begin-handoff"
      className={`fixed inset-0 z-[200] overflow-clip ${orb ? "touch-none" : "pointer-events-none"}`}
    >
      {orb && (
        <>
          <div
            ref={veil}
            aria-hidden="true"
            className="grain absolute inset-0 bg-base-200 opacity-0"
          />
          <div
            ref={light}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: orb.origin.x,
              top: orb.origin.y,
              width: orb.diameter,
              height: orb.diameter,
              background: `radial-gradient(circle closest-side, ${orb.color}, color-mix(in oklab, ${orb.color} 68%, transparent) 42%, color-mix(in oklab, ${orb.color} 14%, transparent) 76%, transparent)`,
              opacity: orb.opacity,
            }}
          />
        </>
      )}
      {showOpening && (
        <p
          role="status"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-sm tracking-wider text-base-content/75"
        >
          Opening…
        </p>
      )}
    </div>
  );
}
