import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import Logo from "../components/Logo";
import { EnvelopeReveal } from "../components/reader/EnvelopeReveal";
import { formatDate } from "../utils/dateFormat.ts";

export default function Home() {
  const sectionContainer1 = useRef<HTMLDivElement>(null);
  const { scrollYProgress: section1ScrollProgress } = useScroll({
    target: sectionContainer1,
  });
  const smoothProgress = useSpring(section1ScrollProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const [isEnvelopeFlipped, setIsEnvelopeFlipped] = useState(true);
  const [recipient, setRecipient] = useState("someone dear");
  const [ignite, setIgnite] = useState(false);

  useMotionValueEvent(section1ScrollProgress, "change", (latestScrollValue) => {
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
    <section
      ref={sectionContainer1}
      className="relative w-full h-[850vh] bg-base-100 font-serif"
    >
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{
            opacity: useTransform(smoothProgress, [0, 0.12, 1], [1, 0, 0]),
            scale: useTransform(smoothProgress, [0, 0.12], [1, 10]),
          }}
        >
          <h1 className="text-neutral-content/40 text-4xl md:text-6xl text-center px-6">
            You've been carrying something
          </h1>
          <h2 className="text-primary text-5xl md:text-7xl font-extralight mt-4 italic font-display animate-pulse">
            unsaid
          </h2>
        </motion.div>

        <motion.div
          className="absolute text-center"
          style={{
            opacity: useTransform(smoothProgress, [0, 0.15, 0.2], [0, 1, 0]),
            y: useTransform(smoothProgress, [0, 0.15, 0.2], [40, 0, -40]),
            scale: useTransform(smoothProgress, [0, 0.15, 0.2], [0.8, 1, 3]),
          }}
        >
          <div className="mt-6 text-4xl md:text-6xl text-base-content/60 italic">
            and that's okay...
          </div>
        </motion.div>
        <motion.div
          className="absolute text-center px-6"
          style={{
            opacity: useTransform(smoothProgress, [0.18, 0.25, 0.3], [0, 1, 0]),
            y: useTransform(smoothProgress, [0.18, 0.25, 0.3], [20, 0, -20]),
          }}
          transition={{ delay: 4 }}
        >
          <Logo scale={2} />
          <motion.div
            className="mt-6 text-4xl md:text-6xl text-base-content/60 "
            style={{
              opacity: useTransform(
                smoothProgress,
                [0.22, 0.25, 0.35, 0.4],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                smoothProgress,
                [0.25, 0.3, 0.35, 0.4],
                [20, 0, 0, -20],
              ),
            }}
          >
            is a{" "}
            <span className="font-display text-primary font-extralight">
              safe space
            </span>
            ,<br />
            <motion.span
              className="opacity-0 text-3xl md:text-5xl"
              transition={{ delay: 3 }}
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
                smoothProgress,
                [0.3, 0.35, 0.4, 0.45],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                smoothProgress,
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
          <motion.h2
            style={{
              opacity: useTransform(
                smoothProgress,
                [0.45, 0.5, 0.55, 0.6],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                smoothProgress,
                [0.45, 0.5, 0.55, 0.6],
                [40, 0, 0, -40],
              ),
            }}
            className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
          >
            seal it{" "}
            <span className="text-secondary font-display italic font-extralight">
              secure
            </span>{" "}
            and{" "}
            <span className="text-secondary font-display font-extralight italic">
              private
            </span>
            .
          </motion.h2>
          <motion.h2
            style={{
              opacity: useTransform(
                smoothProgress,
                [0.6, 0.63, 0.72, 0.75],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                smoothProgress,
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
                  smoothProgress,
                  [0.67, 1],
                  ["var(--color-accent)", "var(--color-neutral)"],
                ),
              }}
            >
              someone dear
            </motion.span>
            <motion.span
              style={{
                opacity: useTransform(smoothProgress, [0.66, 0.7], [0, 1]),
              }}
            >
              {" "}
              or{" "}
              <span className="font-display text-success">
                yourself in the future
              </span>
              .
            </motion.span>
          </motion.h2>
          <motion.h2
            style={{
              opacity: useTransform(
                smoothProgress,
                [0.75, 0.8, 0.85, 0.9],
                [0, 1, 1, 0],
              ),
              y: useTransform(
                smoothProgress,
                [0.75, 0.8, 0.85, 0.9],
                [40, 0, 0, -40],
              ),
            }}
            className="absolute text-4xl md:text-6xl text-center px-10 leading-tight"
          >
            and even <span className="font-display text-error">burn it</span> to
            release the burden.
          </motion.h2>
        </div>
        <div className="relative h-1/4 w-full flex flex-col items-center justify-center">
          <motion.div
            className="z-10 absolute scale-80"
            style={{
              opacity: useTransform(smoothProgress, [0.3, 0.5], [0, 1]),
              y: useTransform(smoothProgress, [0.3, 0.5], [200, 0]),
            }}
          >
            <EnvelopeReveal
              isInteractive={false}
              ignite={ignite}
              recipient={recipient}
              date={formatDate(new Date().toISOString())}
              onRevealComplete={() => {}}
              isFlip={isEnvelopeFlipped}
            />
          </motion.div>
          <motion.div
            className="w-48 z-100 h-48 rounded-full blur-3xl opacity-20"
            transition={{
              backgroundColor: { ease: "easeIn", duration: 2 },
            }}
            style={{
              backgroundColor: useTransform(
                smoothProgress,
                [0.45, 0.5, 0.7, 0.75, 1],
                [
                  "var(--color-primary)",
                  "var(--color-secondary)",
                  "var(--color-accent)",
                  "var(--color-success)",
                  "var(--color-error)",
                ],
              ),
              scale: useTransform(smoothProgress, [0, 1], [0.6, 2.5]),
            }}
          />
          <div className="absolute border border-primary/5 w-64 h-64 rounded-full backdrop-blur-[1px]" />
        </div>
      </div>
    </section>
  );
}
