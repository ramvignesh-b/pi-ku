import {
  ArrowBendDownLeftIcon,
  ArrowBendDownRightIcon,
} from "@phosphor-icons/react";
import { ReactLenis } from "lenis/react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import Logo from "../components/Logo.tsx";

import "@fontsource/kavivanar/index.css";
import "@fontsource/space-mono/index.css";
import "@fontsource/redacted-script/index.css";
import "@fontsource/architects-daughter/index.css";

export default function App() {
  const hSectionContainerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: hSectionContainerRef,
  });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <div className={"flex flex-col"}>
        <section className="flex w-screen h-screen items-center text-5xl"></section>

        <section ref={hSectionContainerRef} className="relative h-[400dvh]">
          <div className="sticky top-0 flex h-screen w-screen items-center overflow-x-hidden">
            <motion.div
              style={{
                x: useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]),
              }}
              className="flex w-[400vw] items-center justify-center"
            >
              <StorySection />

              <div className="flex h-screen w-screen items-center justify-center bg-neutral-700 text-6xl">
                <ForWhoSection />
              </div>

              <div className="flex h-screen w-screen items-center justify-center bg-neutral-600 text-6xl">
                {/*  zero knowledge  */}
              </div>

              <div className="flex h-screen w-screen items-center justify-center bg-neutral-500 text-6xl">
                {/*  OSS - code source, contributions, attribution  */}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="flex h-screen items-center justify-center bg-neutral-900 text-5xl">
          {/*    Start Writing */}
        </section>
      </div>
    </ReactLenis>
  );
}

function StorySection() {
  return (
    <div className="flex flex-col min-h-dvh w-screen items-center md:py-18 overscroll-contain">
      <h1
        className={
          "relative tracking-tighter text-5xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif"
        }
      >
        The Story
      </h1>
      <div className="flex flex-col items-center shrink-0">
        <div className="translate-x-2">
          <Logo />
        </div>
        <div className="flex ml-10 font-tamil text-2xl md:text-3xl group">
          <div className={"flex flex-col flex-wrap"}>
            பின்
            <span
              className={
                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 text-xxs tracking-widester uppercase text-neutral-content/90 mt-2"
              }
            >
              after
            </span>
          </div>
          <ArrowBendDownLeftIcon className={"text-primary"} />
          <ArrowBendDownRightIcon className="ml-8 text-primary" />
          <div className={"flex flex-col flex-wrap group"}>
            குறிப்பு
            <span
              className={
                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 text-xxs tracking-widest uppercase text-neutral-content/90 mt-2"
              }
            >
              note. remark.
            </span>
          </div>
        </div>
        {/* Dict Card */}
        <div className="hover-3d -my-8 md:m-4 scale-75 md:scale-100 md:my-12 cursor-pointer">
          <div className="card w-96 bg-base-200 bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[1.95em_1.95em]">
            <div className="card-body">
              <div className="mb-3 flex justify-between">
                <div className="text-lg">pin·ku·rip·pu</div>
              </div>
              <div className="mb-4 text-lg opacity-40">
                /noun/ <span className={"tracking-widest text-sm"}>tamil</span>
              </div>

              <ol className="flex flex-col gap-4 list-decimal list-inside p-0 m-0">
                <li>
                  postscript; a note written after the letter is signed.
                  <br />
                  <blockquote className="text-primary/50 italic mt-2 ml-2 border-l-primary/20 leading-none border-l">
                    "the most honest thing was always in the{" "}
                    <span className="font-tamil">பி. கு.</span>"
                  </blockquote>
                </li>
                <li>the thing you almost didn't say.</li>
              </ol>
            </div>
          </div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div
          className={
            "max-w-200 md:text-xl p-6 flex flex-col gap-4 md:gap-8 text-base-content/70 leading-relaxed"
          }
        >
          <p className={"hidden md:inline"}>
            <span className={"text-accent font-serif italic"}>pi. ku.</span> is
            an abbreviated transliteration of the Tamil word for{" "}
            <span className={"group italic text-primary font-serif inline"}>
              P
              <span className={"text-neutral hidden group-hover:inline"}>
                ost
              </span>
              . S
              <span className={"text-neutral hidden group-hover:inline"}>
                cript
              </span>
              .
            </span>{" "}
            — the thing you add after you've already signed your name, what you
            write when you thought you were finished, but weren't.
          </p>
          <p>
            <span className={"font-medium text-primary"}>
              Most of what we actually mean to say never gets said.
            </span>
            <br />
            It sits in drafts , in half-written notes, in the pause before we
            change the subject. <br />
            Those words{" "}
            <span
              className={"blur-sm hover:blur-none transition-all duration-500"}
            >
              don't just disappear. They
            </span>{" "}
            stay <span className={"text-primary font-hand"}>unsaid</span> — a
            quiet weight difficult to bear.
          </p>
          <p className={"italic text-primary"}>And that's okay...</p>
          <p>
            <span className={"text-accent font-serif italic"}>pi. ku.</span>{" "}
            <span className={"text-primary"}>
              was built for putting that weight down.
            </span>
            <br />A space for the letters you meant to send, the afterthoughts
            that deserved more than silence.
          </p>
        </div>
      </div>
    </div>
  );
}

function ForWhoSection() {
  return (
    <div className="flex flex-col h-screen w-screen items-center py-18">
      <h1
        className={
          "relative tracking-tighter text-6xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif"
        }
      >
        For Who
      </h1>
      <div className="flex flex-col items-center shrink-0">
        <div
          className={
            "max-w-200 text-xl p-6 flex flex-col gap-8 text-base-content/70 leading-relaxed"
          }
        >
          <p></p>
        </div>
      </div>
    </div>
  );
}
