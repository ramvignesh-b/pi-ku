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
      className="p-4 border-base-content/3 flex items-start gap-4 hover:bg-base-300 transition-transform duration-100 group text-left cursor-pointer w-9/12 mx-auto hover:scale-120 hover:h-24 hover:-translate-y-3 hover:pb-4 hover:border-x-5 hover:border-t-5 border-t-2 hover:-mb-2"
    >
      <div className="text-[0.85rem] italic text-base-content/40 flex-1 truncate group-hover:text-base-content/60 transition-none">
        {preview}
      </div>
      <div className="font-sans text-[0.6rem] text-base-content/20 transition-none">
        {timestamp}
      </div>
    </button>
  );
}
