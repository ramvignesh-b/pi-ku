import { DotIcon } from "@phosphor-icons/react";
import "@fontsource/knewave/400.css";

export default function Logo() {
  return (
    <span
      className="inline-flex items-baseline justify-center leading-none select-none"
      style={{ fontFamily: "'Knewave', serif" }}
    >
      <span className="text-2xl font-light text-accent">Pi</span>
      <DotIcon
        weight="fill"
        size={12}
        className="text-accent translate-y-[0.3em] -mx-px"
      />
      <span className="text-2xl font-light text-accent">Ku</span>
      <DotIcon
        weight="fill"
        size={12}
        className="text-accent translate-y-[0.3em] -mx-px"
      />
    </span>
  );
}
