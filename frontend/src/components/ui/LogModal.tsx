import { WarningIcon } from "@phosphor-icons/react";
import { Modal } from "./Modal";

interface LogModalContent {
  status: "WARN" | "ERROR" | "RESET" | "SUCCESS";
  message: string;
  reference?: string;
  onClose: () => void;
  isOpen: boolean;
}

export const LogModal = ({
  isOpen,
  message,
  reference,
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
        <span data-testid="log-modal-message">{message}</span>
        {reference && (
          <span
            className="font-mono text-xs opacity-60 select-all"
            data-testid="log-modal-reference"
          >
            Reference {reference}
          </span>
        )}
      </div>
    </Modal>
  );
};
