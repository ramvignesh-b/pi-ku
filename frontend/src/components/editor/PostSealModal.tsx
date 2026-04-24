import { LockIcon } from "@phosphor-icons/react";
import type { NavigateFunction } from "react-router-dom";
import { PATHS, ROUTES } from "../../config/routes";

interface PostSealModalProps {
  sealedTargetId: string | null;
  navigate: NavigateFunction;
}

export function PostSealModal({
  sealedTargetId,
  navigate,
}: PostSealModalProps) {
  if (!sealedTargetId) return null;
  return (
    <div className="modal modal-open modal-middle bg-base-100/20 backdrop-blur-md z-1000">
      <div className="modal-box flex flex-col items-center text-center gap-6">
        <LockIcon size={32} weight="duotone" className="text-primary mt-3" />
        <h3 className="font-serif text-2xl">Your letter is sealed</h3>
        <p className="text-base-content/60">
          It's encrypted and always safe in your drawer.
        </p>
        <p className="text-base-content font-sans">
          When you're ready,
          <br />
          you can{" "}
          <span className="text-primary font-bold font-display">read</span> it,{" "}
          <span className="text-accent font-bold font-display">send</span> it to
          someone, or{" "}
          <span className="text-error font-bold font-display">burn</span> it to
          release
        </p>
        <div className="modal-action w-full justify-center gap-3 mt-4 mb-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(ROUTES.DRAWER)}
          >
            Keep it to myself
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              navigate(PATHS.read(sealedTargetId), { replace: true })
            }
          >
            View letter
          </button>
        </div>
      </div>
    </div>
  );
}
