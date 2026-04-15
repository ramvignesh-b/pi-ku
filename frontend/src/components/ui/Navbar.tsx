import { ArrowArcLeftIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export const Navbar = ({ child }: { child?: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-999 border-b border-base-content/5 bg-base-300/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="max-w-280 h-full mx-auto px-6 flex items-center justify-between">
        {/* Left: Back to Drawer */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.DRAWER)}
          className="group flex items-center gap-2 px-0 hover:bg-transparent cursor-pointer"
          aria-label="Open Drawer"
        >
          <div className="p-1.5 rounded-full bg-base-content/5 transition-colors group-hover:bg-primary/10">
            <ArrowArcLeftIcon
              size={14}
              weight="bold"
              className="text-base-content/40 group-hover:text-primary transition-colors"
            />
          </div>
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase font-bold text-base-content/30 group-hover:text-base-content transition-colors">
            Drawer
          </span>
        </button>

        {/* Right: Custom child */}
        <div className="flex items-center gap-2">{child}</div>
      </div>
    </nav>
  );
};
