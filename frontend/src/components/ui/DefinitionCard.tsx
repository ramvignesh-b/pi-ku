import { XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export interface DefinitionItem {
  id?: string;
  text: ReactNode;
  quote?: ReactNode;
}

export interface DefinitionCardProps {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  origin?: ReactNode;
  definitions: DefinitionItem[];
  onClose?: () => void;
  hover3d?: boolean;
  className?: string;
  testId?: string;
}

export function DefinitionCard({
  word,
  phonetic,
  partOfSpeech = "/noun/",
  origin,
  definitions,
  onClose,
  hover3d = false,
  className = "",
  testId,
}: DefinitionCardProps) {
  const cardContent = (
    <div
      data-testid={testId}
      className={`card ${hover3d ? "w-96" : "w-full rounded-sm"} bg-base-200 border border-base-content/10 shadow-xl bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[1.95em_1.95em] text-left p-5 md:p-6 font-serif text-base-content`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-lg font-bold font-serif">{word}</div>
          {(partOfSpeech || origin) && (
            <div className="text-xs opacity-50 font-sans mt-0.5">
              {partOfSpeech}{" "}
              {origin && (
                <span className="tracking-widest uppercase text-[10px]">
                  {origin}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {phonetic && (
            <span className="text-xs text-base-content/40 font-mono">
              {phonetic}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              aria-label="Close definition"
              onClick={onClose}
              className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100 cursor-pointer"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      <ol className="flex flex-col gap-3 list-decimal list-inside text-xs sm:text-sm text-base-content/80 p-0 m-0 mt-3">
        {definitions.map((def, idx) => {
          const itemKey =
            def.id ||
            (typeof def.text === "string" ? def.text : `definition-${idx}`);
          return (
            <li key={itemKey} className="leading-relaxed">
              {def.text}
              {def.quote && (
                <blockquote className="text-primary/70 italic mt-1.5 ml-2 border-l-primary/30 leading-snug border-l pl-2">
                  {typeof def.quote === "string" ? `"${def.quote}"` : def.quote}
                </blockquote>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );

  if (hover3d) {
    return (
      <div className={`hover-3d ${className}`}>
        {cardContent}
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    );
  }

  return <div className={className}>{cardContent}</div>;
}

export default DefinitionCard;
