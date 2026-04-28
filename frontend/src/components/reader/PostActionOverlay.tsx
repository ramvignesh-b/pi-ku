import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";

interface PostActionOverlayProps {
  revealState: "SEALED" | "REVEALED" | "BURNING" | "BURNED";
}

export function PostActionOverlay({ revealState }: PostActionOverlayProps) {
  const navigate = useNavigate();
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-base-100 ${revealState === "BURNED" ? "opacity-100" : "opacity-0"} transition-all delay-1000 duration-1000`}
    >
      <h1
        className={`text-6xl ${revealState === "BURNED" ? "opacity-100" : "opacity-0"} lg:text-9xl italic font-extralight text-base-content animate-[pulse_3s_ease-in-out_3]`}
      >
        It is done
      </h1>
      <div
        className={`text-xl ${revealState === "BURNED" ? "opacity-100" : "opacity-0"} lg:text-4xl text-center font-extralight text-base-content font-display mt-8 delay-3000 transition-all duration-2000 tracking-wide`}
      >
        <p className="w-full">
          May your <span className="italic text-primary">soul</span> find
          solace,
          <br />
          just like your <span className="text-accent italic">unsaid</span>{" "}
          words did.
        </p>
        <div className="divider mx-auto w-24 text-center"></div>
        <button
          type="button"
          className="btn btn-ghost text-sm text-neutral-content/60 font-sans"
          onClick={() => navigate(ROUTES.DRAWER)}
        >
          Turn the page
        </button>
      </div>
    </div>
  );
}
