import { FeatherIcon } from "@phosphor-icons/react";

const WAVE = "M2 28 q13.5 -8 27 0 t27 0 t27 0 t27 0 t27 0 t27 0 t27 0 t27 0";

/**
 * An indeterminate wave for the boot splash.
 *
 * It claims no percentage - there is no honest denominator available before the
 * app has loaded, and a fabricated one gets caught the moment someone is on a
 * bad connection. So the only thing this says is when it stops, which makes the
 * settle the entire message rather than a flourish on the end of one.
 *
 * The ink and the quill use the same path so the nib stays on the end of the line.
 */
export default function BootWave({ settling }: { settling: boolean }) {
  return (
    <div className="boot-wave" data-settling={settling || undefined}>
      <svg viewBox="0 0 240 36" width="240" height="36" aria-hidden="true">
        <g className="boot-wave-track">
          <path className="boot-wave-ink" d={WAVE} pathLength="1" />
          <g
            className="boot-wave-quill"
            style={{ offsetPath: `path("${WAVE}")` }}
          >
            {/* Place the rounded end of the feather shaft at the path origin. */}
            <FeatherIcon x={-2.875} y={-20.125} size={23} weight="duotone" />
          </g>
        </g>
      </svg>
    </div>
  );
}
