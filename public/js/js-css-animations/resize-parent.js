/**
 * Handles parent element's resizing to perform width/height smooth transitions
 * when child element is being animated
 * @module resize-parent
 */
import {
  CLASS_NAMES,
  CUSTOM_CSS_PROPERTIES,
  PROPERTY_NAMES,
} from './globals.js';

import {
  getParentMeasures,
  setParentMaxMeasures,
  removeDimensionMax,
} from './measurements.js';

import {
  setDimensionsTransitions,
  removeDimensionsTransitions,
} from './transitions.js';

import { setCssProperty, removeCustomCssProperties } from './animate.js';

/**
 * Gets the default value of a CSS property defined in js-css-animations.css
 * @param {string} property - PROPERTY_NAMES key corresponding to a CSS property name
 * @returns The default js-css-animation property value
 */
const getRootCssProperty = property => {
  return getComputedStyle(document.documentElement).getPropertyValue(
    PROPERTY_NAMES[property]
  );
};

/**
 * Sets the same CSS variables (customized by the options in the animation function)
 * in the parent element, so the parent's dimensions transitions will have
 * the same custom properties of the child element's animations
 * @param {HTMLElement} element - The DOM element being animated
 */
const setParentCssProperties = element => {
  let currentProp;
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    currentProp = getComputedStyle(element).getPropertyValue(
      PROPERTY_NAMES[prop]
    );

    if (currentProp !== getRootCssProperty(prop) && element.parentElement) {
      setCssProperty(element.parentElement, prop, currentProp);
    }
  });
};

/**
 * Returns a string with the dimension to transition, or 'all' for both dimensions, or undefined if neither width nor height should be transitioned
 * @param {boolean} wTransit - Indicates if parent element should have width transition
 * @param {boolean} hTransit - Indicates if parent element should have height transition
 * @returns undefined if both parameters are false, 'all' if both are true and 'width' or 'height' if only wTransit or hTransit is true, respectively
 */
const getDimension = (wTransit, hTransit) => {
  let dimension;
  if (wTransit && hTransit) dimension = 'all';
  else if (wTransit) dimension = 'width';
  else if (hTransit) dimension = 'height';
  return dimension;
};

/**
 * Adds a CSS class which will set the overflow property to 'clip' (or 'hidden')
 * @param {HTMLElement} el - The DOM element which will receive the CSS class
 */
const setOverflowHidden = el => {
  el.classList.add(CLASS_NAMES.overflowHidden);
};

/**
 * Removes the CSS class which sets the overflow property to 'clip' (or 'hidden')
 * @param {HTMLElement} el - The DOM element with the CSS class to remove
 */
const removeOverflowHidden = el => {
  el.classList.remove(CLASS_NAMES.overflowHidden);
};

/**
 * Handles parent element width/height transitions during child element's animation
 * @param {{
 *  element: HTMLElement,
 *  action: string,
 *  widthTransition: boolean,
 *  heightTransition: boolean,
 *  overflowHidden: boolean
 * }} args - Containing all the information needed to initiate parent's dimensions transitions
 * @returns An object with the dimension(s) to transition and the parent element's measurements before and after the child element's animation is performed
 */
const initParentResize = args => {
  const { element, action, widthTransition, heightTransition } = args;

  const parentMeasures = getParentMeasures(element);
  const parentElement = element.parentElement ?? document.documentElement;
  const dimension = getDimension(widthTransition, heightTransition);
  setDimensionsTransitions(parentElement, widthTransition, heightTransition);
  setParentCssProperties(element);
  if (args.overflowHidden) setOverflowHidden(parentElement);
  setParentMaxMeasures({
    parentState: 'initial',
    element,
    parentMeasures,
    action,
    dimension,
  });
  return { parentMeasures, dimension };
};

/**
 * Removes all CSS properties and classes added to the parent element to handle the dimensions transitions during the animation
 * @param {HTMLElement} element - The DOM element being animated
 * @param { {widthTransition: boolean, heightTransition: boolean} } opts - Indicates which dimensions were transitioned
 */
const endParentResize = (element, opts) => {
  const { widthTransition: wTransit, heightTransition: hTransit } = opts;
  const parentElement = element.parentElement ?? document.documentElement;
  removeDimensionMax(parentElement, 'height');
  removeDimensionMax(parentElement, 'width');
  removeCustomCssProperties(parentElement);
  removeDimensionsTransitions(parentElement, wTransit, hTransit);
  removeOverflowHidden(parentElement);
};

export { initParentResize, endParentResize };
