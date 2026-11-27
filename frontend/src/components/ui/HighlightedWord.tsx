import {
  easeInOut,
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
      className={`relative z-10 inline-block motion-reduce:filter-none! motion-reduce:transform-none! ${className}`}
      style={{
        filter: useTransform(progress, [0, 0.55], ["blur(4px)", "blur(0px)"], {
          ease: easeInOut,
        }),
        opacity: useTransform(progress, [0, 0.55], [0.4, 1], {
          ease: easeInOut,
        }),
        scale: useTransform(progress, [0, 0.55], [0.98, 1], {
          ease: easeInOut,
        }),
      }}
    >
      {children}
    </motion.span>
  );
};

export default HighlightedWord;
