import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  getWelcomeLetterContent,
  WELCOME_LETTER_FOOTER_IMAGE,
} from "../../config/welcomeLetter";
import { type RevealState, useReveal } from "../../hooks/useReveal";
import { formatDate } from "../../utils/dateFormat";
import { EnvelopeReveal } from "../letter/EnvelopeReveal";
import { LetterPaper } from "../letter/LetterPaper";

export interface WelcomeLetterOverlayProps {
  onComplete: () => void;
  userName: string;
}

export function WelcomeLetterOverlay({
  onComplete,
  userName,
}: WelcomeLetterOverlayProps) {
  const [revealState, setRevealState] = useState<RevealState>("SEALED");
  const welcomeContent = useMemo(
    () => getWelcomeLetterContent(userName),
    [userName],
  );
  const {
    paperRef,
    envelopeLetterRef,
    paperControls,
    reduceMotion,
    handleRevealComplete,
    markCanvasReady,
    isRevealed,
    showInk,
    inkTransition,
    envelopeExit,
  } = useReveal(revealState, setRevealState);

  return (
    <div className="fixed inset-0 z-30 backdrop-blur-3xl">
      <div className="fixed inset-0 bg-vig pointer-events-none z-0" />

      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            key="envelope"
            className="absolute inset-0 z-10 grid place-items-center pointer-events-none"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={envelopeExit}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            <EnvelopeReveal
              letterRef={envelopeLetterRef}
              recipient={userName}
              date={formatDate(new Date())}
              onRevealComplete={handleRevealComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`absolute inset-0 z-20 px-4 py-6 md:p-8 [scrollbar-gutter:stable_both-edges] ${isRevealed ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden pointer-events-none"}`}
      >
        <LetterPaper
          paperRef={paperRef}
          controls={paperControls}
          isRevealed={isRevealed}
          showInk={showInk}
          inkTransition={inkTransition}
          data={welcomeContent}
          footerImageName={WELCOME_LETTER_FOOTER_IMAGE}
          onCanvasReady={markCanvasReady}
        />

        {isRevealed && (
          <div className="flex justify-center">
            <button
              type="button"
              data-testid="dismiss-welcome-letter-btn"
              onClick={onComplete}
              className="btn btn-ghost relative h-7 min-w-32 rounded-full border-transparent bg-primary/12 px-5 font-serif text-xs font-light tracking-wider text-base-content/85 transition-colors after:absolute after:inset-x-0 after:-inset-y-[9px] after:content-[''] hover:bg-primary/20 focus-visible:outline-primary md:h-11 md:min-w-44 md:px-8 md:text-base md:after:hidden"
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full motion-reduce:hidden"
                style={{
                  boxShadow:
                    "0 0 12px 3px color-mix(in oklch, var(--color-primary) 34%, transparent), 0 0 26px 4px color-mix(in oklch, var(--color-primary) 18%, transparent)",
                }}
                initial={false}
                animate={{ opacity: 0 }}
                whileInView={{
                  opacity: [0.27, 0.58, 0.27],
                  transition: {
                    duration: 8,
                    ease: "easeInOut",
                    repeat: Infinity,
                  },
                }}
                viewport={{ amount: 0.6 }}
              />
              <span className="relative">I'll see you</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
