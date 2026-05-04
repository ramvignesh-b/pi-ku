import {
  ArrowArcLeftIcon,
  ArrowBendDownLeftIcon,
  ArrowBendDownRightIcon,
  ArrowRightIcon,
  CaretUpIcon,
  FlowerTulipIcon,
  GhostIcon,
  InfoIcon,
  LockLaminatedIcon,
  LockOpenIcon,
  PasswordIcon,
  PersonArmsSpreadIcon,
  PersonIcon,
  ScrollIcon,
  SmileyIcon,
  SparkleIcon,
  VaultIcon,
} from "@phosphor-icons/react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import stamp from "../assets/envelope/stamp.png";
import Logo from "../components/Logo.tsx";
import { Modal } from "../components/ui/Modal";

import "@fontsource/kavivanar/index.css";
import "@fontsource/space-mono/index.css";
import "@fontsource/redacted-script/index.css";
import "@fontsource/architects-daughter/index.css";
import { useNavigate } from "react-router-dom";

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  return (
    <section ref={ref} className="relative h-[200dvh]">
      <div className="sticky top-0 flex h-screen w-screen items-center overflow-x-hidden">
        <motion.div style={{ x }} className="flex w-[200vw]">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <div className="flex flex-col">
        <StorySection />

        <HorizontalScroll>
          <ForWhoSection />
          <ArchetypesSection />
        </HorizontalScroll>

        <PrivacySection />

        <HorizontalScroll>
          <SpecsSection />
          <OSSSection />
        </HorizontalScroll>

        <AttributionSection />
      </div>
    </ReactLenis>
  );
}

