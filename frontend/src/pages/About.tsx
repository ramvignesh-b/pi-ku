import {
    ArrowArcLeftIcon,
    ArrowBendDownLeftIcon,
    ArrowBendDownRightIcon,
    ArrowRightIcon,
    CaretUpIcon,
    DetectiveIcon,
    FlowerTulipIcon,
    GhostIcon,
    GithubLogoIcon,
    InfoIcon,
    LockKeyOpenIcon,
    LockLaminatedIcon,
    PasswordIcon,
    PeaceIcon,
    PersonArmsSpreadIcon,
    PersonIcon,
    QuotesIcon,
    ScrollIcon,
    SmileyIcon,
    SparkleIcon,
    VaultIcon,
} from "@phosphor-icons/react";
import { ReactLenis } from "lenis/react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import stamp from "../assets/envelope/stamp.png";
import e2eDiag from "../assets/screenshots/e2e.svg";
import saajan from "../assets/sf.png";
import Logo from "../components/Logo";
import { Modal } from "../components/ui/Modal";

import "@fontsource/kavivanar/index.css";
import "@fontsource/space-mono/index.css";
import "@fontsource/redacted-script/index.css";
import "@fontsource/architects-daughter/index.css";
import { useNavigate } from "react-router-dom";

function HorizontalScroll({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
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
            <div className="flex flex-col items-center shrink-0 gap-8 max-w-11/12 w-220">
                <p className="text-xxs md:text-sm tracking-widester text-neutral-content/80 font-semibold uppercase mt-6">
                    <span className="text-accent">Your letters.</span>&nbsp;
                    <span className="text-error">Nobody else's.</span>
                </p>
                <p className="text-sm md:text-lg text-neutral">
                    When you write or upload anything&nbsp;
                    <span className="font-hand">(yes, even images)</span> here, it gets
                    encrypted in your browser before anything leaves your device. What
                    reaches the server is something unreadable&mdash;and the server has no
                    way to change that, because the key never left you.
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
                            <div className="divider divider-neutral w-1/2 mx-auto">
                                <LockKeyOpenIcon
                                    weight="duotone"
                                    className="-scale-x-100 text-base-200 w-full rounded-full bg-info/50"
                                    size={36}
                                />
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
                                    <p>I've never told anyone this...</p>
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
                        <div className="bg-neutral-content bg-[url('assets/textures/random-grey-variations.png')] text-primary-content grid place-content-center text-sm md:gap-4">
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
                            <div className="divider divider-neutral w-1/2 mx-auto">
                                <LockLaminatedIcon
                                    weight="duotone"
                                    className="text-success-content w-full rounded-full bg-success"
                                    size={36}
                                />
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
            <h1 className="flex tracking-tighter text-5xl md:text-8xl text-neutral-content/80 font-extrabold italic font-display z-10">
                S'more&nbsp;
                <DetectiveIcon weight="duotone" className="text-neutral" />
                Specs
            </h1>
            <div className="flex flex-col items-center shrink-0 gap-2 md:gap-6 max-w-11/12 w-220 mt-4 md:mt-12 text-neutral-content/80">
                <h2 className="text-lg md:text-3xl text-center mx-auto leading-tight md:leading-normal">
                    <Logo type={"inline"} /> uses&nbsp;
                    <span className="text-accent font-mono">Zero Knowledge</span>&nbsp;
                    <button
                        type="button"
                        className="group ul-wavy font-mono text-success"
                    >
                        E
                        <span className="hidden group-hover:inline group-focus-within:inline text-neutral">
                            nd&mdash;
                        </span>
                        2
                        <span className="hidden group-hover:inline group-focus-within:inline text-neutral">
                            &mdash;
                        </span>
                        E
                        <span className="hidden group-hover:inline group-focus-within:inline text-neutral">
                            nd
                        </span>
                        <span className="hidden group-hover:inline group-focus-within:inline">
                            &nbsp;<span>E</span>
                            <span className="hidden group-hover:inline group-focus-within:inline text-neutral">
                                ncryption
                            </span>
                        </span>
                    </button>
                    &nbsp; for your&nbsp;
                    <span className="font-hand text-primary">letters</span>, with&nbsp;
                    <a
                        href="https://hackernoon.com/what-the-heck-is-envelope-encryption-in-cloud-security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-neutral!"
                    >
                        Envelope Encryption
                    </a>
                    &nbsp; for the <span className="font-hand text-primary">keys</span>.
                </h2>
                <div className="text-sm md:text-xl md:leading-relaxed">
                    This means, both the&nbsp;
                    <span className="font-display text-info">encryption</span> and&nbsp;
                    <span className="font-display text-info">decryption</span> runs on
                    your device, in your browser.
                    <ul className="list-decimal ml-6 md:ml-10 list-outside text-neutral marker:text-primary/30 marker:font-mono marker:text-xs marker:md:text-base leading-tight">
                        <li>
                            Every letter has a&nbsp;
                            <span className="font-mono text-primary/50 font-bold">
                                unique key
                            </span>
                            &nbsp; which is derived from your original password.
                        </li>
                        <li>
                            Both the letter and the key are encrypted securely and sent to the
                            server.
                        </li>
                        <li>
                            Now, the server holds&nbsp;
                            <span className="text-primary/50 font-bold">the envelope</span>
                            ,&nbsp;
                            <span className="text-primary/50 font-bold">the seal</span>&nbsp;
                            and&nbsp;
                            <span className="text-primary/50 font-bold">
                                another locked box
                            </span>
                            &mdash;with a key inside that unseals your letter.
                        </li>
                    </ul>
                    But you&mdash;
                    <span className="italic">only you</span>&mdash;hold the very thing
                    that opens that box,&nbsp;
                    <span className="font-mono text-accent">your password</span>.
                </div>
                <div className="text-xs md:text-lg text-right w-full flex items-center justify-end gap-4 leading-relaxed text-neutral-content/80">
                    <span>
                        Nothing on the server is readable without your actual password.
                        <br />
                        Even if someone were to breach in, all they'd find is encrypted
                        noise and ain't no way they crackin'
                        <br />
                        <a
                            href="https://xkcd.com/538/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xxs md:text-sm text-neutral! font-hand"
                        >
                            &nbsp;(unless this happens)
                        </a>
                    </span>
                    <div className="hidden md:flex shrink-0 items-center justify-end bg-success/20 rounded-full p-4 ">
                        <VaultIcon
                            size={36}
                            weight="duotone"
                            className="text-neutral-content"
                        />
                    </div>
                </div>

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
                        <img src={e2eDiag} width={"100%"} alt="pi ku e2e diagram" />
                    </div>
                </Modal>

                <p className="text-sm md:text-lg">
                    Of course, this level of&nbsp;
                    <span className="text-success font-bold">privacy</span> comes with a
                    catch. <span className="text-error font-bold">No password reset</span>
                    &nbsp; for you.
                </p>
                <p className="text-xs md:text-base alert alert-warning font-medium">
                    <InfoIcon weight="duotone" /> Your original password is never stored
                    on the server. So, if it's forgotten, the letters stay sealed
                    foreeeeveer.
                </p>
            </div>
        </section>
    );
}

