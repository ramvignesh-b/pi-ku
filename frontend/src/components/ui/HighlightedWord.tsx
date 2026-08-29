import { type MotionValue, motion, useMotionValueEvent } from "motion/react";
import { useState } from "react";

export interface HighlightedWordProps {
  scrollYProgress: MotionValue<number>;
  focusThreshold: number;
  exitThreshold: number;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export const HighlightedWord = ({
  scrollYProgress,
  focusThreshold,
  exitThreshold,
  delay = 0.5,
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
      className={`relative z-10 ${className}`}
      initial={{ filter: "blur(10px)", opacity: 0.25 }}
      animate={{
        filter: isTriggered ? "blur(0px)" : "blur(10px)",
        opacity: isTriggered ? 1 : 0.25,
      }}
      transition={{
        duration: 0.65,
        delay: isTriggered ? delay : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.span>
  );
};

export default HighlightedWord;
