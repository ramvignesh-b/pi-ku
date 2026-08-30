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
        <div className="flex flex-col items-center text-center gap-2 md:gap-4">
          <div className="bg-primary/10 p-4 rounded-full animate-pulse">
            <ShieldCheckIcon
              size={48}
              weight="duotone"
              className="text-primary"
            />
          </div>
          <h3 className="font-display text-2xl font-bold text-primary">
            Welcome to&nbsp;
            <Logo type="inline" />
          </h3>
          <p className="inline text-sm md:text-base text-base-content/80">
            Before we begin, let me make a small promise.
            <HandPalmIcon
              size={18}
              className="inline text-primary"
              weight="fill"
            />
            <span className="divider my-0"></span>
            Everything you write here is sealed with your password,&nbsp;
            <span className="font-display text-success">cryptographically</span>
            , before it leaves your hands.
            <br />
            <br />A fancy way of saying, no one else can read them without your
            key&mdash;not even me.
          </p>

          <div className="alert alert-warning flex items-start gap-3 text-left py-3">
            <WarningIcon size={24} weight="fill" className="shrink-0" />
            <div className="text-xs md:text-sm font-medium text-primary-content tracking-tight">
              If you ever happen to forget your password, your letters are lost
              to time, forever.
              <span className="mt-2 block">
                I highly, <span className="font-bold italic">highly</span>&nbsp;
                recommend storing this password in your&nbsp;
                <a
                  href="https://www.privacyguides.org/en/passwords/"
                  target="_blank"
                  className="link link-neutral!"
                  rel="noopener noreferrer"
                >
                  password manager
                </a>
                &nbsp; or somewhere safe to remember it.
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
      <div className="absolute bottom-0 md:right-5/12 z-1000 font-sans w-full flex justify-center">
        <Saajan
          position="left"
          message={"I've lost words before.\nI know what it feels like."}
        />
      </div>
    </>
  );
}
