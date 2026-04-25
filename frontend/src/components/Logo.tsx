import { DotIcon } from "@phosphor-icons/react";
import "@fontsource/knewave/400.css";

export default function Logo({ scale = 2 }) {
  return (
    <div
      role="img"
      aria-label="Pi Ku"
      className="inline-flex items-baseline justify-center leading-none select-none"
      style={{ fontFamily: "'Knewave', serif", scale }}
    >
      <span className={`text-xl font-light text-accent`}>&nbsp;Pi</span>
      <DotIcon
        weight="fill"
        size={6}
        className={`text-primary translate-y-1 -mx-px`}
      />
      <span className={`text-xl font-light text-accent`}>&nbsp;Ku</span>
      <DotIcon
        weight="fill"
        size={6}
        className={`text-primary translate-y-1 -mx-px`}
      />
    </div>
  );
}
