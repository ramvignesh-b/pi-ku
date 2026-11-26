import { CampfireIcon, FlameIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Modal } from "../ui/Modal";

const HOLD_MS = 10_000;

type HoldInput = { pointerId: number } | { key: string };

interface BurnModalProps {
  burnLetter: () => void;
  isBurning: boolean;
  setShowBurnModal: (show: boolean) => void;
}

export function BurnModal({
  burnLetter,
  isBurning,
  setShowBurnModal,
}: BurnModalProps) {
  const [progress, setProgress] = useState(0);
  const activeInput = useRef<HoldInput | null>(null);
  const frame = useRef(0);
  const confirmed = useRef(false);
  const instructionId = useId();

  const cancelHold = useCallback(() => {
    if (!activeInput.current) return;
    activeInput.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) cancelHold();
    };
    window.addEventListener("blur", cancelHold);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", cancelHold);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(frame.current);
    };
  }, [cancelHold]);

  const startHold = (input: HoldInput) => {
    if (activeInput.current || confirmed.current || isBurning) return;

    activeInput.current = input;
    const startedAt = performance.now();
    const tick = (time: number) => {
      const elapsed = time - startedAt;
      if (elapsed >= HOLD_MS) {
        activeInput.current = null;
        confirmed.current = true;
        setProgress(100);
        burnLetter();
        return;
      }
      setProgress(Math.max(0, Math.floor((elapsed / HOLD_MS) * 100)));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const matchesPointer = (pointerId: number) =>
    activeInput.current &&
    "pointerId" in activeInput.current &&
    activeInput.current.pointerId === pointerId;

  const releasePointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (matchesPointer(event.pointerId)) cancelHold();
  };

  return (
    <Modal
      isOpen
      onClose={isBurning ? undefined : () => setShowBurnModal(false)}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <CampfireIcon
          size={48}
          weight="duotone"
          className="text-error motion-safe:animate-pulse"
        />
        <h3 className="font-serif text-2xl">
          Are you ready to burn this letter?
        </h3>
        <p className="text-sm font-sans text-base-content/80 mt-4">
          Some words are meant to be unsaid, but they don't have to linger
          forever.
          <br />
          Let the echoes of your unsaid be finally released.
        </p>
        <div id={instructionId} className="mt-4 font-sans text-sm">
          <span className="text-error">Press</span> and&nbsp;
          <span className="text-error">hold</span> the&nbsp;
          <span className="text-amber-300">flame</span> to proceed.
        </div>
        <div className="modal-action w-full justify-center gap-3 mt-2">
          <div
            className="absolute -mt-2 w-28 h-28 radial-progress pointer-events-none text-amber-200/60"
            style={{ "--value": progress } as React.CSSProperties}
            role="progressbar"
            aria-label="Burn confirmation"
            aria-valuenow={progress}
          />
          <button
            type="button"
            className="btn btn-error btn-dashed btn-circle w-24 h-24 touch-none select-none cursor-grab active:cursor-grabbing"
            aria-label="Hold to burn the letter"
            aria-describedby={instructionId}
            onPointerDown={(event) => {
              if (event.button !== 0 || !event.isPrimary) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              startHold({ pointerId: event.pointerId });
            }}
            onPointerMove={(event) => {
              if (!matchesPointer(event.pointerId)) return;
              const { left, right, top, bottom } =
                event.currentTarget.getBoundingClientRect();
              const { clientX, clientY } = event;
              if (
                clientX < left ||
                clientX > right ||
                clientY < top ||
                clientY > bottom
              ) {
                cancelHold();
              }
            }}
            onPointerUp={releasePointer}
            onPointerCancel={releasePointer}
            onLostPointerCapture={releasePointer}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancelHold();
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (!event.repeat) startHold({ key: event.key });
            }}
            onKeyUp={(event) => {
              const input = activeInput.current;
              if (input && "key" in input && input.key === event.key)
                cancelHold();
            }}
            onBlur={cancelHold}
            disabled={isBurning}
          >
            {isBurning ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FlameIcon size={54} weight="duotone" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
