import { FeatherIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { DrawerSection } from "../components/ui/Drawer";
import { LetterItem } from "../components/ui/LetterItem";
import { PATHS } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useLetters } from "../hooks/useLetters";

export default function Drawer() {
  const { user, logout } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>("kept");
  const navigate = useNavigate();
  const { drafts, kept, sent, vault, loading } = useLetters();

  if (!user) return null;

  const toggleSection = (id: string) =>
    setOpenSection(openSection === id ? null : id);

  return (
    <div className="min-h-screen w-full bg-base-100 text-base-content flex flex-col items-center py-12 px-5 pb-32 font-serif transition-colors">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-0" />

      <header className="text-center mb-12 z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <Logo />
        <div className="font-sans text-xs tracking-[0.3em] uppercase text-base-content/40 mt-2">
          Personal Archive
        </div>
        <div className="mt-6 font-sans text-sm text-base-content flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          Welcome Back{" "}
          <span className="font-semibold text-primary">{user.full_name}</span>
          <button
            type="button"
            onClick={logout}
            className="ml-3 cursor-pointer underline underline-offset-4 text-xs hover:text-primary transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="join join-vertical w-full max-w-120 bg-base-200 border border-base-content/10 shadow-2xl z-10 rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-backwards min-h-64 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
            <span className="loading loading-ring loading-lg text-primary opacity-20"></span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-base-content/20 animate-pulse">
              Opening your cabinet...
            </span>
          </div>
        ) : (
          <>
            <DrawerSection
              id="drafts"
              title="Drafts"
              count={`${drafts.length} unfinished whispers`}
              isOpen={openSection === "drafts"}
              onClick={() => toggleSection("drafts")}
            >
              {drafts.map((draft) => (
                <LetterItem
                  id={draft.public_id}
                  status={draft.status}
                  key={draft.public_id}
                  preview={draft.metadata?.recipient || "Untitled Draft"}
                  timestamp={draft.updated_at}
                />
              ))}
            </DrawerSection>

            <DrawerSection
              id="kept"
              title="Kept"
              count={`${kept.length} private letters`}
              isOpen={openSection === "kept"}
              onClick={() => toggleSection("kept")}
            >
              {kept.map((letter) => (
                <LetterItem
                  id={letter.public_id}
                  status={letter.status}
                  key={letter.public_id}
                  preview={letter.metadata?.recipient || "Someone dear..."}
                  timestamp={letter.updated_at}
                />
              ))}
            </DrawerSection>
            <DrawerSection
              id="sent"
              title="Sent"
              count={`${sent.length} shared truths`}
              isOpen={openSection === "sent"}
              onClick={() => toggleSection("sent")}
            >
              {sent.map((letter) => (
                <LetterItem
                  key={letter.public_id}
                  status={letter.status}
                  id={letter.public_id}
                  preview={letter.metadata?.recipient || "Someone dear..."}
                  timestamp={letter.updated_at}
                />
              ))}
            </DrawerSection>
            <DrawerSection
              id="vault"
              title="Vault"
              count={`${vault.length} things locked;not lost;in time`}
              isOpen={openSection === "vault"}
              onClick={() => toggleSection("vault")}
            >
              {vault.map((letter) => (
                <LetterItem
                  key={letter.public_id}
                  status={letter.status}
                  id={letter.public_id}
                  preview={letter.metadata?.recipient || "Future Self"}
                  timestamp={letter.updated_at}
                />
              ))}
            </DrawerSection>
          </>
        )}
      </div>

      <button
        type="button"
        className="group mt-15 z-10 bg-transparent border border-dashed border-base-content/10 px-8 py-4 text-base-content/40 italic cursor-pointer transition-all hover:border-primary/40 hover:text-base-content/60 hover:bg-primary/5 hover:-translate-y-0.5 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary/50 duration-1000"
        onClick={() => navigate(PATHS.write(""), { replace: true })}
      >
        <FeatherIcon
          size={18}
          weight="duotone"
          className="text-primary/30 transition-all duration-700 group-hover:text-primary"
        />
        Write something{" "}
        <span className="relative inline-flex">
          <span className="transition-opacity duration-1500 opacity-80 group-hover:opacity-0">
            . . . . . .
          </span>
          <span className="absolute inset-0 text-primary transition-opacity duration-1000 opacity-0 group-hover:opacity-100">
            unsaid
          </span>
        </span>
      </button>

      <footer className="mt-25 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-base-content/10 z-10">
        Kept. Unsent.
      </footer>
    </div>
  );
}
