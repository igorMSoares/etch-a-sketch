/**
 * Builds the animation API that will be exported to the final user
 * @module js-css-animations
 */
import { init, animate, preset, isEnabled } from './animate.js';
import { VISIBILITY_ANIMS_ID, MOTION_ANIMS_ID } from './globals.js';

/**
 * If 'selector' is a string containing a valid CSS selector,
 * it will be used to perform a querySelector(),
 * If 'selector' is already an HTMLElement it will be returned as it is.
 * @param {Element|string} selector - If it's an HTMLElement, 'selector' will be returned as it is. If it's a string, it should be a valid CSS selector
 * @returns An HTMLElement
 */
const selectElement = selector => {
  const el =
    selector instanceof HTMLElement
      ? selector
      : typeof selector === 'string'
      ? document.querySelector(selector)
      : null;
  if (!el)
    throw new ReferenceError(
      `Invalid element: '${selector}' Expected HTMLElement or a valid CSS selector`
    );
  return el;
};

/**
 * Returns a NodeList with all elements that match 'selector'
 * @param {string} selector - A valid CSS selector to be passed to querySelectorAll()
 * @returns A NodeList containing all elements matched by the 'selector'
 */
const selectAllElements = selector => {
  const elementList = document.querySelectorAll(selector);
  if (!elementList)
    throw new ReferenceError(
      `Invalid element: '${selector}' Expected a valid CSS selector`
    );
  return elementList;
};

/**
 * Gets the element(s) to be animated. The user can pass either an HTMLElement or a CSS selector as a target to the animation
 * @param {HTMLElement|string} selector - An HTMLElement or a valid CSS selector to be passed to querySelectorAll()
 * @returns An array containing a single HTMLElement or a NodeList with all the elements matching the CSS selector in 'selector'
 */
const getTargets = selector => {
  return selector instanceof HTMLElement
    ? [selector]
    : selectAllElements(selector);
};

/**
 * Toggles between two animations.
 *
 * If 'animA' and 'animB' have the same name,
 * it will toggle between the 'hide' state and the 'show' state,
 * although this is only applicable to visibility animations.
 * @see {@link module:globals.VISIBILITY_ANIMS_ID}
 * @param {HTMLElement|string} selector - The DOM element or a valid CSS selector with the element(s) to be animated
 * @param {string} animA - The initial animation name
 * @param {string} animB - The next animation name
 * @param {{
 *  duration: number|string|undefined,
 *  delay: number|string|undefined,
 *  staggerDelay: number|string|undefined,
 *  timingFunction: string|undefined,
 *  blur: string|undefined,
 *  angle: string|undefined,
 *  iteration: string|undefined,
 *  keepSpace: boolean|undefined,
 *  overflowHidden: boolean|undefined,
 *  dimensionsTransition: boolean|undefined,
 *  widthTransition: boolean|undefined,
 *  heightTransition: boolean|undefined
 * }|{}} opts - All options that can be passed by the user to customize the animation
 */
const toggle = (selector, animA, animB, opts = {}) => {
  const args = {};
  [
    'duration',
    'delay',
    'staggerDelay',
    'timingFunction',
    'blur',
    'angle',
    'iteration',
    'direction',
    'transfOrigin',
    'keepSpace',
    'overflowHidden',
    'dimensionsTransition',
    'widthTransition',
    'heightTransition',
    'start',
    'complete',
  ].forEach(prop => (args[prop] = opts[prop]));

  /**
   * The current animation attribute will only be set in the first element that
   * matches the 'selector' passed, but the animation will apply to all elements
   * matched by 'selector'
   */
  const element = selectElement(selector);
  const currentAnim = element.getAttribute('js-css-animation--current');
  const newAnim =
    !currentAnim || ![animA, animB].includes(currentAnim)
      ? animA
      : currentAnim === animA
      ? animB
      : animA;
  const animType =
    MOTION_ANIMS_ID[newAnim] !== undefined ? 'motion' : 'visibility';
  element.setAttribute('js-css-animation--current', newAnim);
  if (animType === 'visibility') {
    checkVisibility(element, 'hidden')
      ? jsCssAnimations.show[newAnim](selector, args)
      : jsCssAnimations.hide[newAnim](selector, args);
  } else if (animType === 'motion') {
    const animFn = jsCssAnimations[newAnim];
    if (typeof animFn === 'function') animFn(selector, args);
  }
};

/**
 * An object containing all the animations functions.
 *
 * Visibility animations functions are under
 * animationFunctions.hide and animationFunctions.show
 *
 * All other keys of animationFunctions are Motion animations functions
 * @see {@link module:globals.VISIBILITY_ANIMS_ID}
 * @see {@link module:globals.MOTION_ANIMS_ID}
 * @type {Object}
 */
