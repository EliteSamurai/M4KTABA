# Tokens & Rhythm (flag: tokens_rhythm)

Purpose: Centralize basic design tokens and a vertical rhythm helper.

Usage:
- tokens.spacingBasePx: number
- tokens.radius.{sm,md,lg}: numbers
- rhythm(steps): returns a px string multiple of spacing base

Constraints:
- Keep values minimal; extend only when patterns are repeated.
- Prefer utility classes for most spacing; use rhythm for inline styles and JS-calculated spacing.
