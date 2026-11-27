import { FeatherIcon } from "@phosphor-icons/react";
import {
  easeInOut,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

export interface WavyUnderlineProps {
  progress: MotionValue<number>;
  color: string;
  className?: string;
}

function wavePath(width: number) {
  const waves = Math.max(1, Math.round((width - 2) / 24));
  const halfWave = (width - 2) / (2 * waves);
  return `M1 5 q${halfWave / 2} -5 ${halfWave} 0${` t${halfWave} 0`.repeat(2 * waves - 1)}`;
}

export const WavyUnderline = ({
  progress,
  color,
  className = "",
}: WavyUnderlineProps) => {
  const track = useRef<HTMLSpanElement>(null);
  const ink = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const wave = width > 2 ? wavePath(width) : "";
  const waveLength = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const draw = useTransform(progress, [0.32, 1], [0, 1], {
    ease: easeInOut,
  });
  const remaining = useTransform(draw, (value) =>
    reduceMotion ? 0 : 1 - value,
  );
  const quillPosition = useTransform(() => {
    const progress = draw.get();
    const length = waveLength.get();
    if (progress === 1) return `translate(${width - 1}px, 5px)`;
    if (progress === 0 || reduceMotion || !ink.current)
      return "translate(1px, 5px)";

    const { x, y } = ink.current.getPointAtLength(progress * length);
    return `translate(${x}px, ${y}px)`;
  });
  const writing = useTransform(draw, (value) =>
    Number(!reduceMotion && value > 0 && value < 1),
  );
  const quillOpacity = useSpring(writing, { duration: 0.26, bounce: 0 });
  const fade = useTransform(draw, [0, 1], [0, 0.85]);
  const inkOpacity = useTransform(draw, [0, 0.015], [0, 0.85]);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    waveLength.set(wave && ink.current ? ink.current.getTotalLength() : 0);
  }, [wave, waveLength]);

  return (
    <span
      ref={track}
      aria-hidden="true"
      className={`absolute left-0 -bottom-2 md:-bottom-2.5 w-full h-2.5 md:h-3 pointer-events-none z-20 ${className}`}
      style={{ color }}
    >
      {wave && (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${width} 10`}
          width="100%"
          height="10"
          className="block overflow-visible"
        >
          <motion.path
            ref={ink}
            d={wave}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            style={{
              strokeDashoffset: remaining,
              opacity: reduceMotion ? fade : inkOpacity,
            }}
          />
          {!reduceMotion && (
            <motion.g
              style={{
                transform: quillPosition,
                opacity: quillOpacity,
              }}
            >
              {/* Place the rounded end of the feather shaft at the path origin. */}
              <FeatherIcon
                x={-2.5}
                y={-17.5}
                size={20}
                opacity={0.85}
                weight="duotone"
              />
            </motion.g>
          )}
        </svg>
      )}
    </span>
  );
};

export default WavyUnderline;
