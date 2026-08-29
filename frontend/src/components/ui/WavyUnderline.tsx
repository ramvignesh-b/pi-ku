import { type MotionValue, motion, useTransform } from "motion/react";

export interface WavyUnderlineProps {
  scrollYProgress: MotionValue<number>;
  drawRange: [number, number];
  fadeRange: [number, number, number, number];
  cycles?: number;
  color: string;
  strokeWidth?: number;
  className?: string;
}

const MASK_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='10' viewBox='0 0 24 10'><path d='M0 5 C4 1, 8 1, 12 5 C16 9, 20 9, 24 5' fill='none' stroke='black' stroke-width='2.6' stroke-linecap='round'/></svg>`,
)}`;

export const WavyUnderline = ({
  scrollYProgress,
  drawRange,
  fadeRange,
  color,
  className = "",
}: WavyUnderlineProps) => {
  // Reveal from 0% width (clip 100% from right) to 100% width (clip 0% from right)
  const clipProgress = useTransform(scrollYProgress, drawRange, [100, 0], {
    clamp: true,
  });
  const clipPath = useTransform(clipProgress, (p) => `inset(0 ${p}% 0 0)`);
  const opacity = useTransform(
    scrollYProgress,
    [
      fadeRange[0],
      fadeRange[0] + (fadeRange[1] - fadeRange[0]) * 0.3,
      fadeRange[2],
      fadeRange[3],
    ],
    [0, 0.85, 0.85, 0],
    { clamp: true },
  );

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
        clipPath,
        opacity,
      }}
    />
  );
};

export default WavyUnderline;
