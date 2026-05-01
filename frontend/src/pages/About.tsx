import "@fontsource/kavivanar/index.css";
import "@fontsource/space-mono/index.css";
import "@fontsource/redacted-script/index.css";
import "@fontsource/architects-daughter/index.css";

import {
  ArrowBendDownLeftIcon,
  ArrowBendDownRightIcon,
  FlowerLotusIcon,
} from "@phosphor-icons/react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Logo from "../components/Logo.tsx";

export default function About() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 30,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <section className="w-screen min-h-[400vh] bg-paper/20 relative flex p-16">
      <div className="fixed w-screen h-full inset-0 z-0 bg-radial from-accent to-transparent mix-blend-multiply opacity-70" />
      <motion.div
        className={"fixed gap-4 top-0 flex"}
        style={{
          x: useTransform(smoothProgress, [0, 1], [0, -1000]),
          scale: useTransform(
            smoothProgress,
            [0.05, 0.2, 0.8, 1],
            [0.5, 1, 1, 0.5],
          ),
          y: useTransform(
            smoothProgress,
            [0.05, 0.1, 0.8, 1],
            [400, 200, 200, -300],
          ),
        }}
      >
        <div className={"max-w-screen max-h-screen p-16"}>
          <div className="flex flex-col w-full items-start">
            <div className={"translate-x-24"}>
              <Logo />
            </div>
            <div className={"text-3xl font-tamil flex"}>
              <span className={"ml-6"}>பின்</span>
              <ArrowBendDownLeftIcon size={32} />
              <ArrowBendDownRightIcon size={32} className={"ml-8"} />
              <span>குறிப்பு</span>
            </div>
          </div>
          <div className="hover-3d my-12 mx-2 cursor-pointer">
            <div className="card w-96 bg-base-200 text-white bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[4.95em_4.95em]">
              <div className="card-body">
                <div className="flex justify-between mb-3">
                  <div className="font-bold">pin·ku·rip·pu</div>
                  <div className="text-5xl opacity-10">
                    <FlowerLotusIcon />
                  </div>
                </div>
                <div className="text-lg mb-4 opacity-40">/noun/</div>
                <div className="flex justify-between">
                  <ul className={"list gap-4"}>
                    <ol className={"list-item"}>
                      postscript; a note written after the letter is signed.
                      <br />
                      <blockquote className={"text-primary italic"}>
                        "the most honest thing was always in the{" "}
                        <span className={"font-tamil"}>பி. கு.</span>"
                      </blockquote>
                    </ol>
                    <ol>the thing you almost didn't say.</ol>
                  </ul>
                </div>
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
        </div>
        <div className={"w-100 h-100 bg-green-500"}></div>
        <div className={"w-100 h-100 bg-green-500"}></div>
        <div className={"w-100 h-100 bg-green-500"}></div>
        <div className={"w-100 h-100 bg-green-500"}></div>
        <div className={"w-100 h-100 bg-green-500"}></div>
        <div className={"w-100 h-100 bg-green-500"}></div>
      </motion.div>
    </section>
  );
}
