import { useLayoutEffect } from "react";

/**
 * Dismisses the boot shell in index.html - the splash a visitor sees before
 * this bundle exists at all.
 *
 * The shell lives outside #root so React never tears it down, and it stays up
 * until a real route has rendered underneath it. Handing over any earlier means
 * swapping the shell for SplashScreen mid-load, which reads as a flicker rather
 * than as one continuous splash.
 *
 * Rendered inside the Suspense boundary, so this effect runs only once the lazy
 * route chunk has resolved.
 */
export default function BootShell() {
  useLayoutEffect(() => {
    const boot = document.getElementById("boot");
    if (!boot) return;

    boot.classList.add("done");
    const timer = setTimeout(() => boot.remove(), 400);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
