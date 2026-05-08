import { InfoIcon } from "@phosphor-icons/react";
import { ReactLenis } from "lenis/react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { EnvelopeReveal } from "../components/reader/EnvelopeReveal";
import Saajan from "../components/ui/Saajan.tsx";
import { ROUTES } from "../config/routes.ts";
import { formatDate } from "../utils/dateFormat.ts";

import "@fontsource/space-mono/index.css";
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

  useMotionValueEvent(scrollYProgress, "change", (latestScrollValue) => {
    if (latestScrollValue > 0.54) {
      setFlapOpen(false);
    } else {
      setFlapOpen(true);
    }
    if (latestScrollValue <= 0.6) {
      setIsEnvelopeFlipped(true);
    } else {
      setIsEnvelopeFlipped(false);
    }
    if (latestScrollValue > 0.68) {
      setRecipient("future me");
    } else {
      setRecipient("someone dear");
    }
    if (latestScrollValue > 0.77) {
      setIgnite(true);
    } else {
      setIgnite(false);
    }
  });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <section
        ref={sectionContainer1}
        className="relative w-full h-[850vh] bg-base-100 font-serif text-neutral-content/90"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          {/*  Intro */}
          <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.12, 1], [1, 0, 0]),
              scale: useTransform(scrollYProgress, [0, 0.12], [1, 10]),
            }}
          >
            <h1 className="text-neutral text-4xl md:text-6xl text-center px-6">
              You've been carrying something
            </h1>
            <motion.h2 className="text-primary text-5xl md:text-7xl mt-4 italic font-display font-light">
              unsaid
            </motion.h2>
          </motion.div>

          <motion.div
            className="absolute text-center"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.15, 0.2], [0, 1, 0]),
              y: useTransform(scrollYProgress, [0, 0.15, 0.2], [40, 0, -40]),
              scale: useTransform(scrollYProgress, [0, 0.15, 0.2], [0.8, 1, 3]),
            }}
          >
            <div className="mt-6 text-4xl md:text-6xl text-base-content/60 italic">
              and that's okay...
            </div>
          </motion.div>
          {/*  pi. ku. */}
          <motion.div
            className="absolute text-center px-6"
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0.18, 0.25, 0.3],
                [0, 1, 0],
              ),
              y: useTransform(scrollYProgress, [0.18, 0.25, 0.3], [20, 0, -20]),
            }}
            transition={{ delay: 4 }}
          >
            <Logo type="logo" scale={1.5} ul={true} />
            <motion.div
              className="font-serif italic font-extralight mt-6 text-4xl md:text-6xl text-neutral "
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.22, 0.25, 0.35, 0.4],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.25, 0.3, 0.35, 0.4],
                  [20, 0, 0, -20],
                ),
              }}
            >
              is a{"  "}
              <span className="font-display text-primary font-extralight">
                safe space
              </span>
              ,<br />
              <motion.span
                className="opacity-0 text-2xl md:text-4xl font-hand tracking-widest italic text-neutral"
                transition={{ delay: 5 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                where you can
              </motion.span>
            </motion.div>
          </motion.div>

          <div className="relative w-full max-w-5xl h-1/2 flex items-center justify-center mt-20">
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.3, 0.35, 0.4, 0.45],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.3, 0.35, 0.4, 0.45],
                  [40, 0, 0, -40],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
            >
              pen down your unsaid words into{" "}
              <span className="font-display text-primary font-extralight">
                letters
              </span>
              .
            </motion.h2>
            {/*  Seal */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.45, 0.5, 0.55, 0.6],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.45, 0.5, 0.55, 0.6],
                  [40, 0, 0, -40],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
            >
              seal it{" "}
              <span className="text-success font-mono tracking-tighter font-extrabold">
                secure
              </span>{" "}
              and{" "}
              <span className="text-info font-mono tracking-tighter italic">
                private
              </span>
              .
            </motion.h2>
            {/*  Send / vault */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.6, 0.63, 0.72, 0.75],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.6, 0.63, 0.72, 0.75],
                  [40, 0, 0, -40],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
            >
              send it to{" "}
              <motion.span
                className="font-display text-accent"
                style={{
                  color: useTransform(
                    scrollYProgress,
                    [0.67, 1],
                    ["var(--color-accent)", "var(--color-neutral)"],
                  ),
                }}
              >
                someone dear
              </motion.span>
              <motion.span
                style={{
                  opacity: useTransform(scrollYProgress, [0.66, 0.7], [0, 1]),
                }}
              >
                <motion.span
                  className="font-display text-accent"
                  style={{
                    color: useTransform(
                      scrollYProgress,
                      [0.67, 1],
                      ["var(--color-accent)", "var(--color-neutral)"],
                    ),
                  }}
                >
                  {" "}
                  or{" "}
                </motion.span>
                <span className="font-display text-success">
                  yourself in the future
                </span>
                .
              </motion.span>
            </motion.h2>
            {/*  Burn */}
            <motion.h2
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.75, 0.8, 0.85, 0.9],
                  [0, 1, 1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.75, 0.8, 0.85, 0.9],
                  [40, 0, 0, -40],
                ),
              }}
              className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
            >
              and even <span className="font-display text-error">burn it</span>{" "}
              to release the burden.
            </motion.h2>
            {/*  Outro  */}
            <motion.h2
              className={
                "italic absolute text-4xl md:text-6xl text-center px-10 leading-tight text-neutral-content/50"
              }
              style={{
                opacity: useTransform(scrollYProgress, [0.9, 1], [0, 1]),
                y: useTransform(scrollYProgress, [0.9, 1], [80, 0]),
              }}
            >
              You've been carrying it long enough.
            </motion.h2>
            {/* CTA */}
            <motion.div
              className={
                "z-100 absolute -bottom-12 md:bottom-0 font-hand flex flex-wrap md:flex-nowrap gap-4 md:gap-12 justify-center"
              }
              style={{
                opacity: useTransform(scrollYProgress, [0.98, 1], [0, 1]),
                y: useTransform(scrollYProgress, [0.98, 1], [80, 0]),
                display: useTransform(
                  scrollYProgress,
                  [0.96, 1],
                  ["none", "flex"],
                ),
              }}
            >
              <button
                className={
                  "md:opacity-50 hover:opacity-100 btn btn-ghost btn-wide md:btn-xl rounded-full font-extralight md:grayscale hover:grayscale-0 hover:-translate-y-1 transition-all duration-1000"
                }
                type={"button"}
                onClick={() => navigate(ROUTES.ABOUT, { replace: true })}
              >
                <InfoIcon className={"text-primary"} />
                Tell me More
              </button>
              <button
                className={
                  "md:opacity-50 hover:opacity-100 btn rounded-full btn-primary btn-wide md:btn-xl md:grayscale-50 hover:grayscale-0 focus:grayscale-0 active:grayscale-0 hover:-translate-y-1 transition-all duration-1000"
                }
                type={"button"}
                onClick={() => navigate(ROUTES.ONBOARD, { replace: true })}
              >
                I'm ready
              </button>
            </motion.div>
          </div>

          <div className="relative h-1/4 w-full flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              className={"z-21 absolute"}
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.3, 0.4, 0.5, 0.52],
                  [0, 1, 0.1, 0],
                ),
                y: useTransform(
                  scrollYProgress,
                  [0.3, 0.45, 0.5],
                  [300, 0, 200],
                ),
                scale: useTransform(
                  scrollYProgress,
                  [0.3, 0.4, 0.5],
                  [1, 1, 0.6],
                ),
              }}
            >
              <div className="mockup-phone w-[75vw] border-primary">
                <div className="mockup-phone-camera"></div>
                <div className="mockup-phone-display">
                  <img alt="letter" src="/screenshots/letter.webp" />
                </div>
              </div>
            </motion.div>
            {/*  Envelope */}
            <motion.div
              className="absolute scale-50 md:scale-80 z-10"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.4, 0.45, 0.5, 0.7, 0.9, 1],
                  [0, 0.6, 1, 1, 0.3, 0],
                ),
                y: useTransform(scrollYProgress, [0.45, 0.5, 1], [600, 200, 0]),
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
            {/*  Saajan */}
            <motion.div
              className="fixed bottom-0 z-10 font-sans -mb-6 scale-85 md:scale-100 md:mb-0"
              style={{
                opacity: useTransform(
                  scrollYProgress,
                  [0.98, 0.995, 1],
                  [0, 0.5, 1],
                ),
                y: useTransform(scrollYProgress, [0.98, 1], [50, -10]),
              }}
            >
              <Saajan
                message={
                  "I think we forget things\nif there is nobody to tell them."
                }
                position={"top"}
              />
            </motion.div>
            {/*  Orb */}
            <motion.div
              className="w-48 z-100 h-48 rounded-full blur-3xl opacity-20"
              transition={{
                backgroundColor: { ease: "easeIn", duration: 2 },
              }}
              style={{
                backgroundColor: useTransform(
                  scrollYProgress,
                  [0.45, 0.5, 0.7, 0.75, 1],
                  [
                    "var(--color-primary)",
                    "var(--color-secondary)",
                    "var(--color-accent)",
                    "var(--color-success)",
                    "var(--color-error)",
                  ],
                ),
                scale: useTransform(scrollYProgress, [0, 1], [0.6, 2.5]),
              }}
            />
            <div className="absolute border border-primary/5 w-64 h-64 rounded-full backdrop-blur-[1px]" />
          </div>
        </div>
      </section>
    </ReactLenis>
  );
}
