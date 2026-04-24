import { GearFineIcon } from "@phosphor-icons/react";

interface DrawerSectionProps {
  id: string;
  title: string;
  count: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function DrawerSection({
  id,
  title,
  count,
  isOpen,
  onClick,
  children,
}: DrawerSectionProps) {
  return (
    <div
      id={id}
      className={`join-item group flex flex-col transition-colors duration-3000 ease-in-out ${isOpen ? "bg-base-300/30" : ""}`}
    >
      <div
        className={`transition-all duration-1500 ease-in-out bg-neutral/10 ${
          isOpen
            ? "max-h-125 opacity-100 py-3 border-b border-base-content/5 overflow-visible"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`w-full p-[24px_28px] cursor-pointer flex items-center gap-5 transition-all duration-2000 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary/50 border border-base-content/10 text-left bg-linear-to-r from-transparent to-base-100/40`}
      >
        <div className="flex-1">
          <div
            className={`font-sans text-xs tracking-[0.2em] uppercase transition-colors duration-800 ${
              isOpen
                ? "text-base-content"
                : "text-base-content/40 group-hover:text-base-content/80"
            }`}
          >
            {title}
          </div>
          <div className="font-sans text-[0.6rem] text-base-content/20 mt-1">
            {count}
          </div>
        </div>

        {id === "vault" ? (
          <GearFineIcon
            className={
              "-mt-3 group-hover:animate-[spin_8s_ease-in-out_1] group-hover:text-neutral-content text-neutral"
            }
            weight={"duotone"}
            size={30}
          />
        ) : (
          <div
            className={`w-8 h-1 rounded-sm transition-all duration-300 bg-neutral ${
              isOpen
                ? "bg-primary/80! opacity-80 scale-110"
                : "group-hover:bg-primary"
            }`}
          >
            <div className="absolute -top-1 left-1.75 w-5 h-px bg-base-content/5" />
          </div>
        )}
      </button>
    </div>
  );
}
