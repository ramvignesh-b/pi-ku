import { useState } from "react";

export interface EnvelopeRevealProps {
  recipient?: string;
  date?: string;
  onRevealComplete: () => void;
}

export function EnvelopeReveal({
  recipient,
  date,
  onRevealComplete,
}: EnvelopeRevealProps) {
  const [revealLetter, setRevealLetter] = useState(false);

  const handleClick = () => {
    setRevealLetter(true);
    setTimeout(() => {
      onRevealComplete();
    }, 1000);
  };

  return (
    <div className="max-w-4xl m-8 mx-auto space-y-8 h-screen w-screen flex items-center justify-center">
      <div className="flex items-center justify-center transition-all duration-1000">
        <div
          id="env-top"
          className="z-4 transition-transform duration-2000 absolute peer h-40 w-54 -mt-30 bg-base-200 mask mask-triangle-2 scale-x-234 has-checked:scale-y-[-1] has-checked:-translate-y-full has-checked:z-1 has-checked:duration-1000"
        >
          <input
            type="checkbox"
            className=" transition-all checkbox duration-1000 absolute h-full w-full bg-transparent z-100 text-transparent"
          />
        </div>
        <div
          id="letter"
          className={`max-w-4xl m-8 mx-auto space-y-8 transition-all peer-has-checked:duration-2000 duration-500 h-65 w-105 bg-paper peer-has-checked:mb-24 hover:mb-54 cursor-pointer ${revealLetter ? "w-screen h-screen z-101" : "peer-has-checked:z-1"}`}
          onClick={handleClick}
        ></div>

        <div
          id="env-right"
          className="absolute h-70 w-105 bg-base-300 mask mask-triangle-3 -mr-48 z-3"
        ></div>
        <div
          id="env-left"
          className="absolute h-70 w-105 bg-base-300 mask mask-triangle-4 -ml-48 z-3"
        ></div>
        <div
          id="env-bottom"
          className="absolute h-70 w-45 bg-base-200 mask mask-triangle-2 scale-y-[-1] -mb-31 scale-x-240 z-3"
        ></div>
      </div>
    </div>
  );
}
