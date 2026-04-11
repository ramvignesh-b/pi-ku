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

  return (
    <div
      className={`text-right flex flex-col gap-2 min-w-[140px] ${className}`}
    >
      <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold">
        Date
      </span>
      <span className="text-sm font-serif text-secondary-content italic whitespace-nowrap">
        {formattedDate}
      </span>
    </div>
  );
}
