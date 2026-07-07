/**
 * Canvas preview widths selectable in the toolbar. Preview-only editor state:
 * never written into `GissenData` — responsive behavior belongs to the user's
 * components, not the document.
 */
export type ViewportPreset = 'desktop' | 'tablet' | 'mobile'

/** Fixed frame widths (px) of the constrained presets. Not configurable in v0.1. */
export const VIEWPORT_WIDTHS: Record<Exclude<ViewportPreset, 'desktop'>, number> = {
  tablet: 768,
  mobile: 375,
}

/** The width (px) the canvas frame is constrained to, or null for the full pane. */
export function viewportWidth(preset: ViewportPreset): number | null {
  return preset === 'desktop' ? null : VIEWPORT_WIDTHS[preset]
}

/**
 * Scale-to-fit factor for the preview frame: shrinks the frame only when the
 * pane cannot hold the preset width. Stays 1 when unconstrained, while the
 * pane is unmeasured (SSR, environments without ResizeObserver), and during
 * an active drag — Sortable hit-tests in untransformed coordinates, so drags
 * temporarily reset the scale (restored on drop).
 */
export function viewportScale(
  presetWidth: number | null,
  paneWidth: number | null,
  dragging: boolean,
): number {
  if (presetWidth === null || paneWidth === null || paneWidth <= 0 || dragging)
    return 1
  return Math.min(1, paneWidth / presetWidth)
}