function PrivacySection() {
  return (
    <div className="flex flex-col min-h-dvh w-screen justify-center items-center py-18">
      <h1
        className={
          "relative tracking-tighter text-5xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif flex"
        }
      >
        The &nbsp; Promise
        <span className="absolute -translate-y-6 md:-translate-y-12 font-display italic text-4xl md:text-6xl text-success translate-x-6 md:translate-x-12 -rotate-6">
          privacy
        </span>
        <CaretUpIcon
          className="absolute translate-y-6 md:translate-y-12 translate-x-20 md:translate-x-36 text-neutral -rotate-6"
          weight="bold"
        />
      </h1>
      <div className="flex flex-col items-center shrink-0 gap-8 max-w-11/12 w-200">
        <p className="text-xxs md:text-sm tracking-widester text-neutral-content/80 font-semibold uppercase mt-6">
          <span className="text-accent">Your letters.</span>{" "}
          <span className="text-error">Nobody else's.</span>
        </p>
        <p className="text-sm md:text-lg">
          When you write something here, it gets encrypted in your browser
          before anything leaves your device. What reaches the server isn't your
          letter. It's something unreadable &mdash; and the server has no way to
          change that, because the key never left you.
        </p>
        <figure className="diff aspect-3/4 touch-pan-y select-none">
          <div className="diff-item-1 z-1" role="img">
            <div className="bg-primary text-primary-content grid place-content-center text-sm md:gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-6xl uppercase font-bold tracking-widest mt-2 md:mt-8">
                  you see
                </h1>
                <PasswordIcon
                  className="text-neutral mx-auto -mb-3"
                  size={32}
                />
                <h2 className="text-xs md:text-sm tracking-widester text-center uppercase opacity-50">
                  Your Password
                </h2>
                <p className="text-center md:text-2xl font-bold font-mono">
                  <br />
                  B@z1ng4A
                </p>
              </div>
              <div className="divider divider-neutral opacity-50 w-1/2 mx-auto">
                <LockOpenIcon size={48} />
              </div>
              <div className="flex flex-col items-center md:gap-2">
                <ScrollIcon
                  className="text-neutral mx-auto md:-mb-3"
                  size={32}
                />
                <h2 className="text-xs md:text-sm tracking-widester text-center uppercase opacity-50">
                  Your Letter
                </h2>
                <div className="p-6 bg-paper w-82 md:w-150 h-200 flex flex-col gap-4 text-xs md:text-lg overflow-hidden max-h-68 md:max-h-full">
                  <p className="wrap-anywhere">Hello friend,</p>
                  <p>I've never told this to anyone...</p>
                  <p className="font-redact">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
                    semper, justo eget vehicula vestibulum, enim enim suscipit
                    lectus, et sagittis nibh risus vel metus. Quisque eu ornare
                    ante, et gravida mauris. Vivamus massa justo, sagittis non
                    viverra sed, sodales non nisi. Nunc semper, massa a aliquet
                    dictum, enim nisi malesuada orci, et elementum lectus turpis
                    et velit. Nam vel felis vitae tortor dignissim malesuada.
                    Nam suscipit, justo eu elementum pulvinar, magna sem tempor
                    ex, vitae iaculis tellus odio non nisl. Duis dolor orci,
                    viverra ut finibus sed, aliquet vitae tortor. Proin sodales
                    ipsum ac ipsum hendrerit tempus. Nunc nec nibh nibh. Aenean
                    consequat auctor posuere. Integer sed magna volutpat,
                    efficitur nisl ut, dignissim neque. Vestibulum convallis nec
                    dui a euismod. Duis dignissim magna in mattis pulvinar. Sed
                    blandit nibh quis arcu ornare, sit amet fermentum nisi
                    rhoncus.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="diff-item-2" role="img">
            <div className="bg-neutral-content bg-[url('https://www.transparenttextures.com/patterns/random-grey-variations.png')] text-primary-content grid place-content-center text-sm md:gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-6xl uppercase font-bold text-right tracking-widest mt-2 md:mt-8">
                  server see
                </h1>
                <PasswordIcon
                  className="text-neutral mx-auto -mb-3"
                  size={32}
                />
                <h2 className="text-xs md:text-sm tracking-widester text-center uppercase opacity-50">
                  Your Password
                </h2>
                <p className="text-center md:text-2xl font-bold font-mono max-w-150 break-all">
                  9e54d05f88bdd67a675b03bf1cd0a1647e2109b5aa18185ff6a9ba4c6959a19d
                </p>
              </div>
              <div className="divider divider-neutral opacity-50 w-1/2 mx-auto">
                <LockLaminatedIcon size={48} />
              </div>
              <div className="flex flex-col items-center md:gap-2">
                <ScrollIcon
                  className="text-neutral mx-auto md:-mb-3"
                  size={32}
                />
                <h2 className="text-xs md:text-sm tracking-widester text-center uppercase opacity-50">
                  Your Letter
                </h2>
                <div className="p-6 bg-paper w-82 md:w-150 h-200 text-xxs md:text-sm font-mono md:leading-loose overflow-hidden max-h-68 md:max-h-full">
                  <p className="break-all">
                    SZ0Mq9M9sCZsdDB8HGjk7JfWG56Kaot8Lgma74MCusDUYibUGoR7VviWgvc341pvFV9/IAyot9KtlDvwIX1ZmUw9Oh340JMaajRQ7iNgVjHgAwmJAr2cLbReNqlF6xzaf3mIYkiK9BXNQekk2h/9XufklsqoIXpaK1re7xWQ8mdddzy6z4EQFVH/Ev3np5ERW/ss7Z1kqYWUnANK7olWNL/7GgZmhU+L29rgbR52kcH9fng7gnEI3KEuISYExYCg81G1VaJYspkW3A4qwcet+jXdgmbKvkux5qNw6gyNi9d/YqKV7OUNrmoH190rHdJ5A7HOIv3/SvPhb3Zm4sNF5PcMxmhM0+T9m5PejV1GhV9bMBHbbgacay7hZJU3O0+q+7fBAE/+pqfvZdv78lLDFSdtHAXUpYOvHPrI5BNNwuS3T+FK1zjurLnUPThlOSYRICoZSUcxVswXz897PoRmFNNvbal0dpKUmCFrBwV5c/W3d1+iZor5msbm/JxpbNtys59e0StSTwHKsxvxm/rTuUAxWSOmzt13MDBxxd2zyVnX8rtQ7mEjMJ8IHHpvhKjONoa2S11VBJY68Ee1vNrw7htu+wajvmXhHAyfh1lYql8pu8VvPUG7leEQ9I0pMY35Y/C1cYCBLkDT5zf8NeZFtbp0BNgHd+QDVSFH+GSnvTskU2BCio3YE+zE6cDhvLUOMy3e5RAtPqsi5VzpEUcdCwph+Z+1pFlTxiEZ62i4wNpqw2lhS3b/E9ifJgnncSgRHLtfw/VxHZCRc4tBQ24xSZ507lSlQch+5lQeO7rx2htgd2D7aGNx/UN/xmeuEd4a28AxNOVS3uYh3wTDh8CSXyBRCRPxrANOV1ZBojdfK+v5fOJNPgDn3r5/pG80L3FTkecRB0zFuKNG8jIzi5ADx9k4SlhRNo17gPl2if8gRA6tzTae4kbzieG+woxhUWj/qvXg0MQmg59VTK2HHS34exdKDP9a561svlw+lJ2AtM1EL9srJk8i3kiyEPUeIlaLl3AfgbbSuC2RhlzFFAYuQ06rbsSvEoe4rrYeMXxL9jwVsXX0xrp8H25mOJu3ahn5pFYzADMSGf4L11H1vDArpefj/lW+8zcmogxxBktYYNF/qU4v+9367hp4MEn/84tQPpmb47TL+XpVnl9tQ3r9OfOaW3zX7NkWZbqoX7OgdgHOtTLP/euQujSs2MAzMO4BmbuCS7pR/GTZwDqF1sXiWAkunjo2qpKHieqlvSVmtwEhh6wsNwYTKEkddmTqvKSx0fHRvs3D9lMGJfg7wLSz/3Otx3G65tk9l/3B3r87qQTvbqXmcfnFdEIaR8mO/yMyCKnxtJkJb3lEzNUOrvnSxwL7Gyn54TLTWA==
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="diff-resizer"></div>
        </figure>
      </div>
    </div>
  );
}

function SpecsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="flex flex-col min-h-dvh w-screen justify-center items-center py-18">
      <h1 className="relative tracking-tighter text-5xl md:text-8xl text-neutral-content/80 font-extrabold italic font-display z-10">
        S'more Specs
      </h1>
      <div className="flex flex-col items-start shrink-0 gap-6 max-w-11/12 w-200 mt-4 md:mt-12">
        <h2 className="text-xl md:text-3xl text-center mx-auto">
          <Logo type={"inline"} /> uses{" "}
          <span className="text-accent font-mono">Zero Knowledge</span>{" "}
          <span className="group ul-wavy font-mono text-primary">
            E
            <span className="hidden group-hover:inline group-focus-within:inline">
              nd&nbsp;
            </span>
            2
            <span className="hidden group-hover:inline group-focus-within:inline">
              &nbsp;
            </span>
            E
            <span className="hidden group-hover:inline group-focus-within:inline">
              nd
            </span>
            <span className="hidden group-hover:inline group-focus-within:inline">
              &nbsp;<span>E</span>
              <span className="hidden group-hover:inline group-focus-within:inline">
                ncryption
              </span>
            </span>
          </span>{" "}
          with{" "}
          <span className="font-mono text-primary">Envelope Encryption</span>
        </h2>
        <p className="text-sm md:text-xl leading-relaxed">
          This means, both the encryption and decryption runs on your device, in
          your browser.
          <br />
          Every letter has a{" "}
          <span className="font-mono text-primary">unique key</span> which is
          derived from your original password.
          <br />
          Both the letter and the key are encrypted securely and sent to the
          server.
          <br />
          Now, the server holds{" "}
          <span className="text-primary font-bold">the envelope</span>,{" "}
          <span className="text-primary font-bold">the seal</span> and{" "}
          <span className="text-primary font-bold">another locked box</span>{" "}
          with a key inside that unseals your letter. But you,{" "}
          <span className="italic text-primary">only you</span>, hold the only
          thing that opens the box &mdash;{" "}
          <span className="font-mono text-accent">your password</span>.
        </p>
        <p className="text-sm md:text-xl text-right w-full flex items-center justify-end gap-4 leading-relaxed">
          Nothing on the server is readable without your actual password.
          <br />
          Even if someone were to breach in, all they'd find is encrypted noise.
          <VaultIcon size={48} weight="duotone" />
        </p>

        <button
          type={"button"}
          className="btn btn-outline border-base-300 w-full justify-between font-medium opacity-80"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="text-sm md:text-lg font-mono ul-wavy font-bold">
            Nerd Stuff
          </span>
          <ArrowRightIcon size={20} />
        </button>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="w-full bg-paper rounded-md p-6">
            <img src="/screenshots/e2e.svg" alt="pi ku e2e diagram" />
          </div>
        </Modal>

        <p className="text-sm md:text-lg">
          This level of privacy comes with a catch.{" "}
          <span className="text-error font-bold">No password reset.</span>
        </p>
        <p className="text-sm md:text-lg alert alert-warning font-semibold">
          <InfoIcon weight="duotone" /> Your original password is never stored
          on the server. Which means if it's lost, the letters stay sealed
          forever.
        </p>
      </div>
    </section>
  );
}

