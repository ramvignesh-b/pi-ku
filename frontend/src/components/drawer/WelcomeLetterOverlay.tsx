import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getWelcomeLetterContent } from "../../config/welcomeLetter";
import { formatDate } from "../../utils/dateFormat";
import { type CanvasTools, ComposeCanvas } from "../editor/ComposeCanvas";
import { EnvelopeReveal } from "../reader/EnvelopeReveal";

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
    <div className="fixed inset-0 z-30 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden">
      <div className="fixed inset-0 bg-vig pointer-events-none z-0" />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
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
            <ComposeCanvas ref={canvasRef} readOnly />
          </div>

          <div className="flex justify-center mt-12">
            <button
              type="button"
              data-testid="dismiss-welcome-letter-btn"
              onClick={onComplete}
              className="btn btn-base btn-xs btn-wide opacity-80 shadow-lg font-light tracking-wider"
            >
              I'll see you
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
