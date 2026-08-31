import type { Transition, useAnimationControls } from "motion/react";
import { motion } from "motion/react";
import { type CanvasJSON, ComposeCanvas } from "../quill/ComposeCanvas";

interface LetterPaperProps {
  paperRef: React.Ref<HTMLDivElement>;
  controls: ReturnType<typeof useAnimationControls>;
  isRevealed: boolean;
  showInk: boolean;
  inkTransition: Transition;
  data: CanvasJSON | null;
  recipient?: string;
  onCanvasReady: () => void;
}

// The letter itself. Mounted and measured from the start, so the reveal is a
// transform on a box whose size is already final — nothing reflows under the
// reader, and the expansion can start from the envelope's rect.
export function LetterPaper({
  paperRef,
  controls,
  isRevealed,
  showInk,
  inkTransition,
  data,
  recipient,
  onCanvasReady,
}: LetterPaperProps) {
  return (
    <motion.div
      ref={paperRef}
      className="max-w-180 my-8 mx-auto space-y-8 relative z-60"
      initial={{ opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 }}
      animate={controls}
      style={{
        transformOrigin: "top left",
        pointerEvents: isRevealed ? "auto" : "none",
      }}
      aria-hidden={!isRevealed}
    >
      <div className="relative group perspective-1000">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        <div className="bg-paper shadow-warm rounded-sm overflow-hidden">
          <div className="p-1 md:p-2 bg-base-content/5 opacity-10 pointer-events-none absolute inset-0 z-10" />
          <motion.div
            initial={false}
            animate={{ opacity: showInk ? 1 : 0 }}
            transition={inkTransition}
          >
            <ComposeCanvas
              readOnly
              initialData={data}
              onReady={onCanvasReady}
            />
          </motion.div>
        </div>

        {recipient && (
          <p className="text-center sm:hidden text-xxs uppercase tracking-widester text-base-content/20 mt-8">
            For {recipient}
          </p>
        )}
      </div>
    </motion.div>
  );
}
