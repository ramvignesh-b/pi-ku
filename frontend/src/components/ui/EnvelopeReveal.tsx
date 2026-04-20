import { WavesIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import stamp from "../../assets/envelope/stamp.png";
import waxSeal from "../../assets/envelope/waxSeal.png";

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
  const [isFlipped, setIsFlipped] = useState(false);

  const flapCheckbox = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setRevealLetter(true);
    setTimeout(() => {
      onRevealComplete();
    }, 2500);
  };

  return (
    <div className="h-screen mx-auto items-center flex justify-center">
      <div className="perspective-distant scale-80 duration-1000 transition-all animate-[pulse_2s_linear_1]">
        <div
          className={`relative h-70 w-105 transform-3d transition-transform duration-2000 ${isFlipped ? "rotate-y-180" : ""}`}
        >
          <div className=" flex backface-hidden rotate-y-180 justify-center transition-all duration-1000">
            <div
              id="env-top"
              className="z-4 delay-500 transition-all duration-2000 absolute peer h-40 w-54 mt-0 bg-base-200 mask mask-triangle-2 scale-x-234 has-checked:scale-y-[-1] has-checked:-translate-y-full has-checked:z-1 has-checked:duration-1000"
            >
              <input
                type="checkbox"
                className="transition checkbox absolute h-full w-full text-transparent bg-transparent z-100"
                ref={flapCheckbox}
              />
            </div>
            <img
              className={
                "translate-y-24 delay-2000 absolute z-6 peer-has-checked:opacity-0 peer-has-checked:delay-0 transition-opacity duration-1500 cursor-pointer"
              }
              src={waxSeal}
              alt="Seal"
              onClick={() => flapCheckbox.current?.click()}
            />
            <button
              id="letter"
              className={`absolute mx-auto transition-all peer-has-checked:delay-800 peer-has-checked:duration-1000 duration-1000 mt-2 h-63 w-105 bg-paper peer-has-checked:-mt-12 hover:-mt-24 cursor-pointer ${revealLetter ? "duration-1000 peer-has-checked:duration-2000 w-screen h-screen z-101 -translate-y-90" : "peer-has-checked:z-1"}`}
              onClick={handleClick}
            ></button>

            <div
              id="env-right"
              className="absolute h-70 w-105 bg-base-300 mask mask-triangle-3 -mr-48 z-3"
            ></div>
            <div
              id="env-left"
              className="absolute h-70 w-105 bg-base-300 mask mask-triangle-4 -ml-48 z-3"
            ></div>
            <button
              id="env-bottom"
              className="absolute h-70 w-45 bg-base-200 mask mask-triangle-2 scale-y-[-1] mt-15 scale-x-240 z-3"
              onClick={() => setIsFlipped((prev) => !prev)}
            ></button>
          </div>

          <div
            className="p-10 absolute inset-0 backface-hidden w-110 bg-base-200 z-99 rounded-md -translate-x-2"
            onClick={() => setIsFlipped((prev) => !prev)}
          >
            <span className={"text-neutral-content/60 font-xs font-display"}>
              to
            </span>
            <h1 className="text-3xl font-bold text-base-content">
              {recipient}
            </h1>
            <p className="text-base-content/60 font-display mt-8">{date}</p>
            <img
              src={stamp}
              alt={"stamp"}
              className={
                "z-0 rotate-6 opacity-80 text-accent absolute mt-0 mr-1 top-4 right-0"
              }
            />
            <WavesIcon
              className={"absolute mt-0 mr-12 top-18 right-8 text-primary"}
              size={50}
            />
            <WavesIcon
              className={"absolute mt-0 mr-4 top-18 right-8 text-primary"}
              size={50}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
