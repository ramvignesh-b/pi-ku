import { DotIcon } from "@phosphor-icons/react";
import "@fontsource/knewave/400.css";

export default function Logo({ scale = 1, inline = false }) {
  if (inline) {
    // for span elements
    return (
      <span className={"text-accent font-serif italic"}>
        Pi<span className="text-primary">.</span>&nbsp;Ku
        <span className="text-primary">.</span>&nbsp;
      </span>
    );
  }

  return (
    <div
      role="img"
      aria-label="Pi. Ku. logo"
      className="inline-flex items-baseline justify-center leading-none select-none"
      style={{ fontFamily: "'Knewave', serif", scale }}
    >
      <span className={`text-3xl font-light text-accent`}>Pi</span>
      <DotIcon
        weight="fill"
        size={12}
        className={`text-primary translate-y-1 -mx-px`}
      />
      <span className={`text-3xl font-light text-accent`}>&nbsp;Ku</span>
      <DotIcon
        weight="fill"
        size={12}
        className={`text-primary translate-y-1 -mx-px`}
      />
    </div>
  );
}
