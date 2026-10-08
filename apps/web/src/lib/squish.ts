import { motionOk } from './motion'

/** What wobbles when pressed: buttons, button-like links and the controls that act like buttons. */
const PRESSABLE =
  'button, a[data-slot="button"], [role="button"], [role="menuitem"], [role="menuitemradio"], [role="option"], [role="tab"], label:has(> input[type="radio"]), label:has(> input[type="checkbox"])'

/**
 * "Bubble gum" squash and stretch, as a fraction of the element's size: small controls wobble
 * clearly, a phone-wide answer button only a little.
 */
export function squishAmount(width: number, height: number): number {
  return Math.min(0.12, 16 / Math.max(width, height, 1))
}

function keyframes(a: number): Keyframe[] {
  // composite: 'add' on the animation puts these on top of the element's own transform (hover lift, pop-in).
  return [
    { transform: 'scale(1, 1)' },
    { transform: `scale(${1 + a}, ${1 - a})`, offset: 0.25 },
    { transform: `scale(${1 - a * 0.7}, ${1 + a * 0.7})`, offset: 0.45 },
    { transform: `scale(${1 + a * 0.35}, ${1 - a * 0.35})`, offset: 0.65 },
    { transform: `scale(${1 - a * 0.12}, ${1 + a * 0.12})`, offset: 0.82 },
    { transform: 'scale(1, 1)' },
  ]
}

/**
 * One listener on the document gives every press (mouse, touch or keyboard: they all click) a short
 * elastic wobble through the Web Animations API, so no component needs to know. Skipped under
 * reduced motion. Returns the uninstall function.
 */
export function installSquish(doc: Document = document): () => void {
  // A click on a label is passed on to its control as a second click: wobble once.
  const last = new WeakMap<Element, number>()
  const onClick = (event: MouseEvent) => {
    if (!motionOk() || !(event.target instanceof Element)) return
    // A [data-squish] container (a choice card) wobbles as a whole instead of the control inside it.
    const el = event.target.closest<HTMLElement>('[data-squish]') ?? event.target.closest<HTMLElement>(PRESSABLE)
    if (!el || el.closest('[data-no-squish]') || typeof el.animate !== 'function') return
    if (event.timeStamp - (last.get(el) ?? -Infinity) < 150) return
    last.set(el, event.timeStamp)
    const { width, height } = el.getBoundingClientRect()
    el.animate(keyframes(squishAmount(width, height)), { duration: 520, easing: 'ease-out', composite: 'add' })
  }
  doc.addEventListener('click', onClick, true)
  return () => doc.removeEventListener('click', onClick, true)
}
