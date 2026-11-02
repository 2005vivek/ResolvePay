/**
 * Mobile Haptic Feedback Helper
 * Uses navigator.vibrate where supported (Android Chrome / Edge / PWA)
 * Fails safely and silently on iOS / Desktop browsers without throwing.
 */

export function triggerHaptic(pattern: number | number[] = 10) {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore silence on platforms that restrict vibration without user gesture
    }
  }
}

/** Subtle 10ms click for button taps, tab switches, and filter selection */
export function hapticLight() {
  triggerHaptic(10);
}

/** Crisp 20ms tactile feedback for opening drawer, sheet, or modals */
export function hapticMedium() {
  triggerHaptic(20);
}

/** Rhythmic double-tick for successful sync, copy, or dispute submission */
export function hapticSuccess() {
  triggerHaptic([25, 45, 25]);
}

/** Distinct warning vibration for errors or destructive confirmations */
export function hapticWarning() {
  triggerHaptic([40, 60, 40]);
}

/** Pull-to-refresh trigger tick when threshold crossed */
export function hapticPullTrigger() {
  triggerHaptic(18);
}
