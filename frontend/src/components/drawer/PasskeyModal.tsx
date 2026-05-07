import { HourglassSimpleMediumIcon } from "@phosphor-icons/react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../ui/Modal";

export function PasskeyModal() {
  const { unlock } = useAuth();

  return (
    <Modal isOpen={true}>
      <HourglassSimpleMediumIcon
        size={48}
        className="text-primary mx-auto mb-8 animate-pulse"
        weight="duotone"
      />
      <h3 data-testid="passkey-modal-title" className="font-bold text-lg font-display text-primary">
        You've been away a while.
      </h3>
      <p className="py-4 font-sans">
        Your letters are still there. Just need the key once more.
      </p>
      <div className="divider w-1/2 mx-auto text-xs text-neutral-content/30 mt-0"></div>
      <p className="text-xs text-neutral-content/30 font-mono italic">
        Nothing was lost.
      </p>
      <div className="modal-action items-center gap-4">
        <form
          className="form-control w-full inline-flex"
          onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const password = formData.get("password") as string;
            if (!password) return;
            await unlock(password);
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