function OSSSection() {
    return (
        <section className="flex flex-col h-screen w-screen items-center justify-center md:py-18 md:gap-4">
            <h1
                className={
                    "relative tracking-tighter text-4xl md:text-8xl text-neutral-content/80 font-extrabold italic font-serif text-center"
                }
            >
                <Logo type={"inline"} />
                is&nbsp;
                <span className="line-through decoration-6 text-neutral-content/50 decoration-error">
                    &nbsp;private
                    <span className="absolute -translate-y-2 -translate-x-42 md:-translate-x-72 font-hand text-xs md:text-xl opacity-70 rotate-8 tracking-normal inline-flex items-center not-italic w-48 md:w-100 flex-wrap">
                        only for
                        <span className="text-primary">&nbsp;your letters&nbsp;</span>&nbsp;
                        <SmileyIcon weight="duotone" className="text-primary" />
                        <ArrowArcLeftIcon className="text-accent inline rotate-45 -translate-y" />
                    </span>
                </span>
                &nbsp;
                <span className="text-success -rotate-3">open source !</span>
            </h1>
            <div className="flex flex-col items-center shrink-0 max-w-11/12 w-220 gap-2 md:gap-4 p-2 md:p-6 text-neutral-content/80">
                <p className="text-sm md:text-xl">
                    <Logo type={"mono"} /> is
                    <span className="font-hand"> ...uhhh... pretty </span>
                    <span className="text-success font-display">secure</span>. Every claim
                    about privacy and encryption is publicly available in the code so you
                    don't have to take my word at it.
                </p>
                <p className="text-xs md:text-lg">
                    You can also&nbsp;
                    <span className="uppercase font-mono text-primary">Self-host</span>
                    &nbsp;
                    <Logo type={"inline"} /> in just &nbsp;
                    <span className="font-mono text-primary">4 steps</span>.
                </p>
                <div className="mockup-code w-120 max-w-11/12 text-xs md:text-sm before:hidden before:md:block py-0 md:py-4">
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

                <div className="flex flex-wrap md:gap-4 w-full items-center justify-center">
                    <a
                        href="https://git.ramvignesh.dev/me/pi-ku"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-2"
                    >
                        <GithubLogoIcon weight="duotone" /> View Source
                    </a>
                    .
                    <p className="text-xs md:text-base opacity-70">
                        Found something to report or request?&nbsp;
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

                <p className="text-xxs md:text-sm tracking-widester font-semibold uppercase text-accent text-center">
                    Built on the shoulders of open source.
                </p>

                <p className="text-sm md:text-lg">
                    <Logo type={"mono"} /> wouldn't exist without the work of people who
                    chose to build in the open.
                </p>
                <p className="divider font-display opacity-30 my-0 text-xs md:text-lg">
                    a big thanks to
                </p>
                <p className="text-sm md:text-lg">
                    <a
                        href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Web Crypto API
                    </a>
                    : Browser-native cryptography that runs entirely on your device. The
                    backbone of everything secure&mdash;your letters, keys&mdash;here.
                </p>

                <p className="text-sm md:text-lg">
                    <a
                        href="https://daisyui.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        DaisyUI
                    </a>
                    &nbsp; ·&nbsp;
                    <a
                        href="http://fabricjs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Fabric.js
                    </a>
                    &nbsp; ·&nbsp;
                    <a
                        href="https://phosphoricons.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Phosphor Icons
                    </a>
                    : The brilliant work by others that let me focus on the core
                    experience instead of re-inventing the wheel.
                </p>

                <p className="hidden md:block text-sm md:text-lg mt-2 md:mt-4 text-neutral">
                    Open source is what made <Logo type={"inline"} /> possible. It always
                    feels right to give it back the same way.
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
                <div className="flex ml-10 font-ink text-2xl md:text-3xl group">
                    <button type="button" className={"flex flex-col flex-wrap ul-wavy"}>
                        பின்
                        <span
                            className={
                                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-xxs tracking-widester uppercase text-neutral-content/60 mt-2"
                            }
                        >
                            after
                        </span>
                    </button>
                    <ArrowBendDownLeftIcon className={"text-primary"} />
                    <ArrowBendDownRightIcon className="ml-8 text-primary" />
                    <button
                        type="button"
                        className={"flex flex-col flex-wrap group ul-wavy"}
                    >
                        குறிப்பு
                        <span
                            className={
                                "font-sans transition-all duration-1000 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-xxs tracking-[.2em] uppercase text-neutral-content/60 mt-2"
                            }
                        >
                            note. remark.
                        </span>
                    </button>
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
                                        "the most honest thing was always in the&nbsp;
                                        <span className="font-ink">பி. கு.</span>"
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
                        "max-w-220 md:text-xl p-6 flex flex-col gap-4 md:gap-8 text-base-content/70 leading-relaxed"
                    }
                >
                    <p className={""}>
                        <Logo type={"inline"} /> is an abbreviated transliteration of the
                        <span className="font-ink text-accent"> தமிழ் </span>
                        <span className="italic text-xs md:text-base">(Tamil) </span>word
                        for&nbsp;
                        <button
                            type="button"
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
                        </button>
                        &nbsp; &mdash;the thing you add after you've already signed your
                        name, what you write when you thought you were finished, but
                        weren't.
                    </p>
                    <p>
                        <span className={"font-medium text-primary"}>
                            Most of what we actually mean to say never gets said.
                        </span>
                        <br />
                        It sits in drafts , in half-written notes, in the pause before we
                        change the subject. <br />
                        Those words&nbsp;
                        <button
                            type="button"
                            className={
                                "blur-sm hover:blur-none active:blur-none focus:blur-none focus:outline-none transition-all duration-500"
                            }
                        >
                            don't just disappear. They
                        </button>
                        &nbsp; stay&nbsp;
                        <span className={"text-primary font-hand font-extrabold"}>
                            unsaid
                        </span>
                        &mdash;
                        <span className="italic">a quiet weight difficult to bear</span>.
                    </p>
                    <p className={"italic text-neutral text-center"}>
                        And that's okay...
                    </p>
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

                <div className="space-y-6 max-w-220 p-4 text-base-200 text-xl md:text-2xl leading-relaxed">
                    <p>
                        <Logo type={"mono"} /> wasn't built for one kind of person, but a
                        particular kind of feeling&mdash;
                        <span className="italic font-serif text-stone-900">
                            the one that lingers very quietly
                        </span>
                        &mdash;fragile, yet never breaks.
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
            <p className="font-hand text-sm md:text-xl">of writing</p>
            <div className="flex flex-col items-center shrink-0 w-220 max-w-11/12 gap-2 md:gap-8 my-4">
                <div className="relative w-full">
                    <details
                        className="collapse shadow-xs glass opacity-75 open:opacity-100 text-base-300 peer"
                        name="my-accordion-det-1"
                        open
                    >
                        <summary className="collapse-title text-lg md:text-xl leading-tight font-hand flex items-center gap-4">
                            <GhostIcon weight="duotone" className="text-accent" size={32} />
                            &nbsp; To someone you can't reach anymore.
                        </summary>
                        <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
                            <p>
                                A person who left. A relationship that ended without a real
                                ending. Someone who's still in your life but will never know
                                what you felt. Some conversations just close before they're
                                finished.
                                <br />
                            </p>
                            <p className="font-serif text-xs md:text-base italic text-center font-medium text-neutral">
                                <QuotesIcon className="-scale-100" />
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
                            />
                            &nbsp; To someone who's still here.
                        </summary>
                        <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
                            <p>
                                Not every letter is about distance. Sometimes you just need to
                                say something properly&mdash;without a text thread, without the
                                noise of a conversation already in motion. A letter slows it
                                down.
                            </p>
                            <p className="font-serif text-xs md:text-base italic text-center font-medium text-neutral">
                                <QuotesIcon className="-scale-100" />
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
                                />
                                &nbsp;
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
                                Not a journal. Not a note-to-self. A proper letter&mdash;to
                                whoever you'll be in a year, or five, or ten.
                                <br />
                                Ask yourself of the healed wounds, forgotten fears, or the
                                things you finally learned to live with.
                            </p>
                            <p className="font-serif text-xs md:text-base italic text-center font-medium text-neutral">
                                <QuotesIcon className="-scale-100" />
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
                            <SparkleIcon weight="duotone" className="text-accent" size={32} />
                            &nbsp; For liberation.
                        </summary>
                        <div className="collapse-content text-sm md:text-lg flex flex-col gap-4">
                            <p>
                                Some unsaid words just need to leave your headspace. There's no
                                recipient, no subject line, no send button. Just the act of
                                putting it somewhere outside of yourself. <br />
                                That's sometimes enough.
                            </p>
                            <p className="font-serif text-xs md:text-base italic text-center font-medium text-neutral">
                                <QuotesIcon className="-scale-100" />
                                Say it once. All of it. Then let it fade.
                            </p>
                        </div>
                    </details>
                    <span className="absolute md:-right-8 md:-top-10 -top-4 -right-2 md:text-8xl text-6xl font-bold font-mono opacity-20 peer-open:opacity-60 pointer-events-none z-10 transition-all duration-500">
                        04
                    </span>
                </div>
                <button
                    className="flex items-center justify-center gap-2 group mt-12 text-left"
                    type="button"
                >
                    <img
                        src={stamp}
                        alt="stamp"
                        className="rotate-6 group-hover:rotate-0 group-focus-within:rotate-0 transition-all duration-1000 focus:outline-none"
                    />
                    <p className="md:text-xl mt-4">
                        If any of these felt familiar,
                        <br />
                        no matter how little,
                        <br />
                        this is for you.
                    </p>
                </button>
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
        <div className="flex flex-col min-h-screen w-screen items-center py-18 bg-accent text-neutral-content">
            {/* Saajan hover image */}
            <AnimatePresence>
                {hover.visible && (
                    <motion.img
                        src={saajan}
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
                    "relative tracking-tighter text-5xl md:text-8xl text-base-200 font-extrabold italic font-serif"
                }
            >
                Honest Speak
            </h1>
            <div className="flex flex-col items-center shrink-0">
                <div
                    className={
                        "max-w-220 m-2 md:m-8 text-sm md:text-lg p-6 md:p-12 flex flex-col gap-4 md:gap-8 text-base-100 leading-relaxed bg-paper font-serif tracking-tight"
                    }
                >
                    Hi.
                    <p>Thank you so much for making it this far. Really.</p>
                    <p>
                        <Logo type={"inline"} /> took a while to exist.
                        <br />
                        This started as a&nbsp;
                        <a
                            href="https://cs50.harvard.edu/web/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            CS50W
                        </a>
                        &nbsp; capstone&mdash;one I kept postponing until I ran out of
                        excuses. When I sat down to build it, it felt heavier than a typical
                        assignment&mdash;not just because things were difficult. It had to
                        be something that outlasted the grade. I wanted to make this one
                        count more than anything else I'd ever made. Something as close to
                        perfect as I could get it. Something to be remembered for&mdash;a
                        Swan Song if you will.
                    </p>
                    <p>So, I gave it all I've got.</p>
                    <p>
                        Of course, frustrations, id-exisi crises, crept in from time to
                        time. But <Logo type="inline" /> helped me re-kindle the love for
                        the odd hours spent obsessing over the tiniest UX decisions and
                        endlessly polishing the UI&nbsp;
                        <span className="font-hand">
                            (only if I could've just made my mind up on one design system
                            sooner, instead of paddling in a sea of muses, muses everywhere)
                        </span>
                        . I know I've shared the nuts and bolts of <Logo type={"inline"} />
                        &nbsp; here&mdash;the core philosophies, how it all works&mdash;but
                        the heart of it is really something you have to find by exploring it
                        yourself.
                    </p>
                    <p>
                        The "why" behind all of this didn't just appear out of nowhere. For
                        a while, I kept coming back to&nbsp;
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
                        </span>
                        &nbsp; from&nbsp;
                        <a
                            href="https://www.themoviedb.org/movie/191714-the-lunchbox"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            The Lunchbox
                        </a>
                        &nbsp; &mdash;brought to life with such subtle brilliance by&nbsp;
                        <a
                            className="text-accent!"
                            href="https://www.themoviedb.org/person/76793-irrfan-khan"
                            rel="noopener noreferrer"
                        >
                            Irrfan Khan
                        </a>
                        &nbsp;
                        <PeaceIcon weight="duotone" className="inline text-accent" />
                        &mdash;the quiet emotional weight he carries through a lonely and
                        mechanized life, right up until those letters arrive and something
                        inside him finally loosens. The ending feels like a deep sigh
                        of&nbsp;
                        <span className="font-hand font-bold text-accent">
                            "it is what it is"
                        </span>
                        , but the simple act of writing&mdash;of letting the unsaid
                        out&mdash;offered him a brief, yet necessary ease. I think about
                        that a lot.
                    </p>
                    <p>
                        There's a lot that goes&nbsp;
                        <span className={"text-primary font-hand text-lg md:text-xl"}>
                            unsaid
                        </span>
                        &nbsp; these days. Not for a lack of feeling, not for the lack of
                        time, but because the ways we reach each other have quietly changed.
                        We're always reachable <span className="italic">digitally,</span>
                        &nbsp; yet somehow the things that actually matter most end up
                        staying inside&mdash;a trapped one at that.
                        <br />
                        Maybe writing can/will help. Maybe putting words somewhere
                        deliberate makes them feel less like a weight you're carrying alone.
                    </p>
                    <p>Or maybe it won't&mdash;but it's worth a try.</p>
                    <p>
                        <Logo type={"inline"} /> is for that try. I hope it helps. Really.
                    </p>
                    <p
                        className={
                            "text-right font-hand text-neutral text-lg md:text-xl"
                        }
                    >
                        &mdash;Ram
                    </p>
                    <p className="text-xs md:text-sm text-neutral/60 italic">
                        P.S. And just so we're clear&mdash;I wrote every word of this
                        myself&mdash;as I continue to back&nbsp;
                        <a
                            href="https://em-dash-appreciation.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Em DASH
                        </a>
                        . Why should AI get to have all the fun with 'em em dashes?&nbsp;
                        <span className="font-hand">(get it?)</span>
                    </p>
                </div>
                <blockquote className="text-base-300 italic mt-8 md:mt-12 mx-auto border-l-neutral-content/50 leading-relaxed border-l-4 pl-4 max-w-11/12 text-lg">
                    <QuotesIcon
                        weight="duotone"
                        size={48}
                        className="rotate-180 text-neutral-content"
                    />
                    &nbsp; I think we forget things if there is nobody to tell them.
                    <span className="block mt-2 text-sm not-italic text-base-200/70 w-full text-right">
                        ~ Saajan Fernandes,&nbsp;
                        <span className="italic underline decoration-dotted">
                            The Lunchbox
                        </span>
                    </span>
                </blockquote>
            </div>
            <div className="mt-40 mb-44 w-full justify-center flex">
                <button
                    type={"button"}
                    onClick={() => navigate("/onboard")}
                    className="btn btn-base-100 btn-wide rounded-full px-14 font-mono"
                >
                    Begin
                </button>
            </div>
        </div>
    );
}
