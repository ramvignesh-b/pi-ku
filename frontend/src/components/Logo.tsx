import { DotIcon } from "@phosphor-icons/react";
import "@fontsource/knewave/400.css";

interface LogoProps {
  scale?: number;
  type?: "inline" | "mono" | "logo" | null;
  ul?: boolean;
}

export default function Logo({
  scale = 1,
  type = null,
  ul = false,
}: LogoProps) {
  if (type === "inline") {
    return (
      <span className={"text-accent font-display italic "}>
        pi<span className="text-primary">.</span>&nbsp;ku
        <span className="text-primary">.</span>&nbsp;
      </span>
    );
  }

  if (type === "mono") {
    return (
      <span className="font-display italic font-bold border-b-3 border-dashed border-stone-800/50">
        pi. ku.
      </span>
    );
  }

  if (type === "logo") {
    return (
      <img
        src="/logo.svg"
        alt="Pi. Ku. logo"
        className="mx-4"
        width={scale * 100}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="Pi. Ku. logo"
      className={`inline-flex items-baseline justify-center leading-none select-none ${ul ? "ul-wavy" : ""}`}
      style={{ fontFamily: "'Knewave', serif", scale }}
    >
      <span className="text-3xl font-light text-accent">Pi</span>
      <DotIcon
        weight="fill"
        size={12}
        className="text-primary translate-y-1 -mx-px"
      />
      <span className="text-3xl font-light text-accent">&nbsp;Ku</span>
      <DotIcon
        weight="fill"
        size={12}
        className="text-primary translate-y-1 -mx-px"
      />
    </div>
  );
}
