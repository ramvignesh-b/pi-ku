import {
  CircleHalfTiltIcon,
  ImageIcon,
  LockIcon,
  PaintBucketIcon,
  QuestionIcon,
  StampIcon,
  TextAUnderlineIcon,
  TrayIcon,
  VaultIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Modal } from "../ui/Modal";
import type { CanvasStyle } from "./ComposeCanvas.tsx";

interface ToolBarProps {
  onAddImage: () => void;
  sealBtnClicked: boolean;
  setSealBtnClicked: (v: boolean) => void;
  onSave: (status: "SEALED" | "DRAFT" | "VAULT", date?: Date) => Promise<void>;
  setConfirmModal: (v: "VAULT" | "SEAL" | null) => void;
  onFontChange: (style: CanvasStyle) => void;
  latestFontStyle: CanvasStyle;
}

const FONT_FAMILIES: Map<string, string> = new Map([
  ["Serif", "Playfair Display Variable"],
  ["Sans", "Jost Variable"],
  ["Cursive", "Playwrite HR Lijeva Variable"],
  ["Handwriting", "Architects Daughter"],
  ["Slab", "Cutive Mono"],
  ["Mono", "Space Mono"],
  ["Tamil", "Kavivanar"],
  ["Crazy(pls no)", "Redacted Script"],
]);
const FONT_COLORS: Map<string, string> = new Map([
  ["Black", "#000"],
  ["Gold", "#866a0e"],
  ["Purple", "#711caf"],
  ["Green", "#1f5b1f"],
  ["Blue", "#111e67"],
]);

