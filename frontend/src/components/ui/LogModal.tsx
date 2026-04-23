import { WarningIcon, XCircleIcon, XIcon } from "@phosphor-icons/react";

interface LogModalContent {
  status: "WARN" | "ERROR" | "RESET" | "SUCCESS";
  message: string;
  log: string;
  onClose: () => void;
  isOpen: boolean;
}

export const LogModal = ({
  isOpen,
  message,
  log,
  onClose,
  status,
}: LogModalContent) => {
  return status === "RESET" || !isOpen ? (
    <div></div>
  ) : (
    <div className="modal modal-open modal-middle bg-base-100/20 backdrop-blur-md z-100">
      <div className="modal-box bg-transparent border-none shadow-none relative">
        <div
          className={`alert ${status === "WARN" ? "alert-warning" : "alert-error"} flex flex-col items-center text-center gap-6 py-4`}
        >
          {status === "WARN" && (
            <WarningIcon className="text-warning" size={16} weight="bold" />
          )}
          {status === "ERROR" && (
            <XCircleIcon className="text-error" size={16} weight="bold" />
          )}
          {message}
          <div className="divider text-primary-content text-xs uppercase tracking-widest">
            Error Stack
          </div>
          <div className="mockup-code bg-base-100 text-error w-full">
            <pre>
              <code>{String(log)}</code>
            </pre>
          </div>
          <form method="dialog">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6"
            >
              <XIcon size={6} weight="bold" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
