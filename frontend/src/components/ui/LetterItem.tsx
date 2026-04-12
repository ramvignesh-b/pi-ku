import { useNavigate } from "react-router-dom";
import { PATHS } from "../../config/routes";

export function LetterItem({
  preview,
  timestamp,
  id,
  status,
}: {
  preview: string;
  timestamp: string;
  id: string;
  status: "DRAFT" | "SEALED" | "BURNED";
}) {
  const navigate = useNavigate();
  function handleNavigate(): void {
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
      className="p-[16px_28px_16px_76px] border-b border-base-content/3 flex items-center gap-4 hover:bg-base-content/5 transition-colors group w-full text-left"
    >
      <div className="text-[0.85rem] italic text-base-content/40 flex-1 truncate group-hover:text-base-content/60">
        {preview}
      </div>
      <div className="font-sans text-[0.6rem] text-base-content/20">
        {timestamp}
      </div>
    </button>
  );
}
