import { WavesIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { useEffect, useState } from "react";
import candle from "../../assets/envelope/candle.webp";
import stamp from "../../assets/envelope/stamp.webp";
import waxSeal from "../../assets/envelope/waxSeal.webp";

// the letter waits for the flap to finish opening before it rises
const FLAP_MS = 800;

export interface EnvelopeRevealProps {
  recipient?: string;
  date?: string;
  onRevealComplete: () => void;
  ignite: boolean;
  isFlip?: boolean;
  isInteractive?: boolean;
  openFlap?: boolean;
  // exposes the letter so a parent can pick the expansion up from its exact rect
  letterRef?: React.Ref<HTMLButtonElement>;
}

export function EnvelopeReveal({
  recipient,
  date,
  onRevealComplete,
  ignite,
  isFlip,
  isInteractive = true,
  openFlap = false,
  letterRef,
}: EnvelopeRevealProps) {
  const [isFlipped, setIsFlipped] = useState(!!isFlip);
  const [isFlapOpen, setIsFlapOpen] = useState(!!openFlap);
  const [hasRisen, setHasRisen] = useState(!!openFlap);
  // once the parent's own paper takes over, this one stops painting at once
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    setIsFlipped(!!isFlip);
  }, [isFlip]);

  const [burn, setBurn] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setIsFlapOpen(openFlap);
  }, [openFlap]);

  useEffect(() => {
    if (!ignite) {
      setBurn({ width: 0, height: 0 });
      return;
    }
    const burnInterval = setInterval(() => {
      setBurn((prev) => ({ width: prev.width + 4, height: prev.height + 6 }));
    }, 100);
    return () => clearInterval(burnInterval);
  }, [ignite]);

  // held in state rather than a CSS delay, so hovering the letter never has to
  // wait out the flap's timing
  useEffect(() => {
    if (!isFlapOpen) {
      setHasRisen(false);
      return;
    }
    const timer = setTimeout(() => setHasRisen(true), FLAP_MS);
    return () => clearTimeout(timer);
  }, [isFlapOpen]);

  // The peek is owned by the envelope, not the letter. Hovering the letter
  // itself flickers: it rises into the open flap, whose checkbox sits above it
  // and takes the hover, so the letter drops back and rises again forever.
  const peekMargin = !hasRisen
    ? "mt-2"
    : `-mt-12 ${isInteractive ? "group-hover:-mt-24" : ""}`;

  const handleClick = () => {
    if (handedOver || !isInteractive) return;
    setHandedOver(true);
    onRevealComplete();
  };

  return (
    <>
      <div
        className={`group pointer-events-auto relative h-70 w-105 transform-3d transition-transform duration-2000 ${isFlipped ? "rotate-y-180" : ""}`}
      >
        <div
          className={` flex backface-hidden rotate-y-180 justify-center transition-all duration-1000 ${isFlipped ? "" : "pointer-events-none"}`}
        >
          <div
            id="env-top"
            className="z-4 delay-500 transition-all duration-2000 absolute peer h-40 w-54 mt-0 bg-base-200 mask mask-triangle-2 scale-x-234 has-checked:scale-y-[-1] has-checked:-translate-y-full has-checked:z-1 has-checked:duration-1000"
          >
            <input
              type="checkbox"
              aria-label="Open the envelope"
              className="transition checkbox absolute h-full w-full text-transparent bg-transparent z-100"
              checked={isFlapOpen}
              onChange={() => setIsFlapOpen((prev) => !prev)}
              disabled={!isInteractive}
            />
          </div>
          <button
            type="button"
            aria-label="Break the seal"
            className={
              "translate-y-24 delay-2000 absolute z-6 peer-has-checked:pointer-events-none peer-has-checked:opacity-0 peer-has-checked:delay-0 transition-opacity duration-1000 cursor-pointer"
            }
            onClick={() => setIsFlapOpen((prev) => !prev)}
          >
            <img data-testid="wax-seal" src={waxSeal} alt="" />
          </button>
          <button
            type="button"
            id="letter"
            ref={letterRef}
            aria-label="Read the letter"
            data-testid="envelope-letter"
            className={`absolute mx-auto transition-all duration-600 h-55 w-105 bg-paper cursor-pointer ${hasRisen ? "z-1" : ""} ${peekMargin}`}
            // the parent's paper picks up from this exact rect, so this one has to
            // stop painting in the same frame — no fade, or both would show
            style={handedOver ? { opacity: 0, transition: "none" } : undefined}
            onClick={handleClick}
          ></button>

          <div
            id="env-right"
            className="absolute h-70 w-105 bg-base-300 mask mask-triangle-3 -mr-48 z-3 pointer-events-none"
          ></div>
          <div
            id="env-left"
            className="absolute h-70 w-105 bg-base-300 mask mask-triangle-4 -ml-48 z-3 pointer-events-none"
          ></div>
          <div
            id="env-bottom"
            className="absolute h-70 w-45 bg-base-200 mask mask-triangle-2 scale-y-[-1] mt-15 scale-x-240 z-3 pointer-events-none"
          ></div>
        </div>

        <button
          id="env-front"
          data-testid="envelope-front"
          type="button"
          disabled={!isInteractive}
          className={`text-left p-10 absolute inset-0 backface-hidden w-110 bg-base-200 z-99 rounded-md -translate-x-2 ${isFlipped ? "pointer-events-none" : ""}`}
          onClick={() => setIsFlipped((prev) => !prev)}
        >
          <span className={"text-neutral-content/60 font-xs font-display"}>
            to
          </span>
          <h1
            data-testid="envelope-recipient"
            className="text-3xl font-bold text-base-content"
          >
            {recipient}
          </h1>
          <p className="text-base-content/60 font-display mt-8">{date}</p>
          <img
            src={stamp}
            alt={"stamp"}
            className={
              "z-0 rotate-6 opacity-80 text-accent absolute mt-0 mr-1 top-4 right-0"
            }
          />
          <WavesIcon
            className={"absolute mt-0 mr-12 top-18 right-8 text-primary"}
            size={50}
          />
          <WavesIcon
            className={"absolute mt-0 mr-4 top-18 right-8 text-primary"}
            size={50}
          />
        </button>
      </div>
      {ignite && (
        <>
          <div className="absolute w-115 h-70 z-100 overflow-hidden flex align-baseline -translate-y-70 -translate-x-5">
            <div
              className="absolute z-1000 border-2 border-amber-200 -bottom-3 -right-3 w-0 h-0  transition-all duration-500 bg-base-100 rounded-tl-full rounded-bl-full origin-bottom-right"
              style={{
                width: 2 * burn.width,
                height: 2 * burn.height,
              }}
            ></div>
          </div>
          <div className="absolute z-1001 bottom-0 right-0 translate-x-15 translate-y-20">
            <img src={candle} alt="candle" />
          </div>
        </>
      )}
    </>
  );
}
