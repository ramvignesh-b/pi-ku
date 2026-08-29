import { InfoIcon } from "@phosphor-icons/react";
import { ReactLenis } from "lenis/react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import letterSample from "../assets/screenshots/letter.webp";
import Logo from "../components/Logo";
import { EnvelopeReveal } from "../components/reader/EnvelopeReveal";
import { HighlightedWord } from "../components/ui/HighlightedWord";
import Saajan from "../components/ui/Saajan";
import { WavyUnderline } from "../components/ui/WavyUnderline";
import { ROUTES } from "../config/routes";
import { formatDate } from "../utils/dateFormat";

import "@fontsource/architects-daughter/index.css";

export default function Home() {
  const sectionContainer1 = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionContainer1,
  });

  const [isEnvelopeFlipped, setIsEnvelopeFlipped] = useState(true);
  const [flapOpen, setFlapOpen] = useState(false);
  const [recipient, setRecipient] = useState("someone dear");
  const [ignite, setIgnite] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (latestScrollValue) => {
    // Flap state: open as paper enters (0.44), seals tight earlier at 0.50
    if (latestScrollValue >= 0.44 && latestScrollValue < 0.5) {
      setFlapOpen(true);
    } else {
      setFlapOpen(false);
    }

    // Flip state: seal front side until 0.58, then flips to recipient address side
    if (latestScrollValue <= 0.58) {
      setIsEnvelopeFlipped(true);
    } else {
      setIsEnvelopeFlipped(false);
    }

    // Recipient state: "someone dear" (0.58-0.68) -> "future me" (0.68+)
    if (latestScrollValue > 0.68) {
      setRecipient("future me");
    } else {
      setRecipient("someone dear");
    }

    // Ignite state: trigger burn animation from 0.78 through 0.88
    if (latestScrollValue > 0.78) {
      setIgnite(true);
    } else {
      setIgnite(false);
    }
  });

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.04,
        duration: 2.0,
        smoothWheel: true,
      }}
    >
      <section
        ref={sectionContainer1}
        className="relative w-full h-[1200vh] bg-base-100 font-serif text-neutral-content/90"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          {/* Beat 1: Initial Header with Mount Entrance + Scroll Zoom */}
          <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0, 0.06, 0.13],
                [1, 0.7, 0],
              ),
              scale: useTransform(scrollYProgress, [0, 0.13], [1, 7]),
              y: useTransform(scrollYProgress, [0, 0.13], [0, -40]),
              filter: useTransform(
                scrollYProgress,
                [0, 0.06, 0.13],
                ["blur(0px)", "blur(3px)", "blur(10px)"],
              ),
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: "blur(16px)", y: 16 }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 6.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 5.5,
                  delay: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-neutral text-4xl md:text-6xl text-center px-6 tracking-normal word-spacing-editorial"
              >
                You've been carrying something
              </motion.h1>
              <motion.h2
                initial={{
                  opacity: 0,
                  y: 16,
                  scale: 0.92,
                  filter: "blur(12px)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 5.8,
                  delay: 2.0,
                  ease: [0.16, 1, 0.3, 1],
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
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0.08, 0.14, 0.19, 0.24],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                scrollYProgress,
                [0.08, 0.14, 0.19, 0.24],
                [25, 0, 0, -20],
              ),
              scale: useTransform(
                scrollYProgress,
                [0.08, 0.14, 0.19, 0.24],
                [0.98, 1, 1, 0.98],
              ),
              filter: useTransform(
                scrollYProgress,
                [0.08, 0.14, 0.19, 0.24],
                ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
              ),
            }}
          >
            <div className="mt-6 text-4xl md:text-6xl text-base-content/70 italic font-serif tracking-normal word-spacing-editorial">
              and that's okay...
            </div>
          </motion.div>

          {/* Beat 3: Logo + "is a safe space, where you can" */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0.18, 0.23, 0.31, 0.36],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                scrollYProgress,
                [0.18, 0.23, 0.31, 0.36],
                [25, 0, 0, -20],
              ),
              scale: useTransform(
                scrollYProgress,
                [0.18, 0.23, 0.31, 0.36],
                [0.98, 1, 1, 0.98],
              ),
              filter: useTransform(
                scrollYProgress,
                [0.18, 0.23, 0.31, 0.36],
                ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
              ),
            }}
          >
            <Logo type="logo" scale={1.5} ul={true} />
            <motion.div className="font-serif italic font-light mt-6 text-4xl md:text-6xl text-base-content/70 tracking-normal word-spacing-editorial">
              is a{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  scrollYProgress={scrollYProgress}
                  focusThreshold={0.23}
                  exitThreshold={0.36}
                  delay={0.5}
                  className="font-kalnia font-bold text-primary not-italic"
                >
                  safe space
                </HighlightedWord>
                <WavyUnderline
                  scrollYProgress={scrollYProgress}
                  drawRange={[0.18, 0.23]}
                  fadeRange={[0.18, 0.23, 0.31, 0.36]}
                  cycles={4}
                  color="var(--color-primary)"
                />
              </span>
              ,<br />
              <span className="text-2xl md:text-5xl font-hand tracking-widest italic text-base-content/70 opacity-90">
                where you can
              </span>
            </motion.div>
          </motion.div>

          {/* Middle Action Narrative Stages */}
          <div className="relative z-30 w-full max-w-5xl h-1/2 flex items-center justify-center mt-20 pointer-events-none">
            {/* Beat 4: "pen down your unsaid words into letters." */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.31, 0.36, 0.44, 0.49],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.31, 0.36, 0.44, 0.49],
                  [25, 0, 0, -20],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.31, 0.36, 0.44, 0.49],
                  [0.98, 1, 1, 0.98],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.31, 0.36, 0.44, 0.49],
                  ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              pen down your unsaid words into{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  scrollYProgress={scrollYProgress}
                  focusThreshold={0.36}
                  exitThreshold={0.49}
                  delay={0.5}
                  className="font-display text-primary font-extralight"
                >
                  letters
                </HighlightedWord>
                <WavyUnderline
                  scrollYProgress={scrollYProgress}
                  drawRange={[0.31, 0.36]}
                  fadeRange={[0.31, 0.36, 0.44, 0.49]}
                  cycles={3}
                  color="var(--color-primary)"
                />
              </span>
              .
            </motion.h2>

            {/* Beat 5: "seal it secure and private." */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.44, 0.49, 0.56, 0.61],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.44, 0.49, 0.56, 0.61],
                  [25, 0, 0, -20],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.44, 0.49, 0.56, 0.61],
                  [0.98, 1, 1, 0.98],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.44, 0.49, 0.56, 0.61],
                  ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              seal it{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  scrollYProgress={scrollYProgress}
                  focusThreshold={0.49}
                  exitThreshold={0.61}
                  delay={0.5}
                  className="text-success font-pixel tracking-wider"
                >
                  secure
                </HighlightedWord>
                <WavyUnderline
                  scrollYProgress={scrollYProgress}
                  drawRange={[0.44, 0.49]}
                  fadeRange={[0.44, 0.49, 0.56, 0.61]}
                  cycles={2}
                  color="var(--color-success)"
                />
              </span>{" "}
              and{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  scrollYProgress={scrollYProgress}
                  focusThreshold={0.49}
                  exitThreshold={0.61}
                  delay={0.5}
                  className="text-info font-pixel tracking-wider"
                >
                  private
                </HighlightedWord>
                <WavyUnderline
                  scrollYProgress={scrollYProgress}
                  drawRange={[0.44, 0.49]}
                  fadeRange={[0.44, 0.49, 0.56, 0.61]}
                  cycles={2}
                  color="var(--color-info)"
                />
              </span>
              .
            </motion.h2>

            {/* Beat 6: "send it to someone dear" (Line 1) / "or yourself in the future." (Line 2) */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.56, 0.61, 0.74, 0.78],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.56, 0.61, 0.74, 0.78],
                  [25, 0, 0, -20],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.56, 0.61, 0.74, 0.78],
                  [0.98, 1, 1, 0.98],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.56, 0.61, 0.74, 0.78],
                  ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-6 md:px-10 leading-tight max-w-4xl tracking-normal word-spacing-editorial"
            >
              <span className="inline-block whitespace-nowrap">
                send it to{" "}
                <span className="relative inline-block mx-0.5">
                  <HighlightedWord
                    scrollYProgress={scrollYProgress}
                    focusThreshold={0.61}
                    exitThreshold={0.74}
                    delay={0.5}
                    className="font-display text-accent"
                  >
                    someone dear
                  </HighlightedWord>
                  <WavyUnderline
                    scrollYProgress={scrollYProgress}
                    drawRange={[0.56, 0.61]}
                    fadeRange={[0.56, 0.61, 0.68, 0.74]}
                    cycles={4}
                    color="var(--color-accent)"
                  />
                </span>
              </span>
              <motion.span
                className="block mt-2"
                style={{
                  opacity: useTransform(scrollYProgress, [0.67, 0.7], [0, 1]),
                }}
              >
                <span className="font-display text-neutral">or </span>
                <span className="relative inline-block mx-0.5 whitespace-nowrap">
                  <HighlightedWord
                    scrollYProgress={scrollYProgress}
                    focusThreshold={0.7}
                    exitThreshold={0.78}
                    delay={0.5}
                    className="font-display text-success"
                  >
                    yourself in the future
                  </HighlightedWord>
                  <WavyUnderline
                    scrollYProgress={scrollYProgress}
                    drawRange={[0.67, 0.7]}
                    fadeRange={[0.67, 0.7, 0.74, 0.78]}
                    cycles={6}
                    color="var(--color-success)"
                  />
                </span>
                .
              </motion.span>
            </motion.h2>

            {/* Beat 7: "and even burn it to release the burden." */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.74, 0.79, 0.87, 0.91],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.74, 0.79, 0.87, 0.91],
                  [25, 0, 0, -20],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.74, 0.79, 0.87, 0.91],
                  [0.98, 1, 1, 0.98],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.74, 0.79, 0.87, 0.91],
                  ["blur(14px)", "blur(0px)", "blur(0px)", "blur(6px)"],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight tracking-normal word-spacing-editorial"
            >
              and even{" "}
              <span className="relative inline-block mx-0.5">
                <HighlightedWord
                  scrollYProgress={scrollYProgress}
                  focusThreshold={0.79}
                  exitThreshold={0.91}
                  delay={0.5}
                  className="font-display text-error"
                >
                  burn it
                </HighlightedWord>
                <WavyUnderline
                  scrollYProgress={scrollYProgress}
                  drawRange={[0.74, 0.79]}
                  fadeRange={[0.74, 0.79, 0.87, 0.91]}
                  cycles={3}
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
                  [0.88, 0.95, 1],
                  [0, 1, 1],
                ),
                y: useTransform(scrollYProgress, [0.88, 0.95, 1], [30, 0, 0]),
                scale: useTransform(
                  scrollYProgress,
                  [0.88, 0.95, 1],
                  [0.98, 1, 1],
                ),
                filter: useTransform(
                  scrollYProgress,
                  [0.88, 0.95, 1],
                  ["blur(14px)", "blur(0px)", "blur(0px)"],
                ),
              }}
            >
              You've been carrying it long enough.
            </motion.h2>

            {/* CTA Action Buttons */}
            <motion.div
              className="z-100 absolute -bottom-12 md:bottom-0 font-hand flex flex-wrap md:flex-nowrap gap-4 md:gap-12 justify-center pointer-events-auto"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.93, 0.97, 1],
                  [0, 1, 1],
                ),
                y: useTransform(scrollYProgress, [0.93, 0.97, 1], [40, 0, 0]),
                pointerEvents: useTransform(scrollYProgress, (value) =>
                  value > 0.93 ? "auto" : "none",
                ),
              }}
            >
              <button
                className="md:opacity-60 hover:opacity-100 btn btn-ghost btn-wide md:btn-xl rounded-full font-extralight md:grayscale hover:grayscale-0 hover:-translate-y-1 transition-all duration-700 cursor-pointer"
                type="button"
                onClick={() => navigate(ROUTES.ABOUT, { replace: true })}
              >
                <InfoIcon className="text-primary" size={24} />
                Tell me More
              </button>
              <button
                className="md:opacity-60 hover:opacity-100 btn rounded-full btn-primary btn-wide md:btn-xl md:grayscale-50 hover:grayscale-0 focus:grayscale-0 active:grayscale-0 hover:-translate-y-1 transition-all duration-700 cursor-pointer shadow-warm"
                type="button"
                onClick={() => navigate(ROUTES.ONBOARD, { replace: true })}
              >
                I'm ready
              </button>
            </motion.div>
          </div>

          {/* Floating Visual Elements (Phone Mockup, Envelope, Saajan, Ambient Orb) */}
          <div className="relative h-1/4 w-full flex flex-col items-center justify-center pointer-events-none">
            {/* Letter Sample Mockup */}
            <motion.div
              className="z-20 absolute"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.33, 0.38, 0.44, 0.49],
                  [0, 1, 0.85, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.33, 0.39, 0.49],
                  [240, 80, 220],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.33, 0.39, 0.49],
                  [0.9, 1, 0.75],
                ),
              }}
            >
              <div className="mockup-phone w-[75vw] max-w-sm border-primary/40 shadow-warm">
                <div className="mockup-phone-camera"></div>
                <div className="mockup-phone-display">
                  <img alt="letter sample" src={letterSample} />
                </div>
              </div>
            </motion.div>

            {/* Envelope Reveal Component */}
            <motion.div
              className="absolute scale-50 md:scale-80 z-10"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.44, 0.49, 0.55, 0.86, 0.9],
                  [0, 0.7, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.44, 0.52, 0.86],
                  [420, 140, 0],
                ),
              }}
            >
              <EnvelopeReveal
                isInteractive={false}
                ignite={ignite}
                recipient={recipient}
                date={formatDate(new Date().toISOString())}
                onRevealComplete={() => {}}
                isFlip={isEnvelopeFlipped}
                openFlap={flapOpen}
              />
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
