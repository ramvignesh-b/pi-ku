import { CampfireIcon, FlameIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";

interface BurnModalProps {
  burnLetter: () => void;
  isBurning: boolean;
  setShowBurnModal: (show: boolean) => void;
  setRevealState: (state: "SEALED" | "REVEALED" | "BURNING" | "BURNED") => void;
}

export function BurnModal({
  burnLetter,
  isBurning,
  setShowBurnModal,
  setRevealState,
}: BurnModalProps) {
  const [flameOn, setFlameOn] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [burnClicked, setBurnClicked] = useState(false);
  useEffect(() => {
    if (!burnClicked) return;
    if (flameOn === 100) {
      setRevealState("SEALED");
      burnLetter();
    }
    const interval = setInterval(() => {
      setFlameOn((prev) => prev + 1);
      setRotate(Math.random() * 4 - 2);
    }, 100);
    return () => clearInterval(interval);
  }, [burnClicked, flameOn, setRevealState, burnLetter]);

  const burnStyle = flameOn < 30 ? "" : `contrast(${flameOn / 30})`;

  return (
    <Modal isOpen={true} onClose={() => setShowBurnModal(false)}>
      <div
        className={`flex flex-col items-center gap-4 text-center transition-all duration-200 ease-in-out ${burnClicked ? "animate-[pulse_15s_linear_infinite]" : ""}`}
        style={
          {
            transform: `rotate(${rotate}deg)`,
          } as React.CSSProperties
        }
      >
        <CampfireIcon
          size={48}
          weight="duotone"
          className="text-error animate-pulse"
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
        <div className="mt-4 font-sans text-sm">
          <span className="text-error">Press</span> and{" "}
          <span className="text-error">hold</span> the{" "}
          <span className="text-amber-300">flame</span> to proceed.
        </div>
        <div className="modal-action w-full justify-center gap-3 mt-2">
          <div
            className="absolute -mt-2 w-28 h-28 radial-progress pointer-events-none text-amber-200/60"
            style={
              { "--value": flameOn, filter: burnStyle } as React.CSSProperties
            }
            role="progressbar"
          ></div>
          <button
            type="button"
            className={`btn btn-error btn-dashed btn-circle w-24 h-24`}
            style={
              {
                filter: burnStyle,
                cursor: burnClicked ? "grabbing" : "grab",
              } as React.CSSProperties
            }
            onMouseDown={() => setBurnClicked(true)}
            onMouseUp={() => {
              setFlameOn(0);
              setBurnClicked(false);
            }}
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
