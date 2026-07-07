/**
 * True on Apple platforms (macOS, iOS, iPadOS), where editor shortcuts use
 * ⌘ instead of Ctrl. `navigator.platform` carries the cleanest signal
 * ('MacIntel', 'iPhone', …); the user agent is the fallback where it is
 * empty. Guarded so importing modules stays safe under SSR.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined')
    return false
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
}