const animationFunctions = (function () {
  const handlers = {};
  ['show', 'hide', 'move'].forEach(action => {
    const { animIds, animType } =
      action === 'move'
        ? { animIds: MOTION_ANIMS_ID, animType: 'motion' }
        : { animIds: VISIBILITY_ANIMS_ID, animType: 'visibility' };

    for (const [name, id] of Object.entries(animIds)) {
      const handler = (target, opts = {}) => {
        const args = { animType };
        [
          'start',
          'complete',
          'keepSpace',
          'overflowHidden',
          'staggerDelay',
          'widthTransition',
          'heightTransition',
          'dimensionsTransition',
        ].forEach(opt => (args[opt] = opts[opt]));

        getTargets(target).forEach((element, i) => {
          opts.animType = animType;
          opts.queryIndex = i;
          preset(element, {
            opts,
            animationId: id,
          });

          if (isEnabled(element)) animate(element, action, id, args);
        });
      };

      if (action === 'move') {
        handlers[name] = handler;
      } else {
        if (!handlers[action]) handlers[action] = {};
        handlers[action][name] = handler;
      }
    }
  });
  return handlers;
})();

/**
 * An object containing animations functions wich are triggered by an event (like 'click')
 * @type {Object.<string, Function>}
 */
// @ts-ignore
const eventBoundAnimations = (() => {
  const animations = {};
  [
    { animIds: VISIBILITY_ANIMS_ID, animType: 'visibility' },
    { animIds: MOTION_ANIMS_ID, animType: 'motion' },
  ].forEach(({ animIds, animType }) => {
    Object.keys(animIds).forEach(animName => {
      /**
       * Initiate the event listener with the animation to be performed
       * @param {Object.<string, any>} opts - Contains all options passed by the user to customize the animation
       */
      animations[animName] = opts => {
        init(animIds[animName], { animType, ...opts }, opts.eventType);
      };
    });
  });
  return animations;
})();

/**
 * Verifies if an element is out of its original orientation or scale.
 *
 * Note that if the element has CSS property 'transform: rotate(0deg)',
 * checkTransform() will still return False, as the element is not
 * out of its original orientation.
 * @param {HTMLElement|string} selector - An element or a valid CSS selector corresponding to the element
 * @returns True if the element was rotated from its original orientation. False if it maintains the original orientation.
 */
const checkTransform = selector => {
  const el = selectElement(selector);
  const transform = getComputedStyle(el).transform;
  return transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
};

/**
 * Verifies if a given element is hidden or visible
 * @param {Element|string} selector - An element or a valid CSS selector corresponding to the element
 * @param {string} mode - Either 'visible' or 'hidden'
 * @returns {boolean} True or False depending if the element is visible or hidden, according to the 'mode' passed
 */
const checkVisibility = (selector, mode) => {
  const el = selectElement(selector);
  let result = false;
  if (mode === 'hidden') {
    result =
      getComputedStyle(el).visibility === 'hidden' ||
      getComputedStyle(el).display === 'none';
  } else if (mode === 'visible') {
    result = !checkVisibility(selector, 'hidden');
  }
  return result;
};

/**
 * Will throw an ReferenceError if the animation name does not corresponds to any animation function
 * @type {ProxyHandler}
 */
const verifyAnimationName = {
  /**
   * @param {Object.<string, Function>} animations - Object containing animation functions
   * @param {string} name - Name of the animation
   */
  get(animations, name) {
    if (!(name in animations))
      throw new ReferenceError(`${name} is not a valid animation`);
    return animations[name];
  },
};

/**
 * An API encapsulating all the functions that can be used by the user,
 * like all the animations functions and auxiliary functions like:
 * isTransformed(), isVisible() and isHidden()
 * @type {Object.<string, Function|Object>}
 */
const jsCssAnimations = (function () {
  /**
   * Encapsulates eventBoundAnimations(), adding animation name validation
   * @see eventBoundAnimations
   * @type {Object.<string, Function>}
   */
  const eventAnimations = new Proxy(eventBoundAnimations, verifyAnimationName);
  /**
   * Encapsulates animationFunctions.show, adding animation name validation
   * @see animationFunctions
   * @type {Object.<string, Function>}
   */
  const showVisibilityAnim = new Proxy(
    animationFunctions.show,
    verifyAnimationName
  );
  /**
   * Encapsulates animationFunctions.hide, adding animation name validation
   * @see animationFunctions
   * @type {Object.<string, Function>}
   */
  const hideVisibilityAnim = new Proxy(
    animationFunctions.hide,
    verifyAnimationName
  );
  const animationsHandler = Object.freeze({
    init: eventAnimations,
    ...animationFunctions,
    show: showVisibilityAnim,
    hide: hideVisibilityAnim,
    toggle: toggle,
    blink: (target, opts = {}) => {
      jsCssAnimations.show.fade(target, {
        duration: '1s',
        iteration: 'infinite',
        direction: 'alternate',
        ...opts,
      });
    },
    pulsate: (target, opts = {}) => {
      jsCssAnimations.scale(target, {
        finalScale: '1.5',
        duration: '1s',
        iteration: 'infinite',
        direction: 'reverse',
        ...opts,
      });
    },
    isTransformed: checkTransform,
    /**
     * @param {Element|string} selector - Dom element or a valid CSS selector
     * @returns True if the element is visible, False otherwise
     */
    isVisible: selector => checkVisibility(selector, 'visible'),
    /**
     * @param {Element|string} selector - Dom element or a valid CSS selector
     * @returns True if the element is hidden, False otherwise
     */
    isHidden: selector => checkVisibility(selector, 'hidden'),
  });

  return new Proxy(animationsHandler, verifyAnimationName);
})();

export default jsCssAnimations;
