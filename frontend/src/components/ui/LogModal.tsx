import { WarningIcon } from "@phosphor-icons/react";
import { Modal } from "./Modal";

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
  return (
    <Modal isOpen={isOpen && status !== "RESET"} onClose={onClose}>
      <div
        className={`alert ${status === "WARN" ? "alert-warning" : "alert-error"} flex flex-col items-center text-center gap-6 py-4`}
      >
        {status === "WARN" && (
          <WarningIcon className="text-warning" size={16} weight="duotone" />
        )}
        {message}
        {log && (
          <>
            <div className="divider text-primary-content text-xs uppercase tracking-widest">
              Error Stack
            </div>
            <div className="mockup-code bg-base-100 text-error w-full">
              <pre>
                <code>{String(log)}</code>
              </pre>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
