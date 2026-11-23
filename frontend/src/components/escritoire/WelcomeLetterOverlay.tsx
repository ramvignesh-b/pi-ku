import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  getWelcomeLetterContent,
  WELCOME_LETTER_FOOTER_IMAGE,
} from "../../config/welcomeLetter";
import { formatDate } from "../../utils/dateFormat";
import { EnvelopeReveal } from "../letter/EnvelopeReveal";
import { type CanvasTools, ComposeCanvas } from "../quill/ComposeCanvas";

export interface WelcomeLetterOverlayProps {
  onComplete: () => void;
  userName: string;
}

export function WelcomeLetterOverlay({
  onComplete,
  userName,
}: WelcomeLetterOverlayProps) {
  const [revealState, setRevealState] = useState<"SEALED" | "REVEALED">(
    "SEALED",
  );
  const canvasRef = useRef<CanvasTools>(null);

  useEffect(() => {
    if (revealState === "REVEALED" && canvasRef.current) {
      const welcomeContent = getWelcomeLetterContent(userName);
      canvasRef.current.loadData(welcomeContent);
    }
  }, [revealState, userName]);

  return (
    <div className="fixed inset-0 z-30 backdrop-blur-3xl flex flex-col items-center justify-center-safe p-4 md:p-8 overflow-x-hidden overflow-y-auto">
      <div className="fixed inset-0 bg-vig pointer-events-none z-0" />

      <div className="w-full max-w-4xl z-10 flex shrink-0 flex-col items-center">
        <AnimatePresence mode="wait">
          {revealState === "SEALED" && (
            <motion.div
              key="envelope"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 0.8, opacity: 1 }}
              exit={{
                scale: 1,
                opacity: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              }}
              transition={{ duration: 4, delay: 1 }}
            >
              <EnvelopeReveal
                recipient={userName}
                date={formatDate(new Date())}
                onRevealComplete={() => setRevealState("REVEALED")}
                ignite={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={`w-full space-y-8 py-12 ${revealState === "REVEALED" ? "block" : "hidden"}`}
        >
          <div className="bg-paper shadow-warm rounded-sm overflow-hidden mx-auto max-w-180">
            <div className="p-1 md:p-2 bg-base-content/5 opacity-10 pointer-events-none absolute inset-0 z-10" />
            <ComposeCanvas
              ref={canvasRef}
              readOnly
              footerImageName={WELCOME_LETTER_FOOTER_IMAGE}
            />
          </div>

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
        </div>
      </div>
    </div>
  );
}
