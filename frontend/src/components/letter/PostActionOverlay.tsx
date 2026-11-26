import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export function PostActionOverlay() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-1000 flex flex-col items-center justify-center bg-base-100"
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <h1
        ref={title}
        tabIndex={-1}
        className="text-6xl lg:text-9xl italic font-extralight outline-none motion-safe:animate-[pulse_3s_ease-in-out_3]"
      >
        It is done
      </h1>
      <div className="text-xl lg:text-4xl text-center font-extralight text-base-content font-display mt-8 tracking-wide">
        <p className="w-full">
          May your <span className="italic text-primary">soul</span> find
          solace,
          <br /> just like your{" "}
          <span className="text-accent italic">unsaid</span> &nbsp; words did.
        </p>
        <div className="divider mx-auto w-24 text-center"></div>
        <button
          type="button"
          className="btn btn-ghost text-sm text-neutral-content/60 font-sans"
          onClick={() => navigate(ROUTES.ESCRITOIRE)}
        >
          Turn the page
        </button>
      </div>
    </motion.div>
  );
}
