import { DotIcon } from "@phosphor-icons/react"
import "@fontsource/knewave"

export default function Logo() {

  return (
    <div className="flex items-baseline leading-none align-baseline">
      <span className="text-2xl font-light font-logo text-accent">&nbsp;Pi</span>
      <DotIcon weight="fill" size={12} className="text-accent translate-y-px" />
      <span className="text-2xl font-light font-logo text-accent ml-0.5">Ku</span>
      <DotIcon weight="fill" size={12} className="text-accent translate-y-px" />
    </div>
  );
}
