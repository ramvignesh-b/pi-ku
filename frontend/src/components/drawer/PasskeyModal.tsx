import { LockKeyIcon } from "@phosphor-icons/react";
import { Modal } from "../ui/Modal";

interface PasskeyModalProps {
  onUnlock: (password: string) => Promise<void>;
}

export function PasskeyModal({ onUnlock }: PasskeyModalProps) {
  return (
    <Modal isOpen={true}>
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
        Your passkey is used to decrypt your data locally.
      </p>
      <div className="modal-action items-center gap-4">
        <form
          className="form-control w-full inline-flex"
          onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const password = formData.get("password") as string;
            if (!password) return;
            await onUnlock(password);
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
          <button type="submit" className="btn btn-primary rounded-l-none">
            Unlock
          </button>
        </form>
      </div>
    </Modal>
  );
}
