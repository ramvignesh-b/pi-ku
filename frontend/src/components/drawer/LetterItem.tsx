import { LockIcon, LockKeyOpenIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../config/routes";

interface LetterItemProps {
  preview: string;
  timestamp: string;
  id: string;
  status: "DRAFT" | "SEALED" | "BURNED";
  unlock_at?: string;
  isLocked?: boolean;
}

export function LetterItem({
  preview,
  timestamp,
  id,
  status,
  unlock_at,
  isLocked = false,
}: LetterItemProps) {
  const navigate = useNavigate();
  function handleNavigate(): void {
    if (isLocked) return;
    if (status === "SEALED") {
      navigate(PATHS.read(id));
    } else {
      navigate(PATHS.write(id));
    }
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      data-testid={`letter-item-${id}`}
      className={`${isLocked ? "pointer-events-none" : ""} p-4 border-base-content/3 flex items-start gap-4 hover:bg-base-300 transition-all delay-75 duration-100 group text-left cursor-pointer w-9/12 mx-auto hover:scale-120 hover:h-24 hover:-translate-y-3 hover:pb-4 hover:border-x-5 hover:border-t-5 border-t-2 hover:-mb-2`}
    >
      <div className="text-sm italic text-base-content/40 flex-1 truncate group-hover:text-base-content/60">
        {preview}
      </div>
      {unlock_at ? (
        <div className="flex flex-col items-end">
          {isLocked ? (
            <div className="font-sans text-xs badge badge-accent badge-soft rounded-2xl">
              <LockIcon weight="duotone" size={16} />
              Locked Until {unlock_at}
            </div>
          ) : (
            <div className="font-sans text-xs badge badge-primary badge-soft rounded-2xl">
              <LockKeyOpenIcon weight="duotone" size={16} /> Unlocked
            </div>
          )}
        </div>
      ) : (
        <div className="font-sans text-xs text-base-content/20">
          {timestamp}
        </div>
      )}
    </button>
  );
}