export function ToolBar({
  onAddImage,
  sealBtnClicked,
  setSealBtnClicked,
  onSave,
  setConfirmModal,
  onFontChange,
  latestFontStyle,
}: ToolBarProps) {
  return (
    <div
      id="writer-toolbar"
      className="relative z-10 flex items-center justify-between mb-8 h-14 bg-base-100/50 backdrop-blur-md rounded-full border border-base-content/5 px-6"
    >
      <div className="flex gap-4">
        {/* Image upload */}
        <button
          type="button"
          className="btn btn-ghost btn-sm group"
          onClick={onAddImage}
        >
          <ImageIcon size={18} weight="bold" />
          <span className="hidden md:inline group-hover:inline transition-all duration-1000">
            Add Image
          </span>
        </button>
        <div className="w-px h-4 bg-base-content/10 mx-2 my-auto hidden md:inline" />

        {/* Font Family */}
        <div className={"flex items-center gap-2 group"}>
          <TextAUnderlineIcon
            size={24}
            weight="bold"
            className={"hidden md:inline"}
          />
          <select
            className="select select-sm"
            onChange={(e) => {
              onFontChange({ ...latestFontStyle, fontFamily: e.target.value });
            }}
            value={latestFontStyle.fontFamily}
          >
            {Array.from(FONT_FAMILIES.entries()).map(
              ([fontFamily, fontName]) => {
                return (
                  <option key={fontName} value={fontName}>
                    {fontFamily}
                  </option>
                );
              },
            )}
          </select>
        </div>
        <div className="w-px h-4 bg-base-content/10 mx-2 my-auto hidden md:inline" />

        {/* Font Color */}
        <div className="dropdown dropdown-bottom flex items-center gap-2 group">
          <PaintBucketIcon
            size={16}
            weight="bold"
            className={"hidden md:flex"}
          />
          <button
            className="btn btn-ghost btn-sm px-2 gap-2 flex items-center"
            type={"button"}
          >
            <CircleHalfTiltIcon
              size={18}
              style={{ color: latestFontStyle.fontColor }}
              weight="duotone"
            />
          </button>
          <ul className="dropdown-content z-50 menu p-2 shadow bg-base-200/95 rounded-full md:ml-4">
            {Array.from(FONT_COLORS.entries()).map(([_, colorCode]) => (
              <li key={colorCode}>
                <button
                  type="button"
                  className={`${latestFontStyle.fontColor === colorCode ? "active" : ""}`}
                  onClick={() => {
                    onFontChange({ ...latestFontStyle, fontColor: colorCode });
                    (document.activeElement as HTMLButtonElement)?.blur();
                  }}
                >
                  <CircleHalfTiltIcon
                    size={18}
                    style={{ color: colorCode }}
                    weight="fill"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Draft */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="draft-btn"
          className="btn btn-ghost btn-sm text-xxs group tracking-widester uppercase font-bold text-base-content/60 hover:text-base-content"
          title="Store in your private drawer"
          onClick={() => onSave("DRAFT")}
        >
          <TrayIcon size={18} weight="bold" />
          <span className="hidden md:inline group-hover:inline transition-all duration-1000">
            Draft
          </span>
        </button>

        <div className="w-px h-4 bg-base-content/10 mx-2 hidden md:inline" />

        {/*Seal */}
        <button
          type="button"
          data-testid="seal-trigger-btn"
          className={`btn btn-primary btn-sm rounded-full px-6 group ${sealBtnClicked ? "invisible" : "visible"}`}
          onClick={() => setSealBtnClicked(true)}
        >
          <StampIcon
            size={16}
            weight="fill"
            className="mr-1 group-hover:animate-bounce"
          />
          <span
            className={`hidden md:inline ${sealBtnClicked ? "inline" : ""} group-hover:inline transition-all duration-1000`}
          >
            Seal
          </span>
        </button>
      </div>

      <div
        className={`flex-col items-center gap-2 absolute right-0 z-10 bg-primary/20 rounded-full p-8 -m-2 ${sealBtnClicked ? "" : "hidden"}`}
      >
        <button
          type="button"
          data-testid="seal-confirm-btn"
          className="btn btn-accent btn-sm rounded-full px-6 group"
          onClick={() => onSave("SEALED")}
        >
          <StampIcon
            size={16}
            weight="fill"
            className="mr-1 group-hover:animate-bounce"
          />
          <span className="transition-all duration-1000">Seal</span>
        </button>
        <div className="w-full divider text-neutral-content/60 mt-2 mb-2">
          or
        </div>
        <button
          type="button"
          className="btn btn-neutral btn-sm rounded-full px-6 group"
          onClick={() => setConfirmModal("VAULT")}
        >
          <VaultIcon size={16} weight="fill" className="mr-1" />
          <span className="transition-all duration-1000">Vault</span>
        </button>
      </div>
      <button
        className={`z-100001 absolute right-0 bg-transparent cursor-pointer ${sealBtnClicked ? "" : "hidden"}`}
        type="button"
        onClick={() => setSealBtnClicked(false)}
      >
        <XCircleIcon weight="duotone" size={20} className={"text-error"} />
      </button>
      <button
        type="button"
        aria-label="Help"
        className={`bg-transparent cursor-pointer -mt-2 absolute z-100001 right-0 text-primary  ${sealBtnClicked ? "" : "hidden"}`}
      >
        <div className="tooltip tooltip-left">
          <div className="tooltip-content -translate-x-38 text-left">
            <span className="font-bold text-accent">Seal</span> puts the letter
            in an envelope, ready to be read right away.
            <div className="divider my-0"></div>
            <span className="font-bold text-success">Vault</span> keeps it
            locked away until the right moment, even from yourself.
          </div>
          <QuestionIcon
            weight="duotone"
            size={20}
            className={"absolute -translate-x-38 -translate-y-3"}
          />
        </div>
      </button>
    </div>
  );
}

export function LetterHead() {
  return (
    <div className="flex items-center justify-center mb-8 h-14">
      <div className="badge badge-outline border-primary/20 bg-primary/5 text-primary gap-2 p-4 rounded-full">
        <LockIcon size={14} weight="fill" />
        <span className="text-xxs uppercase tracking-widest font-bold">
          Sealed & View Only
        </span>
      </div>
    </div>
  );
}

interface VaultConfirmModalProps {
  onSave: (status: "SEALED" | "DRAFT" | "VAULT", date?: Date) => Promise<void>;
  setConfirmModal: (v: "VAULT" | "SEAL" | null) => void;
  setUnlockDate: (d: Date | null) => void;
}

export function VaultConfirmModal({
  onSave,
  setConfirmModal,
  setUnlockDate,
}: VaultConfirmModalProps) {
  return (
    <Modal isOpen={true}>
      <VaultIcon
        size={48}
        className="text-primary mx-auto mb-8 animate-pulse"
      />
      <h3 className="font-serif text-3xl">Take it away, then?</h3>
      <p className="text-base-content/60 text-sm text-center mt-4">
        By vaulting this letter, you ask me to hold on to this.
        <br />
        I'll remember to mail you this on the unlock date.
        <br />
        <span className={"font-bold text-primary"}>
          {" "}
          But I won't let you read or rewrite this letter until then.
        </span>
        <br />
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const unlockDateStr = formData.get("vault-date") as string;
          const newUnlockDate = new Date(unlockDateStr);
          setUnlockDate(newUnlockDate);
          await onSave("VAULT", newUnlockDate);
          setConfirmModal(null);
        }}
        id="vault-form"
        className="min-w-75"
      >
        <div className={"divider tracking-tightest font-display text-sm"}>
          Set an unlock date
        </div>
        <input
          required
          type="date"
          className="input input-bordered w-full"
          name="vault-date"
        />
        <div className="w-full flex justify-center gap-8 mt-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => setConfirmModal(null)}
          >
            I need time
          </button>
          <button
            className="btn btn-primary btn-sm mt-4"
            type="submit"
            form="vault-form"
          >
            Take it
          </button>
        </div>
      </form>
    </Modal>
  );
}
