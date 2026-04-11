import { ImageIcon, LockIcon, TrayIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { ComposeCanvas } from "../components/ui/ComposeCanvas";
import DateDisplay from "../components/ui/DateDisplay";

export default function Editor() {
  const [recipient, setRecipient] = useState("");

  const canvasRef = useRef<any>(null);
  const _fileInputRef = useRef<HTMLInputElement>(null);
  const _handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url);
    }
  };

  return (
    <section className="flex-1 overflow-y-auto scrollbar-hide px-2 py-12 bg-base-300">
      <div className="max-w-[720px] mx-auto px-1 md:px-0">
        <div className="flex justify-between items-end mb-16 border-b border-base-content/5 pb-8 px-0">
          <div className="flex flex-col gap-2 flex-1">
            <label
              htmlFor="recipient"
              className="text-[10px] uppercase tracking-[0.4em] text-secondary-content font-bold"
            >
              Recipient
            </label>
            <input
              id="recipient"
              type="text"
              placeholder="Someone dear..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-transparent border-none outline-none text-4xl font-serif text-base-content placeholder:text-base-content/10 w-full"
            />
          </div>
          <DateDisplay />
        </div>

        <div
          id="writer-toolbar"
          className="flex items-center justify-between mb-8 h-14 bg-base-100/50 backdrop-blur-md rounded-full border border-base-content/5 px-6"
        >
          <div className="flex gap-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => _fileInputRef.current?.click()}
            >
              <ImageIcon size={18} weight="bold" />
            </button>
            <input
              type="file"
              ref={_fileInputRef}
              onChange={_handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-[10px] tracking-[0.2em] uppercase font-bold text-base-content/60 hover:text-base-content"
              title="Keep in your private drawer"
            >
              <TrayIcon size={18} weight="bold" />
              <span className="hidden md:inline">Keep</span>
            </button>

            <div className="w-px h-4 bg-base-content/10 mx-2" />

            <button
              type="button"
              className="btn btn-primary btn-sm rounded-full px-6"
            >
              <LockIcon size={14} weight="fill" className="mr-1" />
              Seal
            </button>
          </div>
        </div>
        <ComposeCanvas ref={canvasRef} />
      </div>
    </section>
  );
}
