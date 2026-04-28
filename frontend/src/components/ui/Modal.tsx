import { XCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open modal-middle backdrop-blur-md before:absolute before:top-0 before:left-0 before:w-full before:h-full before:content-[''] before:opacity-[0.03] before:z-10 before:pointer-events-none before:bg-[url('assets/noise.gif')]">
      <div className="modal-box relative bg-base-100/60 flex flex-col items-center text-center gap-6">
        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-20"
            onClick={onClose}
            aria-label="Close"
          >
            <XCircleIcon size={18} weight="bold" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
