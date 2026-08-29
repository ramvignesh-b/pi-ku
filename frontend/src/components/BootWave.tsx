/**
 * An indeterminate wave for the boot splash.
 *
 * It claims no percentage - there is no honest denominator available before the
 * app has loaded, and a fabricated one gets caught the moment someone is on a
 * bad connection. So the only thing this says is when it stops, which makes the
 * settle the entire message rather than a flourish on the end of one.
 *
 * The path holds four periods but only two are visible; travelling exactly one
 * period and looping lands the wave back on itself with no seam.
 */
export default function BootWave({ settling }: { settling: boolean }) {
  return (
    <div className="boot-wave" data-settling={settling || undefined}>
      <svg viewBox="0 0 240 24" width="240" height="24" aria-hidden="true">
        <g className="boot-wave-track">
          <path d="M0,12 q30,-8 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0" />
        </g>
      </svg>
    </div>
  );
}
