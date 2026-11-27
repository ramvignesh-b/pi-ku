import { FeatherIcon, InfoIcon } from "@phosphor-icons/react";
import "./Home.css";
import { type LenisRef, ReactLenis } from "lenis/react";
import {
  animate,
  easeInOut,
  easeOut,
  type MotionStyle,
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import letterSample from "../assets/screenshots/letter.webp";
import Logo from "../components/Logo";
import { EnvelopeReveal } from "../components/letter/EnvelopeReveal";
import { HighlightedWord } from "../components/ui/HighlightedWord";
import Saajan from "../components/ui/Saajan";
import { WavyUnderline } from "../components/ui/WavyUnderline";
import { ROUTES } from "../config/routes";
import { formatDate } from "../utils/dateFormat";

import "@fontsource/architects-daughter/index.css";

const SCREEN_WIDTH = 440;
const SCREEN_IMAGE_TOP = -110;
const SCREEN_IMAGE_SCALE = SCREEN_WIDTH / 412;
const SCREEN_IMAGE_HEIGHT = 913 * SCREEN_IMAGE_SCALE;
const PHONE_FRAME_INSET = 5;
const PHONE_FRAME_WIDTH = SCREEN_WIDTH + 2 * PHONE_FRAME_INSET;
const PHONE_FRAME_HEIGHT =
  SCREEN_IMAGE_HEIGHT + SCREEN_IMAGE_TOP + 2 * PHONE_FRAME_INSET;
// Paper bounds in the 412 × 913 editor screenshot.
const PAPER_X = 13 * SCREEN_IMAGE_SCALE;
const PAPER_Y = 378 * SCREEN_IMAGE_SCALE;
const PAPER_WIDTH = 388 * SCREEN_IMAGE_SCALE;
const PAPER_HEIGHT = 513 * SCREEN_IMAGE_SCALE;
const PAPER_CENTER_OFFSET = PAPER_X + (PAPER_WIDTH - SCREEN_WIDTH) / 2;
// The border and padding offset the display from the phone frame.
const PAPER_TOP_IN_PHONE = PHONE_FRAME_INSET + SCREEN_IMAGE_TOP + PAPER_Y;
const PAPER_LEFT_EDGE = `${PAPER_X}px`;
const PAPER_RIGHT_EDGE = `${PAPER_X + PAPER_WIDTH}px`;
const PAPER_TOP_EDGE = `${PAPER_Y}px`;
const PAPER_BOTTOM_EDGE = `${PAPER_Y + PAPER_HEIGHT}px`;
const SCREEN_WITHOUT_PAPER = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0,
  ${PAPER_LEFT_EDGE} ${PAPER_TOP_EDGE}, ${PAPER_RIGHT_EDGE} ${PAPER_TOP_EDGE},
  ${PAPER_RIGHT_EDGE} ${PAPER_BOTTOM_EDGE}, ${PAPER_LEFT_EDGE} ${PAPER_BOTTOM_EDGE},
  ${PAPER_LEFT_EDGE} ${PAPER_TOP_EDGE})`;
const PAPER_RELEASE_START = 0.367;
const PAPER_LIFT_END = 0.395;
const PAPER_LIFT_DISTANCE = 128;
const PHONE_DROP_DISTANCE = 92;
const PHONE_ENTRANCE_DISTANCE = 105;
const INSERT_START = 0.425;
const INSERT_END = 0.46;
const PHONE_PAPER_WIDTH_RATIO = 0.76;
const INSERTED_PAPER_WIDTH_RATIO = 0.8;
const FLAP_CLOSE_START = 0.462;
const FLAP_CLOSED = 0.484;
const TITLE_EXIT = 0.105;
const TITLE_ZOOM_RANGE = [0.005, 0.06, TITLE_EXIT];
const OPENING_DURATION = 7.4;
const OPENING_SCROLL_END = 0.064;
const FUTURE_ME_START = 0.6425;
const BURN_START = 0.78;
const BURN_FADE_START = 0.9;
const BURN_COMPLETE = 0.92;
const BURN_END = 0.94;
const OUTRO_START = 0.945;
const WIDE_VIEWPORT = "(min-width: 48rem)";

function useScene(
  scroll: MotionValue<number>,
  start: number,
  end: number,
  {
    fadeStart,
    reduceMotion,
  }: { fadeStart: number; reduceMotion: boolean | null },
) {
  const progress = useTransform(scroll, [start, end], [0, 1]);
  const phases = [0, 0.24, fadeStart, 1];
  const transition = { ease: easeInOut };
  return {
    progress,
    style: {
      opacity: useTransform(progress, phases, [0, 1, 1, 0], transition),
      scale: useTransform(
        progress,
        phases,
        reduceMotion ? [1, 1, 1, 1] : [0.95, 1, 1, 0.99],
        transition,
      ),
      filter: useTransform(
        progress,
        phases,
        reduceMotion
          ? ["none", "none", "none", "none"]
          : ["blur(8px)", "blur(0px)", "blur(0px)", "blur(4px)"],
        transition,
      ),
    },
  };
}

function mixOrbColors(
  progress: number,
  start: number,
  end: number,
  from: string,
  to: string,
) {
  if (progress <= start) return from;
  if (progress >= end) return to;
  const percentage = easeInOut((progress - start) / (end - start)) * 100;
  return `color-mix(in oklab, ${from}, ${to} ${percentage}%)`;
}

function useOpeningReveal(scroll: MotionValue<number>) {
  const timed = useMotionValue(0);
  const scrolled = useTransform(scroll, [0, OPENING_SCROLL_END], [0, 1]);
  const progress = useTransform(() => Math.max(timed.get(), scrolled.get()));
  useEffect(() => {
    const animation = animate(timed, 1, {
      duration: OPENING_DURATION,
      ease: "linear",
    });
    return () => animation.stop();
  }, [timed]);
  return {
    headline: useTransform(progress, [0.06, 0.37], [0, 1], { ease: easeOut }),
    unsaid: useTransform(progress, [0.45, 0.92], [0, 1], { ease: easeInOut }),
  };
}

function useScrollEntrance(
  scroll: MotionValue<number>,
  {
    start,
    delay,
    duration,
    reduceMotion,
  }: {
    start: number;
    delay: number;
    duration: number;
    reduceMotion: boolean | null;
  },
) {
  const inView = useTransform(scroll, (value) => value >= start);
  const progress = useMotionValue(0);

  useEffect(() => {
    let animation: ReturnType<typeof animate> | undefined;
    const reveal = (visible: boolean) => {
      animation?.stop();
      animation = animate(progress, Number(visible), {
        delay: visible && !reduceMotion ? delay : 0,
        duration: reduceMotion ? 0 : visible ? duration : 0.58,
        ease: "linear",
      });
    };
    reveal(inView.get());
    const unsubscribe = inView.on("change", reveal);
    return () => {
      unsubscribe();
      animation?.stop();
    };
  }, [delay, duration, inView, progress, reduceMotion]);

  return progress;
}

interface HomeProps {
  onBegin: (trigger: HTMLButtonElement, orb: HTMLDivElement | null) => void;
  onBeginIntent: () => void;
  beginPending: boolean;
  beginFailed: boolean;
  hideOrb: boolean;
}

export default function Home({
  onBegin,
  onBeginIntent,
  beginPending,
  beginFailed,
  hideOrb,
}: HomeProps) {
  const sectionContainer1 = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<LenisRef>(null);
  const warmedBegin = useRef(false);
  const reduceMotion = useReducedMotion();
  const [isWide, setIsWide] = useState(() => matchMedia(WIDE_VIEWPORT).matches);
  const captionMotion = { fadeStart: isWide ? 0.76 : 0.85, reduceMotion };

  const { scrollYProgress: measuredProgress } = useScroll({
    target: sectionContainer1,
  });
  // Use the same measured progress for visuals and cues. A native view
  // timeline can place opacity and transforms ahead of the scripted beats.
  const scrollYProgress = useTransform(
    measuredProgress,
    (progress) => progress,
  );

  const captionRef = useRef<HTMLHeadingElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const captionShift = useMotionValue(0);
  const pocketHeight = useMotionValue(280);
  const pocketEntry = useMotionValue(0);
  const envelopeScale = useMotionValue(0.8);
  const phoneScale = useMotionValue(1);
  const phoneTop = useMotionValue(-94);
  useEffect(() => {
    const caption = captionRef.current;
    const envelope = envelopeRef.current;
    const envelopeFront =
      envelope?.querySelector<HTMLElement>(".envelope-front");
    const stage = caption?.offsetParent;
    const viewport = stage?.parentElement;
    if (!(caption && envelope && envelopeFront && stage && viewport)) return;

    const measure = () => {
      const wide = matchMedia(WIDE_VIEWPORT).matches;
      setIsWide(wide);
      const viewportTop = viewport.getBoundingClientRect().top;
      const captionBottom =
        stage.getBoundingClientRect().top -
        viewportTop +
        caption.offsetTop +
        caption.offsetHeight / 2;
      const paperAreaTop = captionBottom + 36;
      const availableHeight = Math.max(
        1,
        viewport.clientHeight - paperAreaTop - 16,
      );
      const envelopeWidth = envelopeFront.offsetWidth;
      const paperToEnvelope = envelopeWidth / PAPER_WIDTH;
      const frameBelowPaper = PHONE_FRAME_HEIGHT - PAPER_TOP_IN_PHONE;
      const scale = Math.min(
        wide ? 0.8 : 0.6,
        Math.max(1, viewport.clientWidth - 32) / envelopeWidth,
        availableHeight / (frameBelowPaper * paperToEnvelope),
      );
      const phoneToEnvelope = paperToEnvelope * PHONE_PAPER_WIDTH_RATIO;
      const displayedPhoneScale = phoneToEnvelope * scale;
      const paperTop =
        paperAreaTop +
        (availableHeight - frameBelowPaper * displayedPhoneScale) / 2;
      const frameTop = paperTop - PAPER_TOP_IN_PHONE * displayedPhoneScale;
      const envelopeRect = envelope.getBoundingClientRect();
      const envelopeTop =
        envelopeRect.top -
        viewportTop +
        envelopeRect.height / 2 -
        (envelope.offsetHeight * scale) / 2;

      captionShift.set(
        -Math.min(
          Math.max(0, captionBottom - caption.offsetHeight - 24),
          Math.max(0, captionBottom + 20 - frameTop),
        ),
      );
      pocketHeight.set(envelope.offsetHeight);
      // The open flap must also clear the viewport before the pocket enters.
      pocketEntry.set(
        (viewport.clientHeight - envelopeTop) / scale + envelope.offsetHeight,
      );
      envelopeScale.set(scale);
      phoneScale.set(phoneToEnvelope);
      phoneTop.set((frameTop - envelopeTop) / scale);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(caption);
    observer.observe(viewport);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    captionShift,
    envelopeScale,
    phoneScale,
    phoneTop,
    pocketHeight,
    pocketEntry,
  ]);
  const letterEmphasis = useTransform(scrollYProgress, [0.304, 0.386], [0, 1]);
  const phoneReveal = useScrollEntrance(scrollYProgress, {
    start: 0.31,
    delay: 0.5,
    duration: 1.45,
    reduceMotion,
  });
  // Finish the entrance before the paper lifts, even if the reader skips ahead.
  const phoneRevealOnScroll = useTransform(
    scrollYProgress,
    [0.354, PAPER_RELEASE_START],
    [0, 1],
  );
  const phoneArrival = useTransform(() =>
    easeOut(Math.max(phoneReveal.get(), phoneRevealOnScroll.get())),
  );
  const enteringPhoneTop = useTransform(
    () =>
      phoneTop.get() +
      PHONE_ENTRANCE_DISTANCE * (1 - phoneArrival.get()) * phoneScale.get(),
  );
  const liftProgress = useTransform(
    scrollYProgress,
    [PAPER_RELEASE_START, PAPER_LIFT_END],
    [0, 1],
    { ease: easeInOut },
  );
  const lift = useTransform(liftProgress, (progress) =>
    reduceMotion ? Number(progress >= 0.5) : progress,
  );
  const phoneY = useTransform(
    () =>
      enteringPhoneTop.get() +
      PHONE_DROP_DISTANCE * lift.get() * phoneScale.get(),
  );
  const phoneFade = useTransform(lift, [0.14, 1], [1, 0], {
    ease: easeOut,
  });
  const insertionProgress = useTransform(
    scrollYProgress,
    [INSERT_START, INSERT_END],
    [0, 1],
    {
      ease: easeInOut,
    },
  );
  const insertion = useTransform(insertionProgress, (progress) =>
    reduceMotion ? Number(progress >= 0.5) : progress,
  );
  const paperX = useTransform(
    () => PAPER_CENTER_OFFSET * phoneScale.get() * (1 - insertion.get()),
  );
  const paperY = useTransform(() => {
    const liftedTop =
      enteringPhoneTop.get() +
      (PAPER_TOP_IN_PHONE - PAPER_LIFT_DISTANCE * lift.get()) *
        phoneScale.get();
    return liftedTop + (132 - liftedTop) * insertion.get();
  });
  const paperScale = useTransform(() => {
    const widthRatio =
      PHONE_PAPER_WIDTH_RATIO +
      (INSERTED_PAPER_WIDTH_RATIO - PHONE_PAPER_WIDTH_RATIO) * insertion.get();
    return phoneScale.get() * (widthRatio / PHONE_PAPER_WIDTH_RATIO);
  });
  const pocketArrival = useTransform(
    scrollYProgress,
    [INSERT_START, 0.45],
    [0, 1],
    {
      ease: easeInOut,
    },
  );
  const pocketRise = useTransform(
    () =>
      pocketEntry.get() *
      (1 - (reduceMotion ? insertion.get() : pocketArrival.get())),
  );
  const pocketOpacity = useTransform(() =>
    reduceMotion ? insertion.get() : Number(pocketArrival.get() > 0),
  );
  const pocketOffset = useTransform(pocketRise, (value) => `${value}px`);
  const paperClip = useTransform(() => {
    if (insertion.get() === 0) return "none";
    const visible =
      (pocketHeight.get() + pocketRise.get() - 4 - paperY.get()) /
      paperScale.get();
    return `inset(0 0 ${Math.max(0, PAPER_HEIGHT - visible)}px 0)`;
  });
  const okay = useScene(scrollYProgress, 0.08, 0.205, captionMotion);
  const safe = useScene(scrollYProgress, 0.18, 0.29, captionMotion);
  const safeEmphasis = useTransform(safe.progress, [0.14, 0.74], [0, 1]);
  const letters = useScene(
    scrollYProgress,
    0.28,
    isWide ? 0.44 : INSERT_END,
    captionMotion,
  );
  const seal = useScene(scrollYProgress, INSERT_END, 0.56, captionMotion);
  const sealEmphasis = useTransform(
    scrollYProgress,
    [FLAP_CLOSED - 0.009, FLAP_CLOSED + 0.055],
    [0, 1],
  );
  const secureUnderline = useTransform(scrollYProgress, [0.474, 0.512], [0, 1]);
  const privateUnderline = useTransform(
    scrollYProgress,
    [0.499, 0.544],
    [0, 1],
  );
  const dearProgress = useTransform(scrollYProgress, [0.53, 0.655], [0, 1]);
  const dearEmphasis = useTransform(dearProgress, [0.12, 0.75], [0, 1]);
  const flapAngle = useTransform(
    scrollYProgress,
    [FLAP_CLOSE_START, FLAP_CLOSED],
    [180, 0],
    {
      ease: easeInOut,
    },
  );
  const flapRotation = useTransform(flapAngle, (angle) =>
    reduceMotion ? (angle >= 90 ? "180deg" : "0deg") : `${angle}deg`,
  );
  const flapLayer = useTransform(flapAngle, (angle) => (angle >= 90 ? 1 : 4));
  const flipAngle = useTransform(dearProgress, [0.14, 0.49], [180, 0], {
    ease: easeInOut,
  });
  const flipRotation = useTransform(flipAngle, (angle) =>
    reduceMotion ? (angle >= 90 ? "180deg" : "0deg") : `${angle}deg`,
  );
  const address = useScene(scrollYProgress, 0.53, 0.755, captionMotion);
  const futureProgress = useTransform(scrollYProgress, [0.63, 0.755], [0, 1]);
  const futureEmphasis = useTransform(futureProgress, [0.08, 0.74], [0, 1]);
  const burn = useScene(
    scrollYProgress,
    0.73,
    isWide ? 0.905 : BURN_END,
    captionMotion,
  );
  const burnEmphasis = useTransform(burn.progress, [0.14, 0.72], [0, 1]);
  const burnProgress = useTransform(
    scrollYProgress,
    [BURN_START, BURN_COMPLETE],
    [0, 1],
  );
  const earlierOrbColor = useTransform(scrollYProgress, (progress) => {
    if (progress < 0.48) {
      return mixOrbColors(
        progress,
        0.35,
        0.48,
        "var(--color-primary)",
        "var(--orb-purple)",
      );
    }
    if (progress < 0.58) {
      return mixOrbColors(
        progress,
        0.48,
        0.58,
        "var(--orb-purple)",
        "var(--orb-rose)",
      );
    }
    return mixOrbColors(
      progress,
      0.6,
      FUTURE_ME_START,
      "var(--orb-rose)",
      "var(--orb-green)",
    );
  });
  const futureOrbColor = useTransform(scrollYProgress, (progress) =>
    progress < BURN_FADE_START
      ? mixOrbColors(
          progress,
          BURN_START,
          0.88,
          "var(--orb-green)",
          "var(--orb-ember)",
        )
      : mixOrbColors(
          progress,
          BURN_FADE_START,
          OUTRO_START,
          "var(--orb-ember)",
          "var(--color-primary)",
        ),
  );
  const outroProgress = useScrollEntrance(scrollYProgress, {
    start: OUTRO_START,
    delay: 0.45,
    duration: 6,
    reduceMotion,
  });
  const outroEntry = useTransform(outroProgress, [0, 0.46], [0, 1], {
    ease: easeOut,
  });
  const outroEmphasis = useTransform(outroProgress, [0.52, 0.96], [0, 1]);
  const outroPhraseOpacity = useTransform(outroEmphasis, [0, 0.62], [0, 1], {
    ease: easeInOut,
  });
  const outroActions = useTransform(outroProgress, [0.8, 1], [0, 1], {
    ease: easeInOut,
  });
  const ctaScroll = useTransform(scrollYProgress, [0.96, 0.995], [0, 1], {
    ease: easeInOut,
  });
  const ctaProgress = useTransform(() =>
    Math.min(ctaScroll.get(), outroActions.get()),
  );
  const saajanScroll = useTransform(
    scrollYProgress,
    [0.95, 0.98, 1],
    [0, 0.7, 1],
    { ease: easeInOut },
  );
  const saajanOpacity = useTransform(
    () => saajanScroll.get() * outroActions.get(),
  );
  const { headline, unsaid } = useOpeningReveal(scrollYProgress);
  const [isFutureMe, setIsFutureMe] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setIsFutureMe(value >= FUTURE_ME_START);
    if (value >= OUTRO_START && !warmedBegin.current) {
      warmedBegin.current = true;
      onBeginIntent();
    }
  });
  useLayoutEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!(beginPending && lenis)) return;
    lenis.stop();
    return () => lenis.start();
  }, [beginPending]);
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{ lerp: 0.04, wheelMultiplier: 1, smoothWheel: true }}
    >
      <section
        ref={sectionContainer1}
        className="home-story relative w-full h-[max(1740svh,670rem)] md:h-[1540vh] bg-base-100 font-serif"
      >
        <Link
          to={ROUTES.UNLOCK}
          aria-label="Unlock"
          className="home-quill-cta group btn btn-ghost absolute top-2 right-3 z-40 h-11 min-w-11 gap-1 rounded-full px-2 text-primary/62! no-underline! duration-700 ease-in-out hover:text-primary! focus-visible:text-primary! motion-reduce:transition-none md:btn-lg md:top-6 md:right-6 md:h-14 md:min-w-14 md:gap-0 md:px-0 md:text-primary/24!"
        >
          <span className="grid size-5 shrink-0 place-items-center md:size-14">
            <FeatherIcon
              aria-hidden="true"
              className="size-4 md:size-8"
              weight="duotone"
            />
          </span>
          <span
            aria-hidden="true"
            className="grid grid-cols-[1fr] ease-in-out md:grid-cols-[0fr] md:opacity-0 md:transition-[grid-template-columns,opacity] md:duration-700 md:group-hover:grid-cols-[1fr] md:group-hover:opacity-100 md:group-focus-visible:grid-cols-[1fr] md:group-focus-visible:opacity-100 motion-reduce:transition-none"
          >
            <span className="overflow-hidden whitespace-nowrap font-hand text-xs font-normal md:[font-size:inherit] md:[font-weight:inherit]">
              <span className="md:pr-5">Unlock</span>
            </span>
          </span>
        </Link>
        <div className="sticky top-0 h-dvh md:h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          {/* Beat 1: Initial Header with Mount Entrance + Scroll Zoom */}
          <motion.div
            className="absolute flex flex-col items-center justify-center text-center pointer-events-none motion-reduce:transform-none! motion-reduce:filter-none!"
            style={{
              display: useTransform(scrollYProgress, (value) =>
                value >= TITLE_EXIT ? "none" : "flex",
              ),
              opacity: useTransform(
                scrollYProgress,
                TITLE_ZOOM_RANGE,
                [1, 0.85, 0],
                { ease: easeInOut },
              ),
              scale: useTransform(
                scrollYProgress,
                TITLE_ZOOM_RANGE,
                [1, 1.3, 5],
                { ease: easeInOut },
              ),
              y: useTransform(scrollYProgress, [0.06, TITLE_EXIT], [0, -40], {
                ease: easeInOut,
              }),
              filter: useTransform(
                scrollYProgress,
                TITLE_ZOOM_RANGE,
                ["blur(0px)", "blur(1px)", "blur(10px)"],
                { ease: easeInOut },
              ),
            }}
          >
            <motion.h1
              style={{
                opacity: headline,
                scale: useTransform(headline, [0, 1], [0.94, 1]),
                filter: useTransform(
                  headline,
                  [0, 1],
                  ["blur(8px)", "blur(0px)"],
                ),
              }}
              className="text-4xl md:text-6xl px-6 text-(--home-reflection-ink) tracking-normal word-spacing-editorial motion-reduce:transform-none! motion-reduce:filter-none!"
            >
              You've been carrying something
            </motion.h1>
            <motion.h2
              style={{
                opacity: unsaid,
                scale: useTransform(unsaid, [0, 1], [0.96, 1]),
                filter: useTransform(
                  unsaid,
                  [0, 1],
                  ["blur(6px)", "blur(0px)"],
                ),
              }}
              className="text-primary text-5xl md:text-7xl mt-4 not-italic font-display font-extralight tracking-normal motion-reduce:transform-none! motion-reduce:filter-none!"
            >
              unsaid
            </motion.h2>
          </motion.div>

          {/* Beat 2: "and that's okay..." */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={okay.style}
          >
            <div className="mt-6 text-4xl md:text-6xl text-(--home-ink-muted) italic font-serif tracking-normal word-spacing-editorial">
              and that's okay...
            </div>
          </motion.div>

          {/* Beat 3: Logo + "is a safe space, where you can" */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={safe.style}
          >
            <Logo type="logo" scale={1.5} ul={true} />
            <motion.div className="font-serif italic font-light mt-6 text-4xl md:text-6xl tracking-normal word-spacing-editorial">
              is a{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={safeEmphasis}
                  className="font-kalnia font-bold text-primary not-italic"
                >
                  safe space
                </HighlightedWord>
                <WavyUnderline
                  progress={safeEmphasis}
                  color="var(--color-primary)"
                />
              </span>
              ,<br />
              <motion.span
                className="text-2xl md:text-5xl font-hand tracking-widest not-italic text-(--home-ink-muted)"
                style={{
                  opacity: useTransform(safe.progress, [0.26, 0.7], [0, 0.9], {
                    ease: easeInOut,
                  }),
                }}
              >
                where you can
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Middle Action Narrative Stages */}
          <div className="relative z-30 w-full max-w-5xl h-1/2 flex items-center justify-center mt-20 pointer-events-none">
            {/* Beat 4: "pen down your unsaid words into letters." */}
            <motion.h2
              ref={captionRef}
              style={{ ...letters.style, y: captionShift }}
              className="absolute top-[calc(50%-min(13vh,112px))] -translate-y-1/2 text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              pen down your unsaid words into{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={letterEmphasis}
                  className="font-display text-primary font-extralight"
                >
                  letters
                </HighlightedWord>
                <WavyUnderline
                  progress={letterEmphasis}
                  color="var(--color-primary)"
                />
              </span>
              .
            </motion.h2>

            {/* Beat 5: "seal it secure and private." */}
            <motion.h2
              style={seal.style}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              seal it{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={sealEmphasis}
                  className="text-success font-pixel tracking-wider"
                >
                  secure
                </HighlightedWord>
                <WavyUnderline
                  progress={secureUnderline}
                  color="var(--color-success)"
                />
              </span>{" "}
              and{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={sealEmphasis}
                  className="text-info font-pixel tracking-wider"
                >
                  private
                </HighlightedWord>
                <WavyUnderline
                  progress={privateUnderline}
                  color="var(--color-info)"
                />
              </span>
              .
            </motion.h2>

            {/* Beat 6: "send it to someone dear" (Line 1) / "or yourself in the future." (Line 2) */}
            <motion.h2
              style={address.style}
              className="absolute text-[clamp(1.875rem,8vw,2.25rem)] md:text-6xl text-center px-6 md:px-10 leading-tight max-w-4xl tracking-normal word-spacing-editorial"
            >
              <span className="inline-block md:whitespace-nowrap">
                send it to{" "}
                <span className="relative inline-block mx-0.5 whitespace-nowrap">
                  <HighlightedWord
                    progress={dearEmphasis}
                    className="font-display text-accent"
                  >
                    someone dear
                  </HighlightedWord>
                  <WavyUnderline
                    progress={dearEmphasis}
                    color="var(--color-accent)"
                  />
                </span>
              </span>
              <motion.span
                className="block mt-4 sm:mt-2 motion-reduce:transform-none!"
                style={{
                  opacity: useTransform(futureProgress, [0, 0.32], [0, 1], {
                    ease: easeInOut,
                  }),
                  scale: useTransform(futureProgress, [0, 0.32], [0.96, 1], {
                    ease: easeInOut,
                  }),
                }}
              >
                <span className="inline-block whitespace-nowrap">
                  <span className="font-serif text-(--home-ink-muted)">or</span>{" "}
                  <span className="relative sm:inline-block sm:mx-0.5">
                    <HighlightedWord
                      progress={futureEmphasis}
                      className="font-display text-success"
                    >
                      yourself
                    </HighlightedWord>{" "}
                    <br className="sm:hidden" />
                    <span className="relative inline-block">
                      <HighlightedWord
                        progress={futureEmphasis}
                        className="font-display text-success"
                      >
                        in the future
                      </HighlightedWord>
                      <WavyUnderline
                        progress={futureEmphasis}
                        color="var(--color-success)"
                        className="sm:hidden"
                      />
                    </span>
                    <WavyUnderline
                      progress={futureEmphasis}
                      color="var(--color-success)"
                      className="hidden sm:block"
                    />
                  </span>
                  <span>.</span>
                </span>
              </motion.span>
            </motion.h2>

            {/* Beat 7: "and even burn it to release the burden." */}
            <motion.h2
              style={burn.style}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              and even{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={burnEmphasis}
                  className="font-display text-error"
                >
                  burn it
                </HighlightedWord>
                <WavyUnderline
                  progress={burnEmphasis}
                  color="var(--color-error)"
                />
              </span>{" "}
              to release the burden.
            </motion.h2>

            {/* Beat 8: Outro text */}
            <motion.h2
              className="italic absolute text-4xl md:text-6xl text-center px-10 leading-tight text-(--home-reflection-ink) tracking-normal word-spacing-editorial motion-reduce:transform-none! motion-reduce:filter-none!"
              style={{
                opacity: outroEntry,
                scale: useTransform(outroEntry, [0, 1], [0.94, 1]),
                filter: useTransform(
                  outroEntry,
                  [0, 1],
                  ["blur(8px)", "blur(0px)"],
                ),
              }}
            >
              You've been carrying it{" "}
              <motion.span
                className="inline-block whitespace-nowrap motion-reduce:transform-none!"
                style={{
                  opacity: outroPhraseOpacity,
                  scale: useTransform(outroPhraseOpacity, [0, 1], [0.96, 1]),
                }}
              >
                <span className="relative inline-block">
                  <HighlightedWord
                    progress={outroEmphasis}
                    className="font-display text-primary not-italic"
                  >
                    long enough
                  </HighlightedWord>
                  <WavyUnderline
                    progress={outroEmphasis}
                    color="var(--color-primary)"
                    className="translate-y-1 md:translate-y-1.5"
                  />
                </span>
                .
              </motion.span>
            </motion.h2>

            {/* CTA Action Buttons */}
            <motion.div
              className="z-100 absolute -bottom-12 md:bottom-0 font-hand flex flex-wrap md:flex-nowrap gap-4 md:gap-12 justify-center pointer-events-auto motion-reduce:transform-none!"
              style={{
                opacity: ctaProgress,
                scale: useTransform(ctaProgress, [0, 1], [0.96, 1]),
                visibility: useTransform(ctaProgress, (value) =>
                  value > 0 ? "visible" : "hidden",
                ),
              }}
            >
              <button
                className="btn btn-ghost btn-wide md:btn-xl rounded-full bg-primary/12 hover:bg-primary/20 font-extralight motion-safe:hover:-translate-y-1 transition-all duration-900 ease-in-out motion-reduce:transition-none cursor-pointer"
                type="button"
                onClick={() => navigate(ROUTES.ABOUT, { replace: true })}
              >
                <InfoIcon
                  aria-hidden="true"
                  className="size-4.5 shrink-0 text-primary md:size-6"
                />
                Tell me More
              </button>
              <button
                className="home-ready-cta btn rounded-full btn-primary btn-wide md:btn-xl motion-safe:hover:-translate-y-1 transition-all duration-900 ease-in-out motion-reduce:transition-none cursor-pointer"
                type="button"
                onClick={(event) =>
                  onBegin(event.currentTarget, orbRef.current)
                }
              >
                <FeatherIcon
                  aria-hidden="true"
                  className="size-4.5 shrink-0 md:size-6"
                  weight="duotone"
                />
                I'm ready
              </button>
              {beginFailed && (
                <p
                  role="status"
                  className="absolute inset-x-0 top-full mt-2 text-center font-serif text-xs text-(--home-ink)"
                >
                  Couldn’t open Begin. Try again.
                </p>
              )}
            </motion.div>
          </div>

          {/* Floating Visual Elements (Phone Mockup, Envelope, Saajan, Ambient Orb) */}
          <div className="relative h-1/4 w-full flex flex-col items-center justify-center pointer-events-none">
            {/* Envelope Reveal Component */}
            <motion.div
              ref={envelopeRef}
              className="home-envelope absolute z-10"
              style={
                {
                  scale: envelopeScale,
                  opacity: useTransform(
                    scrollYProgress,
                    [
                      0.28,
                      0.33,
                      isWide ? BURN_FADE_START : BURN_COMPLETE,
                      BURN_END,
                    ],
                    [0, 1, 1, 0],
                    { ease: easeInOut },
                  ),
                  "--pocket-opacity": pocketOpacity,
                  "--pocket-rise": pocketOffset,
                  "--flap": flapRotation,
                  "--flap-layer": flapLayer,
                  "--wax": useTransform(
                    scrollYProgress,
                    [FLAP_CLOSED + 0.002, FLAP_CLOSED + 0.026],
                    [0, 1],
                    { ease: easeInOut },
                  ),
                  "--flip": flipRotation,
                } as MotionStyle
              }
            >
              <div className="relative" inert>
                <EnvelopeReveal
                  isInteractive={false}
                  burnProgress={burnProgress}
                  insert={
                    <>
                      <motion.div
                        className="home-letter-mockup absolute z-1 origin-top"
                        style={{
                          y: phoneY,
                          scale: phoneScale,
                          opacity: phoneArrival,
                        }}
                      >
                        <motion.div
                          className="home-phone"
                          style={{
                            width: PHONE_FRAME_WIDTH,
                            height: PHONE_FRAME_HEIGHT,
                            padding: PHONE_FRAME_INSET,
                            opacity: phoneFade,
                          }}
                        >
                          <div className="home-phone-camera" />
                          <div className="home-phone-display">
                            <img
                              src={letterSample}
                              alt="Letter sample"
                              style={{
                                top: SCREEN_IMAGE_TOP,
                                clipPath: SCREEN_WITHOUT_PAPER,
                              }}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                      <div
                        aria-hidden="true"
                        className="home-paper-track absolute inset-y-0 inset-x-1.5 z-2 flex justify-center overflow-x-clip"
                      >
                        <motion.div
                          className="home-loose-letter absolute origin-top"
                          style={{
                            width: PAPER_WIDTH,
                            height: PAPER_HEIGHT,
                            backgroundImage: `url(${letterSample})`,
                            backgroundSize: `${SCREEN_WIDTH}px auto`,
                            // Offset the editor screenshot to the paper's top left corner.
                            backgroundPosition: `-${PAPER_X}px -${PAPER_Y}px`,
                            x: paperX,
                            y: paperY,
                            scale: paperScale,
                            opacity: phoneArrival,
                            clipPath: paperClip,
                          }}
                        />
                      </div>
                    </>
                  }
                  recipient={isFutureMe ? "future me" : "someone dear"}
                  date={formatDate(new Date().toISOString())}
                />
              </div>
            </motion.div>

            {/* Saajan Persona Message */}
            <motion.div
              className="fixed bottom-0 z-10 font-sans -mb-6 md:scale-100 md:mb-0"
              style={{
                opacity: saajanOpacity,
                y: useTransform(scrollYProgress, [0.95, 1], [40, -10], {
                  ease: easeInOut,
                }),
              }}
            >
              <Saajan
                message={
                  "I think we forget things\nif there is nobody to tell them."
                }
                position="top"
              />
            </motion.div>

            {/* Ambient Glowing Color-Morphing Orb (On top of envelope) */}
            <motion.div
              ref={orbRef}
              className="home-ambient-orb z-20 size-[clamp(4.75rem,29vw,9rem)] md:size-52 shrink-0 rounded-full blur-2xl md:blur-3xl pointer-events-none"
              data-future-me={isFutureMe || undefined}
              style={
                {
                  visibility: hideOrb ? "hidden" : undefined,
                  "--orb-earlier-color": earlierOrbColor,
                  "--orb-future-color": futureOrbColor,
                  scale: useTransform(
                    scrollYProgress,
                    [0, BURN_FADE_START, OUTRO_START],
                    [0.8, 2.43, 1.1],
                  ),
                  "--orb-opacity": useTransform(
                    scrollYProgress,
                    [BURN_FADE_START, OUTRO_START],
                    [0.3, 0.045],
                    { ease: easeInOut },
                  ),
                } as MotionStyle
              }
            />
          </div>
        </div>
      </section>
    </ReactLenis>
  );
}
