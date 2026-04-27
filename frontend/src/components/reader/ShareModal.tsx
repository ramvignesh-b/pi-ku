import {
  EyeSlashIcon,
  PaperPlaneTiltIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

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
    <div className="modal modal-open modal-middle bg-base-100/20 backdrop-blur-md z-100">
      <div className="modal-box bg-base-100 border border-base-content/5 shadow-2xl relative">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={() => setShareLink(null)}
          aria-label="Close"
        >
          <XCircleIcon size={18} weight="bold" />
        </button>
        <div className="flex flex-col items-center justify-center text-center gap-6 py-4">
          <div className="space-y-2">
            <PaperPlaneTiltIcon
              size={48}
              weight="bold"
              className="mb-4 text-primary mx-auto animate-[bounce_3s_ease-in-out_infinite]"
            />
            <h3 className="font-serif text-3xl">Send this letter</h3>
            <p className="text-base-content/80 text-sm font-sans mt-4">
              You've carried these words long enough. Send your letter now, and
              let the <span className="text-accent font-display">unsaid</span>{" "}
              finally find its home.
            </p>
            <div className="divider mx-auto" />
            <blockquote className="text-sm info text-neutral-content/60 font-sans">
              The recipient will have the same viewing experience like you do
              now.
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
      </div>
    </div>
  );
}
