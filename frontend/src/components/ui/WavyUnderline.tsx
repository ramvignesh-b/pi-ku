import {
  cubicBezier,
  type MotionValue,
  motion,
  useTransform,
} from "motion/react";

export interface WavyUnderlineProps {
  progress: MotionValue<number>;
  color: string;
  className?: string;
}

const MASK_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='10' viewBox='0 0 24 10'><path d='M0 5 C4 1, 8 1, 12 5 C16 9, 20 9, 24 5' fill='none' stroke='black' stroke-width='2.6' stroke-linecap='round'/></svg>`,
)}`;

export const WavyUnderline = ({
  progress,
  color,
  className = "",
}: WavyUnderlineProps) => {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute left-0 -bottom-2 md:-bottom-2.5 w-full h-2.5 md:h-3 pointer-events-none z-20 ${className}`}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url("${MASK_SVG}")`,
        maskImage: `url("${MASK_SVG}")`,
        WebkitMaskRepeat: "repeat-x",
        maskRepeat: "repeat-x",
        WebkitMaskSize: "24px 10px",
        maskSize: "24px 10px",
        opacity: 0.85,
        clipPath: useTransform(
          progress,
          [0.28, 0.4],
          ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
          { ease: cubicBezier(0.22, 1, 0.36, 1) },
        ),
      }}
    />
  );
};

export default WavyUnderline;
