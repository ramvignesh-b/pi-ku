import { useEffect, useState } from "react";

interface DateDisplayProps {
  date?: Date;
  className?: string;
}

export default function DateDisplay({
  date = new Date(),
  className = "",
}: DateDisplayProps) {
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return (
    <div className={`text-right flex flex-col gap-2 min-w-35 ${className}`}>
      <span className="text-xxs uppercase tracking-widester text-accent font-bold">
        Date
      </span>
      <span className="text-sm font-serif text-secondary-content italic whitespace-nowrap">
        {formattedDate} <br />
        <span className="text-secondary-content/50 font-sans not-italic">
          {hours}:{minutes}:{seconds}
        </span>
      </span>
    </div>
  );
}