function OSSSection() {
  return (
    <section className="flex flex-col h-screen w-screen items-center justify-center py-18 gap-4">
      <h1
        className={
          "relative tracking-tighter text-4xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif text-center"
        }
      >
        <span className="hidden absolute -translate-y-24 translate-x-45 font-display text-3xl md:text-6xl opacity-70 rotate-8">
          only for
          <br />
          <span className="text-primary">your letters</span> <SmileyIcon />
          <ArrowArcLeftIcon className="inline rotate-45 -translate-y-8" />
        </span>
        <Logo type={"inline"} /> is{" "}
        <span className="line-through decoration-6 decoration-error">
          &nbsp;private
        </span>{" "}
        <span className="text-success">open source !</span>
      </h1>
      <div className="flex flex-col items-center shrink-0 max-w-11/12 w-200 gap-4 p-4 md:p-6">
        <p className="text-sm md:text-xl">
          <Logo type={"mono"} /> is fully open source. Every claim about privacy
          and encryption is publicly available in the code so you don't have to
          take anyone's word for it.
        </p>
        <p className="text-sm md:text-lg">
          You can also{" "}
          <span className="uppercase font-bold text-primary">Self-host</span>{" "}
          <Logo type={"inline"} /> in just 4 steps.
        </p>
        <div className="mockup-code w-full text-xs">
          <pre data-prefix="$">
            <code>git clone https://git.ramvignesh.dev/me/pi-ku.git</code>
          </pre>
          <pre data-prefix="$">
            <code>cd pi-ku</code>
          </pre>
          <pre data-prefix="$">
            <code>./scripts/setup.sh</code>
          </pre>
          <pre data-prefix="$">
            <code>./scripts/start.sh</code>
          </pre>
        </div>

        <div className="flex flex-wrap gap-4 w-full items-center justify-center">
          <a
            href="https://git.ramvignesh.dev/me/pi-ku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            View on GitHub
          </a>
          <p className="text-xs md:text-base opacity-70">
            Found something to report or request?{" "}
            <a
              href="https://git.ramvignesh.dev/me/pi-ku/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Please say so.
            </a>
          </p>
        </div>

        <div className="divider opacity-30 my-0"></div>

        <p className="text-xxs md:text-sm tracking-widester font-semibold uppercase text-accent">
          Built on the shoulders of open source.
        </p>

        <p className="text-sm md:text-lg">
          <Logo type={"mono"} /> wouldn't exist without the work of people who
          chose to build in the open.
        </p>

        <p className="text-sm md:text-lg">
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web Crypto API
          </a>{" "}
          &mdash; the backbone of everything promised. Browser-native
          cryptography that runs entirely on your device. Without it, none of
          the privacy here would be possible &mdash; or credible.
        </p>

        <p className="text-sm md:text-lg">
          <a
            href="https://daisyui.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            DaisyUI
          </a>{" "}
          ·{" "}
          <a
            href="http://fabricjs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fabric.js
          </a>{" "}
          ·{" "}
          <a
            href="https://phosphoricons.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Phosphor Icons
          </a>{" "}
          &mdash; the beautiful work by others that let me focus on the core
          experience.
        </p>

        <p className="text-sm md:text-lg mt-4">
          Open source is what made this possible. It felt right to give it back
          the same way.
        </p>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <div className="flex flex-col min-h-dvh w-screen justify-center items-center py-18">
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
          <div className={"flex flex-col flex-wrap ul-wavy"}>
            பின்
            <span
              className={
                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-xxs tracking-widester uppercase text-neutral-content/60 mt-2"
              }
            >
              after
            </span>
          </div>
          <ArrowBendDownLeftIcon className={"text-primary"} />
          <ArrowBendDownRightIcon className="ml-8 text-primary" />
          <div className={"flex flex-col flex-wrap group ul-wavy"}>
            குறிப்பு
            <span
              className={
                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-xxs tracking-[.2em] uppercase text-neutral-content/60 mt-2"
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
          <p className={""}>
            <Logo type={"inline"} /> is an abbreviated transliteration of the
            Tamil word for{" "}
            <span
              className={
                "group italic text-primary font-serif inline underline decoration-dotted underline-offset-2 decoration-primary/40"
              }
            >
              P
              <span
                className={
                  "text-neutral hidden group-hover:inline group-focus-within:inline "
                }
              >
                ost
              </span>
              . S
              <span
                className={
                  "text-neutral hidden group-hover:inline group-focus-within:inline"
                }
              >
                cript
              </span>
              .
            </span>{" "}
            &mdash; the thing you add after you've already signed your name,
            what you write when you thought you were finished, but weren't.
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
              className={
                "blur-sm hover:blur-none active:blur-none focus:blur-none focus:outline-none transition-all duration-500"
              }
            >
              don't just disappear. They
            </span>{" "}
            stay <span className={"text-primary font-hand"}>unsaid</span>{" "}
            &mdash; a quiet weight difficult to bear.
          </p>
          <p className={"italic text-primary"}>And that's okay...</p>
          <p>
            <Logo type={"inline"} />
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
    <div className="flex flex-col h-screen w-screen justify-center items-center py-18 bg-primary/80">
      <div className="max-w-4xl z-10">
        <h2 className="text-7xl md:text-9xl font-serif italic font-black tracking-tighter text-stone-900 leading-tightest mb-12">
          Who is <br /> this for?
        </h2>

        <div className="space-y-6 max-w-200 p-4 text-base-200 text-xl md:text-2xl leading-relaxed">
          <p>
            <Logo type={"mono"} /> wasn't built for one kind of person, but a
            particular kind of feeling &mdash;
            <span className="italic font-serif text-stone-900">
              {" "}
              the one that lingers very quietly
            </span>{" "}
            &mdash; fragile, yet never breaks.
          </p>

          <div className="pt-8 flex items-center gap-4">
            <span className="text-xs md:text-sm uppercase tracking-widest font-mono opacity-60">
              See if any of these feel too familiar to you
            </span>
            <div className="w-24 animate-pulse">
              <ArrowRightIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
    </div>
  );
}

function ArchetypesSection() {
  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center py-18 bg-primary/80">
      <h1
        className={
          "relative tracking-tighter text-5xl md:text-8xl text-base-300/80 font-extrabold italic font-serif"
        }
      >
        The Archetypes
      </h1>
      <div className="flex flex-col items-center shrink-0 w-200 max-w-11/12 gap-2 md:gap-8 my-4">
        <div className="relative w-full">
          <details
            className="collapse shadow-xs glass opacity-75 open:opacity-100 text-base-300 peer"
            name="my-accordion-det-1"
            open
          >
            <summary className="collapse-title md:text-xl leading-tight font-hand flex items-center gap-4">
              <GhostIcon weight="duotone" className="text-accent" size={32} />{" "}
              To someone you can't reach anymore.
            </summary>
            <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
              <p>
                A person who left. A relationship that ended without a real
                ending. Someone who's still in your life but will never know
                what you felt. Some conversations just close before they're
                finished.
                <br />
              </p>
              <p className="font-serif font-medium opacity-70">
                Write the letter anyway. Keep it close.
              </p>
            </div>
          </details>
          <span className="absolute md:-right-8 md:-top-10 -top-4 -right-2 md:text-8xl text-6xl font-bold font-mono opacity-20 peer-open:opacity-60 pointer-events-none z-10 transition-all duration-500 rotate">
            01
          </span>
        </div>

        <div className="relative w-full">
          <details
            className="collapse shadow-xs glass opacity-75 open:opacity-100 text-base-300 peer"
            name="my-accordion-det-1"
          >
            <summary className="collapse-title text-lg md:text-xl leading-tight font-hand flex items-center gap-4">
              <FlowerTulipIcon
                weight="duotone"
                className="text-accent"
                size={32}
              />{" "}
              To someone who's still here.
            </summary>
            <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
              <p>
                Not every letter is about distance. Sometimes you just need to
                say something properly &mdash; without a text thread, without
                the noise of a conversation already in motion. A letter slows it
                down.
              </p>
              <p className="font-serif font-medium opacity-70">
                Give people their due flowers while they can still smell them.
              </p>
            </div>
          </details>
          <span className="absolute md:-right-8 md:-top-10 -top-4 -right-2 md:text-8xl text-6xl font-bold font-mono opacity-20 peer-open:opacity-60 pointer-events-none z-10 transition-all duration-500">
            02
          </span>
        </div>
        <div className="relative w-full group">
          <details
            className="collapse shadow-xs glass opacity-75 open:opacity-100 text-base-300 peer"
            name="my-accordion-det-1"
          >
            <summary className="collapse-title text-lg md:text-xl leading-tight font-hand flex items-baseline gap-4">
              <div className="flex items-center">
                <PersonIcon
                  weight="duotone"
                  className="text-accent"
                  size={14}
                />{" "}
                <PersonArmsSpreadIcon
                  weight="duotone"
                  className="text-accent"
                  size={24}
                />
              </div>
              To yourself, further along.
            </summary>
            <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
              <p>
                Not a journal. Not a note-to-self. A proper letter &mdash; to
                whoever you'll be in a year, or five, or ten.
                <br />
                Ask yourself of the healed wounds, forgotten fears, or the
                things you finally learned to live with.
              </p>
              <p className="font-serif font-medium opacity-70">
                Set a date and let a letter surprise you when you've long
                forgotten writing it.
              </p>
            </div>
          </details>
          <span className="absolute md:-right-8 md:-top-10 -top-4 -right-2 md:text-8xl text-6xl font-bold font-mono opacity-20 peer-open:opacity-60 pointer-events-none z-10 transition-all duration-500">
            03
          </span>
        </div>
        <div className="relative w-full">
          <details
            className="collapse shadow-xs glass opacity-75 open:opacity-100 text-base-300 peer"
            name="my-accordion-det-1"
          >
            <summary className="collapse-title text-lg md:text-xl leading-tight font-hand flex items-center gap-4">
              <SparkleIcon weight="duotone" className="text-accent" size={32} />{" "}
              For liberation.
            </summary>
            <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
              <p>
                Some unsaid words just need to leave your headspace. There's no
                recipient, no subject line, no send button. Just the act of
                putting it somewhere outside of yourself. <br />
                That's sometimes enough.
              </p>
              <p className="font-serif font-medium opacity-70">
                Say it once. All of it. Then let it fade.
              </p>
            </div>
          </details>
          <span className="absolute md:-right-8 md:-top-10 -top-4 -right-2 md:text-8xl text-6xl font-bold font-mono opacity-20 peer-open:opacity-60 pointer-events-none z-10 transition-all duration-500">
            04
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 group mt-12">
          <img
            src={stamp}
            alt="stamp"
            className="rotate-6 group-hover:rotate-0 group-focus-within:rotate-0 transition-all duration-1000"
          />
          <p className="md:text-xl mt-4">
            If any of these felt familiar,
            <br />
            no matter how little,
            <br />
            this is for you.
          </p>
        </div>
      </div>
    </div>
  );
}

