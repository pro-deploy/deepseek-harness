// Brand wordmark rendered as live text: the brand mark (triangle glyph) then the
// "KROKKI" word beside a "HARNESS" badge plate. The mark and word ink ride
// currentColor; the badge fills with the primary label color and knocks its own
// label out in the inverted label color, so both stay legible in either theme.

import type { IconProps } from './icons/props.ts'
import { FishLogo } from './FishLogo.tsx'

/** Display options for the official brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading brand mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the full brand wordmark as text (word plus badge plate).
 * @param props.size - lockup height in px (default 24); word and badge scale from it.
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading brand mark.
 * @returns the wordmark element (aria-hidden decorative brand art).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.33}px`,
        height: `${size}px`,
        color: 'currentColor',
        lineHeight: 1,
      }}
    >
      {includeMark && <FishLogo size={size * 0.92} />}
      <span
        style={{
          fontSize: `${size * 0.72}px`,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        KROKKI
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: `${size * 0.58}px`,
          padding: `0 ${size * 0.28}px`,
          borderRadius: `${size * 0.08}px`,
          background: 'var(--dsw-alias-label-primary)',
          color: 'var(--dsw-alias-label-primary-inverted)',
          fontSize: `${size * 0.42}px`,
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        HARNESS
      </span>
    </span>
  )
}
