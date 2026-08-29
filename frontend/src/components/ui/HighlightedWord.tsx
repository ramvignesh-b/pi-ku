import { type MotionValue, motion, useMotionValueEvent } from "motion/react";
import { useState } from "react";

export interface HighlightedWordProps {
  scrollYProgress: MotionValue<number>;
  focusThreshold: number;
  exitThreshold: number;
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

export const HighlightedWord = ({
  scrollYProgress,
  focusThreshold,
  exitThreshold,
  delay = 0.85,
  duration = 1.1,
  className = "",
  children,
}: HighlightedWordProps) => {
  const [isTriggered, setIsTriggered] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest >= focusThreshold - 0.01 && latest <= exitThreshold) {
      setIsTriggered(true);
    } else if (
      latest < focusThreshold - 0.04 ||
      latest > exitThreshold + 0.04
    ) {
      setIsTriggered(false);
    }
  });

  return (
    <motion.span
      className={`relative z-10 inline-block ${className}`}
      initial={{ filter: "blur(8px)", opacity: 0.15, y: 2 }}
      animate={{
        filter: isTriggered ? "blur(0px)" : "blur(8px)",
        opacity: isTriggered ? 1 : 0.15,
        y: isTriggered ? 0 : 2,
      }}
      transition={{
        duration,
        delay: isTriggered ? delay : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.span>
  );
};

export default HighlightedWord;
