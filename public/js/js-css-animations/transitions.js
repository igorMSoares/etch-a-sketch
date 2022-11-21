/**
 * Handle user defined transitions to not conflict with js-css-animations transitions
 * @module transitions
 */
import { CLASS_NAMES } from './globals.js';

/**
 * Parses all CSS properties and combine all transitions into one valid shorthand value
 * for 'transition' CSS property
 * @param {CSSStyleDeclaration} cssProperties - A collection of CSS rules
 * @returns {string} All transitions combined into a single shorthand property
 */
const getAllTransitions = cssProperties => {
  /** @type {{property: string[], duration: string[], timingFunction: string[], delay: string[]}} */
  const transitions = {
    property: [],
    duration: [],
    timingFunction: [],
    delay: [],
  };
  let allTransitions = '';
  /** @type {string[]} */
  const properties = cssProperties['transition-property'].split(/[^A-z^\-]+/);
  const duration = cssProperties['transition-duration'].match(
    /[\d\-\.ms]+|var\(.+\)/g
  );
  const timingFunction = cssProperties['transition-timing-function'].match(
    /[^,^\s]([A-z\-]|\(.+\))+/g
  );
  const delay = cssProperties['transition-delay'].match(
    /[\d\-\.ms]+|var\(.+\)/g
  );

  properties.reverse().forEach(
    /** @param {string} prop */ prop => {
      transitions.property.push(prop);
      transitions.duration.push(
        duration.pop() ?? transitions.duration.at(-1) ?? '0s'
      );
      transitions.timingFunction.push(
        timingFunction.pop() ?? transitions.timingFunction.at(-1) ?? ''
      );
      transitions.delay.push(delay.pop() ?? transitions.delay.at(-1)) ?? '0s';
    }
  );

  for (let i = 0; i < transitions.property.length; i++) {
    allTransitions += `${transitions.property[i]} ${transitions.duration[i]} ${
      transitions.timingFunction[i]
    } ${transitions.delay[i]}${
      i < transitions.property.length - 1 ? ', ' : ''
    }`;
  }

  allTransitions.match(/\-\-([\-A-z])+/g)?.forEach(match => {
    allTransitions = allTransitions.replace(
      `var(${match})`,
      getComputedStyle(document.documentElement).getPropertyValue(match)
    );
    allTransitions = allTransitions.replace(/(\s0\s)|\s0$/, ' 0s');
    allTransitions = allTransitions.replace(/(\s0,)/, ' 0s,');
  });

  return allTransitions;
};

/**
 * Gets user defined transitions of an element, if any
 * @param {HTMLElement} element
 * @returns {string|null} All user defined transitions combined into single shorthand
 * property or null if there's no transition defined by the user
 */
export const getCurrentTransition = element => {
  const defaultComputedTransition = 'all 0s ease 0s';
  const currTransition = getComputedStyle(element).transition;

  return currTransition !== defaultComputedTransition &&
    !element.style.getPropertyValue('transition')
    ? getAllTransitions(getComputedStyle(element))
    : null;
};

/**
 * Gets the transition in a given CSS class
 * @param {string} className - Name of the animation's CSS class
 * @returns {string} A shorthand value for CSS transition property
 */
export const getClassTransition = className => {
  const css = [
    ...([...document.styleSheets].find(ss =>
      ss.href?.match(/js-animations\.css/)
    )?.cssRules ?? []),
  ].find(r => r.cssText.match(`\\.${className}`));

  // @ts-ignore
  return css?.style.transition === ''
    ? // @ts-ignore
      getAllTransitions(css.style)
    : // @ts-ignore
      css?.style.transition;
};

/**
 * If an element already has any transition defined, other than that in className,
 * the current transition(s) will be appended to the className transition so that
 * no transition will be overwritten
 * @param {HTMLElement} element - The DOM element to append the transition
 * @param {string} className - CSS class with a transition to append to other transitions
 * @param {string} currTransition - Transition(s) already defined to element, before it receives the new class (className)
 */
export const appendTransition = (element, className, currTransition) => {
  const classTransition = getClassTransition(className);

  if (
    classTransition &&
    currTransition &&
    !currTransition.match(/max\-width|max\-height/)
  ) {
    element.style.setProperty(
      'transition',
      `${classTransition}, ${currTransition}`
    );
    element.setAttribute('js-css-anim--inline-transition', 'true');
  }
};

/**
 * Verifies wether there should be widht or height transition, or both, or none
 * @param {boolean} wTransit - Indicates if it should have width transition
 * @param {boolean} hTransit - Indicates if it should have height transition
 * @returns {string|undefined} The name of the class with the respective transition, or undefined if there should be no transitions
 */
const getTransitionClassName = (wTransit, hTransit) => {
  let className;
  if (wTransit && hTransit) {
    className = CLASS_NAMES.dimensionsTransitions;
  } else if (wTransit) {
    className = CLASS_NAMES.widthTransition;
  } else if (hTransit) {
    className = CLASS_NAMES.heightTransition;
  }
  return className;
};

/**
 * Appends the appropriate CSS class to handle dimension transitions.
 * If wTransit and hTransit are both set to false, no class will be appended.
 * @param {HTMLElement} element - The DOM element to set the transition
 * @param {boolean} wTransit - Indicates if should have width transition
 * @param {boolean} hTransit - Indicates if should have height transition
 */
export const setDimensionsTransitions = (element, wTransit, hTransit) => {
  const className = getTransitionClassName(wTransit, hTransit);

  if (className) {
    const currTransition = getCurrentTransition(element);
    element.classList.add(className);
    if (currTransition) appendTransition(element, className, currTransition);
  }
};

/**
 * If element has an inline css transition appended by appendTransition()
 * the inline transition property will be removed to reset the element back
 * to its previous state
 * @param {HTMLElement} element - The DOM element to remove the transition
 * @see module:transitions.appendTransition
 */
export const removeInlineTransition = element => {
  if (element.getAttribute('js-css-anim--inline-transition')) {
    element.style.removeProperty('transition');
    element.removeAttribute('js-css-anim--inline-transition');
  }
};

/**
 * Removes the CSS class added by setDimensionsTransitions(), if any
 * @param {HTMLElement} element - The DOM element to remove the transitions
 * @param {boolean} wTransit - Indicates wheter there was a width transition
 * @param {boolean} hTransit - Indicates wheter there was a height transition
 * @see module:transitions.setDimensionsTransitions
 */
export const removeDimensionsTransitions = (element, wTransit, hTransit) => {
  const className = getTransitionClassName(wTransit, hTransit);

  if (className) element.classList.remove(className);
  removeInlineTransition(element);
};
