import { GearFineIcon } from "@phosphor-icons/react";

interface DrawerSectionProps {
  id: string;
  title: string;
  count: number;
  subtext: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}

export function DrawerSection({
  id,
  title,
  count,
  subtext,
  isOpen,
  onClick,
  children,
  icon,
}: DrawerSectionProps) {
  return (
    <div
      id={id}
      className={`join-item group flex flex-col transition-colors duration-3000 ease-in-out ${isOpen ? "bg-base-300/30" : ""}`}
    >
      <div
        className={`bg-neutral/10 transition-all duration-1000 ease-in-out overflow-visible ${isOpen ? "max-h-125" : "max-h-0 pointer-events-none"}`}
      >
        <div
          className={`transition-opacity ease-in-out ${
            isOpen
              ? "opacity-100 py-3 border-b border-base-content/5 duration-700 delay-500"
              : "opacity-0 duration-100"
          }`}
        >
          {children}
          {count === 0 && (
            <p
              data-testid={`empty-drawer-message-${id}`}
              className="text-center text-base-content/20 mt-4"
            >
              This drawer remains silent
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        data-testid={`drawer-section-${id}`}
        className="w-full relative p-[24px_28px] cursor-pointer flex items-center gap-5 transition-all duration-2000 ease-in-out outline-none focus-visible:ring-2 overflow-hidden focus-visible:ring-primary/50 border border-base-content/10 text-left bg-linear-to-r from-transparent to-base-100/40"
      >
        <div className="flex-1">
          <div
            data-testid="drawer-section-title"
            className={`font-sans text-xs tracking-widester uppercase transition-colors duration-800 ${
              isOpen
                ? "text-base-content"
                : "text-base-content/40 group-hover:text-base-content/80"
            }`}
          >
            {title}
          </div>
          <div className="font-sans text-xs text-base-content/20 mt-1">
            <span className="font-mono text-xs md:text-base -mt-1 absolute text-primary/30">
              {count}
            </span>{" "}
            <span className="ml-3">{subtext}</span>
          </div>
          <div className="absolute right-5 -translate-y-15 text-base-content/4">
            {icon}
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
