interface Props {
  name: string;
  value: string;
  /** Optional hex fallback to display alongside the oklch literal. */
  hex?: string;
  /** Optional notes (e.g. "P1 severity") to display under the chip. */
  note?: string;
}

/**
 * TokenSwatch — the editorial color swatch in /_style.
 * Hairline-edged chip + tabular numeric value + a Fraunces small-caps
 * label. NOT a centered colored circle with a hex underneath.
 */
export function TokenSwatch({ name, value, hex, note }: Props) {
  return (
    <div className="surface px-4 py-3">
      <div
        className="h-12 w-full mb-3 border border-[color:var(--hairline-soft)]"
        style={{ background: value }}
        aria-hidden
      />
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span
          className="font-display text-[12px] text-[color:var(--bone)]"
          style={{
            fontVariantCaps: "all-small-caps",
            letterSpacing: "0.1em",
            fontVariationSettings: "'SOFT' 60",
          }}
        >
          {name}
        </span>
        {hex && (
          <span className="font-mono text-[10.5px] text-[color:var(--grave)] num">
            {hex}
          </span>
        )}
      </div>
      <div className="font-mono text-[10.5px] text-[color:var(--oyster)]">
        {value}
      </div>
      {note && (
        <p className="font-mono text-[10.5px] text-[color:var(--slate)] mt-2">
          — {note}
        </p>
      )}
    </div>
  );
}
