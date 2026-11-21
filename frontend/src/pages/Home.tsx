import { FeatherIcon, InfoIcon } from "@phosphor-icons/react";
import "./Home.css";
import { ReactLenis } from "lenis/react";
import {
  animate,
  easeInOut,
  easeOut,
  type MotionStyle,
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
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
const SCREEN_IMAGE_TOP = -240;
const SCREEN_IMAGE_SCALE = SCREEN_WIDTH / 412;
// Paper bounds in the 412 × 913 editor screenshot.
const PAPER_X = 13 * SCREEN_IMAGE_SCALE;
const PAPER_Y = 378 * SCREEN_IMAGE_SCALE;
const PAPER_WIDTH = 388 * SCREEN_IMAGE_SCALE;
const PAPER_HEIGHT = 513 * SCREEN_IMAGE_SCALE;
const PAPER_CENTER_OFFSET = PAPER_X + (PAPER_WIDTH - SCREEN_WIDTH) / 2;
// The phone's border and padding put the display 11px inside the frame.
const PAPER_TOP_IN_PHONE = 11 + SCREEN_IMAGE_TOP + PAPER_Y;
const PAPER_LEFT_EDGE = `${PAPER_X}px`;
const PAPER_RIGHT_EDGE = `${PAPER_X + PAPER_WIDTH}px`;
const PAPER_TOP_EDGE = `${PAPER_Y}px`;
const PAPER_BOTTOM_EDGE = `${PAPER_Y + PAPER_HEIGHT}px`;
const SCREEN_WITHOUT_PAPER = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0,
  ${PAPER_LEFT_EDGE} ${PAPER_TOP_EDGE}, ${PAPER_RIGHT_EDGE} ${PAPER_TOP_EDGE},
  ${PAPER_RIGHT_EDGE} ${PAPER_BOTTOM_EDGE}, ${PAPER_LEFT_EDGE} ${PAPER_BOTTOM_EDGE},
  ${PAPER_LEFT_EDGE} ${PAPER_TOP_EDGE})`;
const PAPER_RELEASE_START = 0.367;
const INSERT_START = 0.419;
const INSERTED_PAPER_WIDTH_RATIO = 0.8;
const FLAP_CLOSE_START = 0.32;
const FLAP_CLOSED = 0.4;
const TITLE_EXIT = 0.105;
const TITLE_ZOOM_RANGE = [0.005, 0.06, TITLE_EXIT];
const BURN_START = 0.78;
const BURN_END = 0.94;

function useScene(scroll: MotionValue<number>, start: number, end: number) {
  const progress = useTransform(scroll, [start, end], [0, 1]);
  const phases = [0, 0.2, 0.8, 1];
  return {
    progress,
    style: {
      opacity: useTransform(progress, phases, [0, 1, 1, 0]),
      y: useTransform(progress, phases, [25, 0, 0, -20]),
      scale: useTransform(progress, phases, [0.98, 1, 1, 0.98]),
      filter: useTransform(progress, phases, [
        "blur(14px)",
        "blur(0px)",
        "blur(0px)",
        "blur(6px)",
      ]),
    },
  };
}

function useOpeningReveal(
  scroll: MotionValue<number>,
  duration: number,
  delay: number,
) {
  const timed = useMotionValue(0);
  const scrolled = useTransform(scroll, [0, 0.012], [0, 1]);
  const progress = useTransform(() => Math.max(timed.get(), scrolled.get()));
  useEffect(() => {
    const animation = animate(timed, 1, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => animation.stop();
  }, [timed, duration, delay]);
  return progress;
}

export default function Home() {
  const sectionContainer1 = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionContainer1,
  });

  const captionRef = useRef<HTMLHeadingElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const captionShift = useMotionValue(0);
  const pocketHeight = useMotionValue(280);
  const envelopeScale = useMotionValue(0.8);
  const phoneScale = useMotionValue(1);
  const phoneTop = useMotionValue(-94);
  useEffect(() => {
    const caption = captionRef.current;
    const envelope = envelopeRef.current;
    const envelopeFront = envelope?.querySelector<HTMLElement>("#env-front");
    const stage = caption?.offsetParent;
    const viewport = stage?.parentElement;
    if (!(caption && envelope && envelopeFront && stage && viewport)) return;

    const measure = () => {
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
      const scale = Math.min(
        matchMedia("(min-width: 768px)").matches ? 0.8 : 0.6,
        Math.max(1, viewport.clientWidth - 32) / envelopeWidth,
        availableHeight / (PAPER_HEIGHT * paperToEnvelope),
      );
      const paperHeight = PAPER_HEIGHT * paperToEnvelope * scale;
      const paperTop = paperAreaTop + (availableHeight - paperHeight) / 2;
      const frameTop = paperTop - PAPER_TOP_IN_PHONE * paperToEnvelope * scale;
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
      envelopeScale.set(scale);
      phoneScale.set(paperToEnvelope);
      phoneTop.set((frameTop - envelopeTop) / scale);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(caption);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [captionShift, envelopeScale, phoneScale, phoneTop, pocketHeight]);
  const letterEmphasis = useTransform(
    scrollYProgress,
    [PAPER_RELEASE_START, 0.402, 0.417],
    [0.2, 0.28, 0.4],
  );
  const liftRange = [0.2, 0.28];
  const lift = useTransform(letterEmphasis, liftRange, [0, 1], {
    ease: easeInOut,
  });
  const phoneOpacity = useTransform(letterEmphasis, liftRange, [1, 0], {
    ease: easeOut,
  });
  const insertion = useTransform(
    scrollYProgress,
    [INSERT_START, 0.453],
    [0, 1],
    {
      ease: easeInOut,
    },
  );
  const paperX = useTransform(
    () => PAPER_CENTER_OFFSET * phoneScale.get() * (1 - insertion.get()),
  );
  const paperY = useTransform(() => {
    const liftedTop =
      phoneTop.get() +
      (PAPER_TOP_IN_PHONE - 46 * lift.get()) * phoneScale.get();
    return liftedTop + (132 - liftedTop) * insertion.get();
  });
  const paperScale = useTransform(() => {
    const widthRatio = 1 - (1 - INSERTED_PAPER_WIDTH_RATIO) * insertion.get();
    return phoneScale.get() * widthRatio;
  });
  const pocketRise = useTransform(
    scrollYProgress,
    [INSERT_START, 0.443],
    [240, 0],
    {
      ease: easeInOut,
    },
  );
  const pocketOffset = useTransform(pocketRise, (value) => `${value}px`);
  const paperClip = useTransform(() => {
    if (insertion.get() === 0) return "none";
    const visible =
      (pocketHeight.get() + pocketRise.get() - 4 - paperY.get()) /
      paperScale.get();
    return `inset(0 0 ${Math.max(0, PAPER_HEIGHT - visible)}px 0)`;
  });
  const okay = useScene(scrollYProgress, 0.08, 0.205);
  const safe = useScene(scrollYProgress, 0.18, 0.29);
  const letters = useScene(scrollYProgress, 0.28, 0.44);
  const captionY = useTransform(
    () => letters.style.y.get() + captionShift.get(),
  );
  const seal = useScene(scrollYProgress, 0.405, 0.555);
  const dear = useScene(scrollYProgress, 0.53, 0.655);
  const address = useScene(scrollYProgress, 0.53, 0.755);
  const future = useScene(scrollYProgress, 0.63, 0.755);
  const burn = useScene(scrollYProgress, 0.73, 0.905);
  const outroProgress = useTransform(scrollYProgress, [0.88, 1], [0, 1]);
  const opening = useOpeningReveal(scrollYProgress, 6.8, 0);
  const headline = useOpeningReveal(scrollYProgress, 5.5, 0.4);
  const unsaid = useOpeningReveal(scrollYProgress, 5.8, 2);
  const [recipient, setRecipient] = useState("someone dear");
  const [ignite, setIgnite] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setRecipient(value >= 0.6425 ? "future me" : "someone dear");
    setIgnite(value >= BURN_START && value < BURN_END);
  });
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ReactLenis
      root
      options={{ lerp: 0.04, wheelMultiplier: 1, smoothWheel: true }}
    >
      <section
        ref={sectionContainer1}
        className="relative w-full h-[1200vh] bg-base-100 font-serif text-neutral-content/90"
      >
        <Link
          to={ROUTES.UNLOCK}
          aria-label="Unlock"
          className="home-quill-cta group btn btn-ghost btn-lg absolute top-4 right-4 z-40 h-14 min-w-14 gap-0 rounded-full px-0 text-primary/24! no-underline! hover:text-primary! focus-visible:text-primary! md:top-6 md:right-6"
        >
          <span className="grid size-14 shrink-0 place-items-center">
            <FeatherIcon aria-hidden="true" size={32} weight="duotone" />
          </span>
          <span
            aria-hidden="true"
            className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-500 group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 motion-reduce:transition-none"
          >
            <span className="overflow-hidden whitespace-nowrap font-hand">
              <span className="pr-5">Unlock</span>
            </span>
          </span>
        </Link>
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          {/* Beat 1: Initial Header with Mount Entrance + Scroll Zoom */}
          <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              display: useTransform(scrollYProgress, (value) =>
                value >= TITLE_EXIT ? "none" : "flex",
              ),
              opacity: useTransform(
                scrollYProgress,
                TITLE_ZOOM_RANGE,
                [1, 0.85, 0],
              ),
              scale: useTransform(
                scrollYProgress,
                TITLE_ZOOM_RANGE,
                [1, 1.35, 7],
              ),
              y: useTransform(scrollYProgress, [0.08, TITLE_EXIT], [0, -40]),
              filter: useTransform(scrollYProgress, TITLE_ZOOM_RANGE, [
                "blur(0px)",
                "blur(1px)",
                "blur(10px)",
              ]),
            }}
          >
            <motion.div
              className="flex flex-col items-center justify-center text-center"
              style={{
                opacity: opening,
                scale: useTransform(opening, [0, 1], [0.9, 1]),
                y: useTransform(opening, [0, 1], [16, 0]),
                filter: useTransform(
                  opening,
                  [0, 1],
                  ["blur(16px)", "blur(0px)"],
                ),
              }}
            >
              <motion.h1
                style={{
                  opacity: headline,
                  y: useTransform(headline, [0, 1], [16, 0]),
                  scale: useTransform(headline, [0, 1], [0.9, 1]),
                  filter: useTransform(
                    headline,
                    [0, 1],
                    ["blur(16px)", "blur(0px)"],
                  ),
                }}
                className="text-neutral text-4xl md:text-6xl text-center px-6 tracking-normal word-spacing-editorial"
              >
                You've been carrying something
              </motion.h1>
              <motion.h2
                style={{
                  opacity: unsaid,
                  y: useTransform(unsaid, [0, 1], [16, 0]),
                  scale: useTransform(unsaid, [0, 1], [0.92, 1]),
                  filter: useTransform(
                    unsaid,
                    [0, 1],
                    ["blur(12px)", "blur(0px)"],
                  ),
                }}
                className="text-primary text-5xl md:text-7xl mt-4 italic font-display font-light tracking-normal"
              >
                unsaid
              </motion.h2>
            </motion.div>
          </motion.div>

          {/* Beat 2: "and that's okay..." */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={okay.style}
          >
            <div className="mt-6 text-4xl md:text-6xl text-base-content/60 italic font-serif tracking-normal word-spacing-editorial">
              and that's okay...
            </div>
          </motion.div>

          {/* Beat 3: Logo + "is a safe space, where you can" */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={safe.style}
          >
            <Logo type="logo" scale={1.5} ul={true} />
            <motion.div className="font-serif italic font-light mt-6 text-4xl md:text-6xl text-base-content/70 tracking-normal word-spacing-editorial">
              is a{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={safe.progress}
                  className="font-kalnia font-bold text-primary not-italic"
                >
                  safe space
                </HighlightedWord>
                <WavyUnderline
                  progress={safe.progress}
                  color="var(--color-primary)"
                />
              </span>
              ,<br />
              <motion.span
                className="text-2xl md:text-5xl font-hand tracking-widest italic text-base-content/70"
                style={{
                  opacity: useTransform(safe.progress, [0.32, 0.58], [0, 0.9]),
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
              style={{ ...letters.style, y: captionY }}
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
                  progress={seal.progress}
                  className="text-success font-pixel tracking-wider"
                >
                  secure
                </HighlightedWord>
                <WavyUnderline
                  progress={seal.progress}
                  color="var(--color-success)"
                />
              </span>{" "}
              and{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  progress={seal.progress}
                  className="text-info font-pixel tracking-wider"
                >
                  private
                </HighlightedWord>
                <WavyUnderline
                  progress={seal.progress}
                  color="var(--color-info)"
                />
              </span>
              .
            </motion.h2>

            {/* Beat 6: "send it to someone dear" (Line 1) / "or yourself in the future." (Line 2) */}
            <motion.h2
              style={address.style}
              className="absolute text-4xl md:text-6xl text-center px-6 md:px-10 leading-tight max-w-4xl tracking-normal word-spacing-editorial"
            >
              <span className="inline-block md:whitespace-nowrap">
                send it to{" "}
                <span className="relative inline-block mx-0.5">
                  <HighlightedWord
                    progress={dear.progress}
                    className="font-display text-accent"
                  >
                    someone dear
                  </HighlightedWord>
                  <WavyUnderline
                    progress={dear.progress}
                    color="var(--color-accent)"
                  />
                </span>
              </span>
              <motion.span
                className="block mt-2"
                style={{
                  opacity: useTransform(future.progress, [0, 0.2], [0, 1]),
                  y: useTransform(future.progress, [0, 0.2], [14, 0]),
                }}
              >
                <span className="font-display text-neutral">or </span>
                <span className="relative inline-block mx-0.5 md:whitespace-nowrap">
                  <HighlightedWord
                    progress={future.progress}
                    className="font-display text-success"
                  >
                    yourself in the future
                  </HighlightedWord>
                  <WavyUnderline
                    progress={future.progress}
                    color="var(--color-success)"
                  />
                </span>
                .
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
                  progress={burn.progress}
                  className="font-display text-error"
                >
                  burn it
                </HighlightedWord>
                <WavyUnderline
                  progress={burn.progress}
                  color="var(--color-error)"
                />
              </span>{" "}
              to release the burden.
            </motion.h2>

            {/* Beat 8: Outro text */}
            <motion.h2
              className="italic absolute text-4xl md:text-6xl text-center px-10 leading-tight text-neutral-content/60 tracking-normal word-spacing-editorial"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.88, 0.92, 1],
                  [0, 1, 1],
                ),
                y: useTransform(scrollYProgress, [0.88, 0.92, 1], [30, 0, 0]),
                scale: useTransform(
                  scrollYProgress,
                  [0.88, 0.92, 1],
                  [0.98, 1, 1],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.88, 0.92, 1],
                  ["blur(14px)", "blur(0px)", "blur(0px)"],
                ),
              }}
            >
              You've been carrying it{" "}
              <span className="relative inline-block whitespace-nowrap">
                <HighlightedWord
                  progress={outroProgress}
                  className="font-display text-primary not-italic"
                >
                  long enough
                </HighlightedWord>
                <WavyUnderline
                  progress={outroProgress}
                  color="var(--color-primary)"
                  className="translate-y-1 md:translate-y-1.5"
                />
              </span>
              .
            </motion.h2>

            {/* CTA Action Buttons */}
            <motion.div
              className="z-100 absolute -bottom-12 md:bottom-0 font-hand flex flex-wrap md:flex-nowrap gap-4 md:gap-12 justify-center pointer-events-auto"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.96, 0.99, 1],
                  [0, 1, 1],
                ),
                y: useTransform(scrollYProgress, [0.96, 0.99, 1], [40, 0, 0]),
                pointerEvents: useTransform(scrollYProgress, (value) =>
                  value > 0.96 ? "auto" : "none",
                ),
              }}
            >
              <button
                className="btn btn-ghost btn-wide md:btn-xl rounded-full bg-primary/12 hover:bg-primary/20 font-extralight hover:-translate-y-1 transition-all duration-700 cursor-pointer"
                type="button"
                onClick={() => navigate(ROUTES.ABOUT, { replace: true })}
              >
                <InfoIcon className="text-primary" size={24} />
                Tell me More
              </button>
              <button
                className="home-ready-cta btn rounded-full btn-primary btn-wide md:btn-xl hover:-translate-y-1 transition-all duration-700 cursor-pointer"
                type="button"
                onClick={() => navigate(ROUTES.BEGIN, { replace: true })}
              >
                I'm ready
              </button>
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
                    [0.28, 0.31, 0.9, BURN_END],
                    [0, 1, 1, 0],
                  ),
                  "--pocket-opacity": useTransform(
                    scrollYProgress,
                    [INSERT_START, 0.437],
                    [0, 1],
                  ),
                  "--pocket-rise": pocketOffset,
                  "--flap": useTransform(
                    seal.progress,
                    [FLAP_CLOSE_START, FLAP_CLOSED],
                    [-1, 1],
                  ),
                  "--flap-layer": useTransform(seal.progress, (p) =>
                    p < FLAP_CLOSE_START ? 0 : 4,
                  ),
                  "--wax": useTransform(
                    seal.progress,
                    [FLAP_CLOSED + 0.02, 0.49],
                    [0, 1],
                  ),
                  "--flip": useTransform(
                    dear.progress,
                    [0.2, 0.4],
                    ["180deg", "0deg"],
                    { ease: easeInOut },
                  ),
                } as MotionStyle
              }
            >
              <div className="relative" inert>
                <EnvelopeReveal
                  isInteractive={false}
                  ignite={ignite}
                  insert={
                    <>
                      <motion.div
                        className="home-letter-mockup absolute z-1 origin-top"
                        style={{
                          y: phoneTop,
                          scale: phoneScale,
                          opacity: phoneOpacity,
                        }}
                      >
                        <div className="mockup-phone border-primary/40 shadow-warm">
                          <div className="mockup-phone-camera" />
                          <div className="mockup-phone-display">
                            <img
                              src={letterSample}
                              alt="Letter sample"
                              style={{
                                top: SCREEN_IMAGE_TOP,
                                clipPath: SCREEN_WITHOUT_PAPER,
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        aria-hidden="true"
                        className="home-loose-letter absolute z-2 origin-top"
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
                          clipPath: paperClip,
                        }}
                      />
                    </>
                  }
                  recipient={recipient}
                  date={formatDate(new Date().toISOString())}
                  onRevealComplete={() => {}}
                  isFlip
                />
              </div>
            </motion.div>

            {/* Saajan Persona Message */}
            <motion.div
              className="fixed bottom-0 z-10 font-sans -mb-6 md:scale-100 md:mb-0"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.95, 0.98, 1],
                  [0, 0.7, 1],
                ),
                y: useTransform(scrollYProgress, [0.95, 1], [40, -10]),
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
              className="w-64 z-20 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
              transition={{
                backgroundColor: { ease: "easeInOut", duration: 1.5 },
              }}
              style={{
                backgroundColor: useTransform(
                  scrollYProgress,
                  [0.35, 0.48, 0.58, 0.68, 0.72, 0.78, 0.88],
                  [
                    "var(--color-primary)",
                    "var(--color-secondary)",
                    "var(--color-accent)",
                    "var(--color-accent)",
                    "var(--color-success)",
                    "var(--color-success)",
                    "var(--color-error)",
                  ],
                ),
                scale: useTransform(scrollYProgress, [0, 1], [0.8, 2.6]),
              }}
            />
          </div>
        </div>
      </section>
    </ReactLenis>
  );
}
