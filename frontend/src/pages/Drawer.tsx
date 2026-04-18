import { FeatherIcon, LockKeyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { DrawerSection } from "../components/ui/DrawerSection";
import { LetterItem } from "../components/ui/LetterItem";
import { PATHS } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useLetters } from "../hooks/useLetters";
import { formatRelativeDate } from "../utils/dateFormat.ts";

export default function Drawer() {
  const { user, logout, unlock } = useAuth();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const { drafts, kept, sent, vault, loading, isAuthRequired } = useLetters();

  if (!user) return null;

  const toggleSection = (id: string) =>
    setOpenSection(openSection === id ? null : id);

  return (
    <div className="min-h-screen w-full bg-base-100 text-base-content flex flex-col items-center py-12 px-5 pb-32 font-serif transition-colors">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-0" />

      {isAuthRequired && (
        <div className="modal modal-open bg-base-100/20 backdrop-blur-md">
          <div className="modal-box p-12 flex flex-col items-center">
            <LockKeyIcon
              size={48}
              className="text-primary mx-auto mb-8 animate-pulse"
            />
            <h3 className="font-bold text-lg font-display text-primary">
              Authentication Required
            </h3>
            <p className="py-4 font-sans">
              We need your passkey to open your letters
            </p>
            <div className="divider w-1/2 mx-auto text-xs text-neutral-content/30 mt-0"></div>
            <p className="text-xs text-neutral-content/30 font-mono italic">
              P.S. We don't validate your input at the moment.
            </p>
            <div className="modal-action items-center gap-4">
              <form
                className="form-control w-full inline-flex"
                onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;
                  if (!password) return;
                  unlock(password);
                }}
              >
                <input
                  name="password"
                  required
                  type="password"
                  placeholder="password"
                  className="font-sans validator input input-bordered rounded-r-none"
                />
                <div className="validator-message text-xs text-error"></div>
                <button
                  type="submit"
                  className="btn btn-primary rounded-l-none"
                >
                  Unlock
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
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

      <div className="join join-vertical w-full max-w-120 bg-base-200 border border-base-content/10 shadow-2xl z-10 rounded-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-backwards min-h-64 flex flex-col">
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
                  timestamp={formatRelativeDate(draft.updated_at)}
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
                  timestamp={formatRelativeDate(letter.updated_at)}
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
                  timestamp={formatRelativeDate(letter.updated_at)}
                />
              ))}
              {sent.length === 0 && (
                <p className="text-center text-base-content/20 mt-4">
                  This drawer remains silent
                </p>
              )}
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
                  timestamp={formatRelativeDate(letter.updated_at)}
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
        For your unsaid.
      </footer>
    </div>
  );
}
