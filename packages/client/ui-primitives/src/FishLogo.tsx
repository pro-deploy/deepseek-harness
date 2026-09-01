// Brand mark: the KROKKI mascot, a bespectacled green crocodile on a dark badge
// ringed in lime, served as a raster asset from the web public root. The mark is
// full-color and identical in either theme; the `variant` prop is retained for
// call-site compatibility but no longer changes the paint.

import type { IconProps } from './icons/props.ts'

/** Extra prop kept for call-site compatibility (the mascot is always full-color). */
interface FishLogoProps extends IconProps {
  /** Retained for compatibility; the mascot mark ignores it. */
  variant?: 'ink' | 'brand' | undefined
}

/** Public-root URL of the KROKKI mascot mark. */
const KROKKI_LOGO_SRC = '/krokki-logo.png'

/**
 * Render the brand mark (the KROKKI mascot).
 * @param props.size - side length in px (default 24; the mark is square).
 * @param props.className - extra class for layout placement.
 * @returns the mark image element (aria-hidden decorative brand art; pair with the wordmark for accessibility).
 */
export function FishLogo({ size = 24, className }: FishLogoProps) {
  return (
    <img
      src={KROKKI_LOGO_SRC}
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
