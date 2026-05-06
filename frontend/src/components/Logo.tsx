import { DotIcon } from "@phosphor-icons/react";
import "@fontsource/knewave/400.css";

interface LogoProps {
    scale?: number;
    type?: "inline" | "mono" | "logo";
}

export default function Logo({ scale = 1, type = "logo" }: LogoProps) {
    if (type === "inline") {
        return (
            <span
                className={
                    "text-accent font-display italic "
                }
            >
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