function AttributionSection() {
  const [hover, setHover] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-screen items-center py-18">
      {/* Saajan hover image */}
      <AnimatePresence>
        {hover.visible && (
          <motion.img
            src="/saajan.png"
            alt="Saajan Fernandes from The Lunchbox, cutout"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed z-50 w-56 md:w-72 rounded-lg shadow-warm object-cover"
            style={{
              left: hover.x + 16,
              top: hover.y - 32,
            }}
          />
        )}
      </AnimatePresence>

      <h1
        className={
          "relative tracking-tighter text-5xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif"
        }
      >
        Honest Speak
      </h1>
      <div className="flex flex-col items-center shrink-0">
        <div
          className={
            "max-w-200 m-2 md:m-8 text-sm md:text-lg px-4 md:px-8 py-6 md:py-12 flex flex-col gap-4 md:gap-8 text-base-100 leading-relaxed bg-paper font-mono tracking-tight"
          }
        >
          Hi.
          <p>Thank you so much for making it this far. Really.</p>
          <p>
            <Logo type={"inline"} /> took a while to exist.
            <br />
            This started as a{" "}
            <a
              href="https://cs50.harvard.edu/web/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CS50W
            </a>{" "}
            capstone, one I kept postponing until I ran out of reasons not to.
            When I eventually sat down to build, I knew it had to be more than a
            deadline; it had to be something that outlasted the grade. I wanted
            to create a space for the feelings we usually keep to ourselves and
            every hour spent on it was worth it. I've shared the edges of{" "}
            <Logo type={"inline"} /> here, but the heart of it is best found by
            exploring it yourself.
          </p>
          <p>
            I kept coming back to{" "}
            <span
              role="tooltip"
              className="cursor-default ul-wavy text-accent"
              onMouseEnter={(e) =>
                setHover({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              onMouseMove={(e) =>
                setHover((h) => ({
                  ...h,
                  x: e.clientX,
                  y: e.clientY,
                }))
              }
              onMouseLeave={() => setHover((h) => ({ ...h, visible: false }))}
            >
              Saajan
            </span>{" "}
            from{" "}
            <a
              href="https://www.imdb.com/title/tt2350496/"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Lunchbox
            </a>{" "}
            &mdash;{" "}
            <span className="italic">
              one of the most subtle yet brilliant portrayals by Irrfan Khan
            </span>{" "}
            &mdash; the quiet emotional weight he carries throughout the film,
            going through the motions of a lonely life, until those letters
            arrive and something inside him finally loosens. Of course, the
            ending felt like a deep sigh of "it is what it is". But something
            about the act of writing and letting the unsaid out eased it, even
            briefly. I think about that a lot.
          </p>
          <p>
            There's a lot that goes{" "}
            <span className={"text-primary font-hand text-lg md:text-xl"}>
              unsaid
            </span>{" "}
            now. Not that people feel less or for the lack of time, but because
            the ways we reach each other have quietly changed. We're always
            reachable <span className="italic">digitally,</span> yet somehow the
            things that matter most end up staying inside.
            <br />
            Maybe writing will help with that. Maybe something about putting
            words somewhere deliberate makes them feel less like something
            you're carrying.
          </p>
          <p>Or maybe it won't, but it's worth a try.</p>
          <p>
            <Logo type={"inline"} /> is for that try. I hope it helps.
          </p>
          <p
            className={
              "text-right font-hand text-base-content text-lg md:text-xl"
            }
          >
            &mdash; Ram
          </p>
        </div>
        <blockquote className="text-primary/50 italic mt-8 md:mt-12 mx-auto border-l-primary/20 leading-relaxed border-l pl-4 max-w-11/12 text-lg">
          "I think we forget things if there is nobody to tell them."
          <span className="block mt-2 text-sm not-italic text-base-content/30 w-full text-right">
            ~ Saajan Fernandes, <span className="italic">The Lunchbox</span>
          </span>
        </blockquote>
      </div>
      <div className="mt-40 mb-44 w-full justify-center flex">
        <button
          type={"button"}
          onClick={() => navigate("/onboard")}
          className="btn btn-primary btn-wide rounded-full px-14 font-mono"
        >
          Begin
        </button>
      </div>
    </div>
  );
}
