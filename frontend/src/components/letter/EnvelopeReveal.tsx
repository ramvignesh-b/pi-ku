import {
  animate,
  type MotionStyle,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import candle from "../../assets/envelope/candle.webp";
import stamp from "../../assets/envelope/stamp.webp";
import waxSeal from "../../assets/envelope/waxSeal.webp";
import "./EnvelopeReveal.css";

type Phase =
  | "front"
  | "flipping"
  | "sealed"
  | "opening"
  | "rising"
  | "ready"
  | "handed-over";

export interface EnvelopeRevealProps {
  recipient?: string;
  date?: string;
  onRevealComplete?: () => void;
  ignite?: boolean;
  onBurnComplete?: () => void;
  burnProgress?: MotionValue<number>;
  isInteractive?: boolean;
  insert?: ReactNode;
  // Exposes the visible paper so the parent can unfold from its exact rect.
  letterRef?: RefObject<HTMLButtonElement | null>;
}

function useEnvelopeBurn(
  ignite: boolean,
  onBurnComplete: EnvelopeRevealProps["onBurnComplete"],
  scrollProgress: EnvelopeRevealProps["burnProgress"],
  reduceMotion: boolean | null,
) {
  const localBurn = useMotionValue(0);
  useEffect(() => {
    if (!(ignite && onBurnComplete)) return;
    const animation = animate(localBurn, 1, {
      duration: reduceMotion ? 0 : 5,
      ease: "linear",
      onComplete: onBurnComplete,
    });
    return () => animation.stop();
  }, [ignite, localBurn, onBurnComplete, reduceMotion]);

  const burn = scrollProgress ?? localBurn;
  const progress = useTransform(burn, (value) =>
    reduceMotion ? Number(value >= 0.8) : value,
  );
  const maskImage = useTransform(progress, (value) => {
    if (value <= 0) return "none";
    if (value >= 1) return "linear-gradient(transparent, transparent)";
    return "radial-gradient(var(--burn-origin), transparent var(--burn-radius), #000 calc(var(--burn-radius) + 0.7%))";
  });
  const maskStyle = {
    maskImage,
    "--burn-radius": useTransform(progress, (value) => `${value * 100}%`),
    "--burn-char-width": useTransform(progress, [0, 1], ["2.5%", "6.5%"]),
    "--burn-char-opacity": useTransform(
      progress,
      [0, 0.035, 0.97, 1],
      [0, 1, 1, 0],
    ),
  } as MotionStyle;
  const candleOpacity = useTransform(burn, [0, 0.08, 0.82, 1], [0, 1, 1, 0]);
  return { maskStyle, candleOpacity };
}

function useEnvelopeOpening(
  canOpen: boolean,
  reduceMotion: boolean | null,
  onRevealComplete: EnvelopeRevealProps["onRevealComplete"],
  letterRef: EnvelopeRevealProps["letterRef"],
) {
  const [phase, setPhase] = useState<Phase>("front");
  const sealRef = useRef<HTMLButtonElement>(null);
  const localPaperRef = useRef<HTMLButtonElement>(null);
  const paperRef = letterRef ?? localPaperRef;
  const keyboard = useRef(false);
  const revealed = useRef(false);
  const canFlip = canOpen && phase === "front";
  const canBreakSeal = canOpen && phase === "sealed";
  const canRead = canOpen && phase === "ready";
  const isBack = phase !== "front";
  const paperUp =
    phase === "rising" || phase === "ready" || phase === "handed-over";
  const flapOpen = phase === "opening" || paperUp;
  const handedOver = phase === "handed-over";

  useLayoutEffect(() => {
    if (!(canOpen && keyboard.current)) return;
    if (phase === "sealed") sealRef.current?.focus({ preventScroll: true });
    if (phase === "ready") paperRef.current?.focus({ preventScroll: true });
  }, [canOpen, paperRef, phase]);

  const advance = (from: Phase, to: Phase) => {
    setPhase((current) => (current === from ? to : current));
  };

  const flip = (event: MouseEvent<HTMLButtonElement>) => {
    if (!canFlip) return;
    keyboard.current = event.detail === 0;
    setPhase(reduceMotion ? "sealed" : "flipping");
  };

  const open = (event: MouseEvent<HTMLButtonElement>) => {
    if (!canBreakSeal) return;
    keyboard.current = event.detail === 0;
    setPhase(reduceMotion ? "ready" : "opening");
  };

  const reveal = () => {
    if (!canRead || revealed.current) return;
    revealed.current = true;
    // The destination paper takes over in the same frame at this exact rect.
    setPhase("handed-over");
    onRevealComplete?.();
  };

  return {
    sealRef,
    paperRef,
    canFlip,
    canBreakSeal,
    canRead,
    isBack,
    flapOpen,
    paperUp,
    handedOver,
    advance,
    flip,
    open,
    reveal,
  };
}

export function EnvelopeReveal({
  recipient,
  date,
  onRevealComplete,
  ignite = false,
  onBurnComplete,
  burnProgress,
  isInteractive = true,
  insert,
  letterRef,
}: EnvelopeRevealProps) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion
    ? { flip: 0, flap: 0, rise: 0 }
    : { flip: 0.7, flap: 0.5, rise: 0.35 };
  const {
    sealRef,
    paperRef,
    canFlip,
    canBreakSeal,
    canRead,
    isBack,
    flapOpen,
    paperUp,
    handedOver,
    advance,
    flip,
    open,
    reveal,
  } = useEnvelopeOpening(
    isInteractive && !ignite,
    reduceMotion,
    onRevealComplete,
    letterRef,
  );
  const { maskStyle, candleOpacity } = useEnvelopeBurn(
    ignite,
    onBurnComplete,
    burnProgress,
    reduceMotion,
  );

  return (
    <div
      className="envelope"
      data-envelope-walkthrough={insert ? "" : undefined}
    >
      <motion.div className="envelope-mask" style={maskStyle}>
        <motion.div
          className="envelope-rotor"
          initial={false}
          animate={insert ? undefined : { rotateY: isBack ? 180 : 0 }}
          transition={{ duration: duration.flip, ease: "easeInOut" }}
          onAnimationComplete={() => advance("flipping", "sealed")}
        >
          <div className="envelope-face envelope-back">
            {insert ?? (
              <motion.button
                type="button"
                ref={paperRef}
                aria-label="Read the letter"
                aria-hidden={!canRead}
                disabled={!canRead}
                data-testid="envelope-letter"
                className="envelope-paper envelope-hotspot"
                initial={false}
                animate={
                  paperUp
                    ? { top: "0%", y: "-100%" }
                    : { top: "var(--envelope-notch)", y: "0%" }
                }
                transition={{
                  duration: duration.rise,
                  ease: "easeOut",
                }}
                style={{ visibility: handedOver ? "hidden" : undefined }}
                onAnimationComplete={() => advance("rising", "ready")}
                onClick={reveal}
              />
            )}
            <div className="envelope-folds" aria-hidden="true">
              <div className="envelope-fold-bottom" />
            </div>
            <motion.div
              className="envelope-flap"
              data-open={paperUp}
              aria-hidden="true"
              initial={false}
              animate={insert ? undefined : { rotateX: flapOpen ? 180 : 0 }}
              transition={{
                duration: duration.flap,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => advance("opening", "rising")}
            >
              <div className="envelope-flap-paper" />
            </motion.div>
            <button
              type="button"
              ref={sealRef}
              aria-label="Break the seal"
              aria-hidden={!canBreakSeal}
              disabled={!canBreakSeal}
              className="envelope-seal envelope-hotspot"
              data-open={flapOpen}
              onClick={open}
            >
              <img data-testid="wax-seal" src={waxSeal} alt="" />
            </button>
          </div>

          <button
            data-testid="envelope-front"
            type="button"
            aria-label={
              recipient ? `Flip envelope for ${recipient}` : "Flip envelope"
            }
            aria-hidden={!canFlip}
            disabled={!canFlip}
            className="envelope-face envelope-front envelope-hotspot"
            onClick={flip}
          >
            <span className="envelope-address">
              <span
                className="envelope-recipient"
                data-testid="envelope-recipient"
              >
                {recipient}
              </span>
              <span className="envelope-date font-display text-base-content/60">
                {date}
              </span>
            </span>
            <img src={stamp} alt="" className="envelope-stamp" />
            <svg
              className="envelope-postmark"
              aria-hidden="true"
              viewBox="0 0 100 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M2 6 C10 0 18 0 26 6 S42 12 50 6 66 0 74 6 90 12 98 6" />
              <path d="M2 13 C10 7 18 7 26 13 S42 19 50 13 66 7 74 13 90 19 98 13" />
              <path d="M2 20 C10 14 18 14 26 20 S42 26 50 20 66 14 74 20 90 26 98 20" />
            </svg>
          </button>
        </motion.div>
      </motion.div>
      {(ignite || burnProgress) && (
        <motion.div
          className="envelope-candle"
          style={{ opacity: candleOpacity }}
        >
          <img className="envelope-candle-body" src={candle} alt="" />
          <img className="envelope-candle-flame" src={candle} alt="" />
        </motion.div>
      )}
    </div>
  );
}
