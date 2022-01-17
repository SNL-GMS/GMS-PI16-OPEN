/**
 * Returns true if it is a DOM element
 *
 * @param element
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isDomElement(element: any): element is Element {
  return element instanceof Element || element instanceof HTMLDocument;
}

/**
 * @param element
 * @returns the first parent of the provided element that is scrollable, or undefined
 * if none are found. If the element itself is scrollable, then this will return
 * that same original element.
 */
export function getScrollParent(element: Element): Element {
  if (!element) {
    return undefined;
  }

  if (element.scrollHeight > element.clientHeight) {
    return element;
  }
  return getScrollParent(element.parentElement);
}

/**
 * Check if an element provided is "out of view" due to scrolling or overflow.
 *
 * @param element the element to check
 * @param threshold how permissive to be.
 * A number > 0 will count the element as out of view before it is fully off the screen
 * @returns true if it is out of view. False if not. Undefined if element is falsy.
 */
export const isElementOutOfView: (element: Element, threshold?: number) => boolean = (
  element: Element,
  threshold = 20
) => {
  if (element) {
    const bounding = element.getBoundingClientRect();
    const scrollBounding = getScrollParent(element).getBoundingClientRect();
    return (
      scrollBounding.bottom - bounding.bottom < threshold ||
      bounding.top - scrollBounding.top < threshold
    );
  }
  return undefined;
};
