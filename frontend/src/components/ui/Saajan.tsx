import { useEffect, useState } from "react";
import sf_mini from "../../assets/sf_mini.png";

interface SaajanProps {
  message: string;
  position?: "top" | "left" | "right" | "bottom";
}

export default function Saajan({ message, position = "right" }: SaajanProps) {
  const [animate, setAnimate] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] =
    useState<string>("tooltip-right");
  const [alignment, setAlignment] = useState<string>("justify-start");

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => {
      setAnimate(false);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    setTooltipPosition(`tooltip-${position}`);
    if (position === "top") {
      setAlignment("justify-center");
    }
    if (position === "right") {
      setAlignment("justify-start");
    }
    if (position === "left") {
      setAlignment("justify-end");
    }
  }, [position]);

  return (
    <div className={`relative w-full flex ${alignment}`}>
      <div
        className={`tooltip tooltip-open ${tooltipPosition} before:border before:border-dashed before:border-primary/40 before:max-w-xs before:whitespace-pre-line italic before:text-left`}
        data-tip={message}
      >
        <img
          src={sf_mini}
          alt="saajan"
          className={`sepia-20 w-30 -mb-6 ${animate ? "animate-[pulse_.5s_ease_2]" : ""}`}
        />
      </div>
    </div>
  );
}
