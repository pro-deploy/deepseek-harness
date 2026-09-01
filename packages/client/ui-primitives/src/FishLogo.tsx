// Brand mark: the maxbirkin.com glyph (an upward triangle outline with a dot
// inside). The default `ink` variant draws it in currentColor so it rides the
// wordmark ink and stays legible in either theme; the `brand` variant paints
// the site's green radial gradient (#5cf0bd to #1e9e79) for a standalone
// full-color mark that matches maxbirkin.com on any theme background. Square
// canvas; the collapsed rail and the empty-state hero pair it with the wordmark.

import type { IconProps } from './icons/props.ts'

/** Extra prop selecting the mark's coloring. */
interface FishLogoProps extends IconProps {
  /**
   * `ink` (default): currentColor stroke and dot, for the inline wordmark.
   * `brand`: the maxbirkin.com green gradient, for a standalone full-color mark.
   */
  variant?: 'ink' | 'brand' | undefined
}

// Radial gradient id shared by every `brand` instance; identical definitions
// collapse to one paint, so a fixed id is safe across repeated marks.
const BRAND_GRADIENT_ID = 'dsw-fish-brand-gradient'

/**
 * Render the brand mark.
 * @param props.size - side length in px (default 24; the glyph is square).
 * @param props.className - extra class for layout placement.
 * @param props.variant - `ink` (currentColor, default) or `brand` (green gradient).
 * @returns the mark svg (aria-hidden; pair with the wordmark for accessibility).
 */
export function FishLogo({ size = 24, className, variant = 'ink' }: FishLogoProps) {
  const paint = variant === 'brand' ? `url(#${BRAND_GRADIENT_ID})` : 'currentColor'
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {variant === 'brand' && (
        <defs>
          <radialGradient id={BRAND_GRADIENT_ID} cx="32%" cy="30%" r="80%">
            <stop offset="0" stopColor="#5cf0bd" />
            <stop offset="1" stopColor="#1e9e79" />
          </radialGradient>
        </defs>
      )}
      <polygon
        points="32,15 48,47 16,47"
        fill="none"
        stroke={paint}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle cx="32" cy="37" r="4.8" fill={paint} />
    </svg>
  )
}
