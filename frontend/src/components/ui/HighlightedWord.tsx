import {
  cubicBezier,
  type MotionValue,
  motion,
  useTransform,
} from "motion/react";

export interface HighlightedWordProps {
  progress: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}

export const HighlightedWord = ({
  progress,
  className = "",
  children,
}: HighlightedWordProps) => {
  return (
    <motion.span
      className={`relative z-10 inline-block ${className}`}
      style={{
        filter: useTransform(
          progress,
          [0.2, 0.28],
          ["blur(8px)", "blur(0px)"],
          { ease: cubicBezier(0.16, 1, 0.3, 1) },
        ),
        opacity: useTransform(progress, [0.2, 0.28], [0.15, 1]),
        y: useTransform(progress, [0.2, 0.28], [2, 0]),
      }}
    >
      {children}
    </motion.span>
  );
};

export default HighlightedWord;
