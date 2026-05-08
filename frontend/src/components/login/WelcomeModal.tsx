import {
  HandPalmIcon,
  ShieldCheckIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import Logo from "../Logo";
import { Modal } from "../ui/Modal";
import Saajan from "../ui/Saajan";

export default function WelcomeModal({
  setShowWelcome,
}: {
  setShowWelcome: (show: boolean) => void;
}) {
  return (
    <>
      <Modal isOpen={true}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full animate-pulse">
            <ShieldCheckIcon
              size={48}
              weight="duotone"
              className="text-primary"
            />
          </div>
          <h3 className="font-display text-2xl font-bold text-primary">
            Welcome to &nbsp;
            <Logo /> &nbsp;!
          </h3>
          <p className="text-base-content/80 leading-relaxed">
            Before we begin, let me make a small promise.
            <HandPalmIcon
              size={18}
              className="inline text-primary"
              weight="fill"
            />
            <span className="divider my-0 block"></span>
            Everything you write here is sealed with your password,{" "}
            <span className="font-display text-success">cryptographically</span>
            , before it leaves your hands.
            <br />A fancy way of saying, I couldn't if I tried.
          </p>

          <div className="alert alert-warning bg-paper/20 border-paper/20 flex items-start gap-3 text-left py-3">
            <WarningIcon size={24} weight="fill" className="shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-primary-content">
              If you ever happen to forget your password, your letters are lost
              to time, forever.
              <br />
              <span className="font-bold mt-2 block">
                I highly, highly recommend storing this password in your{" "}
                <a
                  href="https://www.privacyguides.org/en/passwords/"
                  target="_blank"
                  className="link link-primary-content"
                  rel="noopener noreferrer"
                >
                  password manager
                </a>{" "}
                or somewhere safe to remember it.
              </span>
            </div>
          </div>

          <div className="modal-action w-full">
            <button
              type="button"
              data-testid="welcome-dismiss-btn"
              onClick={() => setShowWelcome(false)}
              className="btn btn-primary w-full shadow-lg"
            >
              I'll remember
            </button>
          </div>
        </div>
      </Modal>
      <div className="absolute bottom-0 right-0 z-1000 font-sans w-full">
        <Saajan
          position="top"
          message={"I've lost words before.\nI know what it feels like."}
        />
      </div>
    </>
  );
}
