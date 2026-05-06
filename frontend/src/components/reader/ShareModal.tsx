import { EyeSlashIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Modal } from "../ui/Modal";
import Saajan from "../ui/Saajan";

interface ShareModalProps {
  shareLink: string | null;
  setShareLink: (link: string | null) => void;
}

export function ShareModal({ shareLink, setShareLink }: ShareModalProps) {
  const copyToClipboard = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
  };
  return (
    <>
      <Modal
        isOpen={!!shareLink}
        onClose={() => setShareLink(null)}
        data-testid="share-letter-modal"
      >
        <div className="flex flex-col items-center justify-center text-center gap-6 py-4">
          <div className="space-y-2">
            <PaperPlaneTiltIcon
              size={48}
              weight="bold"
              className="mb-4 text-primary mx-auto animate-[bounce_3s_ease-in-out_infinite]"
            />
            <h3 className="font-serif text-3xl">Send this letter</h3>
            <p className="text-base-content/80 text-sm font-sans mt-4">
              You've carried these words long enough.
              <br />
              Send your letter now, and let the{" "}
              <span className="text-accent font-display">unsaid</span> finally
              find its home.
            </p>
            <div className="divider mx-auto" />
            <blockquote className="text-sm info text-neutral-content/60 font-sans">
              They'll receive it exactly as you're seeing it now.
              <br />
              Nothing more, nothing less.
            </blockquote>
          </div>
          <div className="w-full flex items-center gap-2 bg-base-300 p-2 rounded-xl">
            <input
              id="share-link-input"
              readOnly
              value={shareLink ?? ""}
              className="flex-1 bg-transparent text-xs font-mono px-2 overflow-hidden text-ellipsis whitespace-nowrap outline-none"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              data-testid="copy-link-btn"
              className="btn btn-primary font-sans btn-sm rounded-tl-xl rounded-bl-xl rounded-tr-full rounded-br-full"
            >
              Copy
            </button>
          </div>
          <div className="flex flex-col gap-1 uppercase tracking-widest text-base-content/30 font-sans">
            <p className="textarea-xs flex items-center justify-center">
              <EyeSlashIcon weight="duotone" size={18} className="mr-2" />{" "}
              Zero-Knowledge Share:
            </p>
            <p className="textarea-xs font-mono text-center">
              The key never leaves your or the recipient's browser.
            </p>
          </div>
        </div>
      </Modal>
      <div className="absolute bottom-0 z-1000 font-sans w-full">
        <Saajan
          position="top"
          message={`Someone once said,\n"To send a letter is a good way to go somewhere without moving anything but your heart."\nThey were not wrong.`}
        />
      </div>
    </>
  );
}
