/**
 * Handles all the animation process
 * @module animate
 */
import {
  MOTION_ANIMS_ID,
  PROPERTY_NAMES,
  CLASS_NAMES,
  CUSTOM_CSS_PROPERTIES,
} from './globals.js';

import { initParentResize, endParentResize } from './resize-parent.js';

import {
  removeInlineTransition,
  appendTransition,
  getCurrentTransition,
} from './transitions.js';

import { setParentMaxMeasures } from './measurements.js';

/** Matches duration or delay CSS properties values */
const DURATION_REGEX = Object.freeze(new RegExp(/(\d?\.\d+|\d+)(ms|s)?/));

/**
 * Keeps track of the callbacks being executed, preventing the callbacks to be executed
 * multiple times if multiple elements are being animated by a single trigger.
 *
 * When an element triggers an animation, no matter how many elements are being animated,
 * the start() and complete() callbacks should each be executed only once.
 * @type {{
 *  executing: Object.<string, Object<string, boolean>>,
 *  init: Function,
 *  remove: Function
 * }}
 */
const CALLBACK_TRACKER = Object.freeze({
  executing: {},
  /**
   * Initiates the tracker
   * @param {string} trigger - A CSS selector representing the element which triggered the animation
   */
  init: function(trigger) {
    CALLBACK_TRACKER.executing[trigger] = {};
  },
  /**
   * Removes 'trigger' from the tracker
   * @param {string} trigger - A CSS selector representing the element which triggered the animation
   */
  remove: function(trigger) {
    delete this.executing[trigger];
  },
});

/**
 * Keeps track of all the targets being animated to ensure that the callback tracker
 * will be removed only when all the targets have been animated. Also ensures that
 * all targets will be re-enabled only when all targets have already been animated.
 * @type {{add: Function, remove: Function, get: Function, stack: Object.<string, HTMLElement[]>}}
 */
const TARGETS_STACK = {
  /**
   * Adds an element to the stack
   * @param {HTMLElement} elem - Element being animated
   * @param {string} trigger - CSS selector for the element that triggered the animation
   */
  add: function(elem, trigger) {
    if (!(trigger in this.stack)) this.stack[trigger] = [];
    this.stack[trigger].push(elem);
  },
  /**
   * Removes from the stack all the elements animated by the same trigger button
   * @param {string} trigger - CSS selector for the element that triggered the animation
   */
  remove: function(trigger) {
    if (!(trigger in this.stack)) return;
    delete this.stack[trigger];
  },
  /**
   * Gets all elements included in the stack for a given trigger button
   * @param {string} trigger - CSS selector for the element that triggered the animation
   * @returns An array of elements that have been animated by the same trigger button
   */
  get: function(trigger) {
    if (!(trigger in this.stack)) return;
    return this.stack[trigger];
  },
  stack: {},
};

/**
 * Removes the CSS properties customized by the user
 * @param {HTMLElement} element - The DOM element with the custom CSS properties
 */
export const removeCustomCssProperties = element => {
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    element.style.removeProperty(PROPERTY_NAMES[prop]);
  });
};

/**
 * Sets an inline CSS property
 * @param {HTMLElement} element - The DOM element which will receive the property
 * @param {string} property - Property key in the PROPERTY_NAMES object
 * @param {string} value - Value of the CSS Property
 * @see {@link module:globals.PROPERTY_NAMES}
 */
export const setCssProperty = (element, property, value) => {
  element.style.setProperty(PROPERTY_NAMES[property], value);
};

/**
 * Sets the CSS properties customized by the user in the animation function's options
 * @param {HTMLElement} element - The DOM element to update the CSS Properties
 * @param {Object.<string, string>} opts - Object containing a custom property key and a CSS value to be updated
 */
const updateCssProperties = (element, opts) => {
  removeCustomCssProperties(element);
  removeInlineTransition(element);
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    if (typeof opts[prop] === 'string' || typeof opts[prop] === 'number') {
      if (typeof opts[prop] === 'number') {
        const unit = {
          duration: 'ms',
          delay: 'ms',
          angle: 'deg',
          blur: 'px',
          iteration: '',
          initialScale: '',
          finalScale: '',
        };

        opts[prop] = `${opts[prop]}` + unit[prop];
      }
      setCssProperty(element, prop, opts[prop]);
    }
  });
};

/**
 * Searches and returns the 'target-selector' attribute
 *
 * If the element which triggered the event doesn't have the attribute,
 * will bubbles up untill the attribute is found.
 * If no attribute is found, an empty string is returned and so
 * no element will be selected to be animated
 * @param {HTMLElement} eventTarget - The DOM element wich triggers the event
 * @returns The CSS selector for the animation target(s) or an empty string
 */
const getTargetSelector = eventTarget => {
  /** @type {HTMLElement|null} */
  let trigger = eventTarget;
  while (trigger && !trigger.getAttribute('target-selector')) {
    /** bubbles up untill the attribute is found */
    trigger = trigger.parentElement;
  }

  if (!trigger) throw new ReferenceError('target-selector attribute not found');

  return trigger.getAttribute('target-selector') ?? '';
};

/**
 * Removes the unit from the duration or delay and returns the value in milliseconds
 * @param {string} value - duration or delay CSS property value
 * @returns The duration or delay in milliseconds
 */
const getTimeInMs = value => {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  let match = value.match(DURATION_REGEX) ?? [0, 0];
  return match.at(-1) === 's' ? Number(match[1]) * 1000 : Number(match[1]);
};

/**
 * Returns an object with the duration and delay time in milliseconds
 * @param {HTMLElement} element - The DOM element being animated
 * @returns Both the duration and delay, in milliseconds
 */
const getTotalAnimTime = element => {
  const total = {};
  ['duration', 'delay'].forEach(prop => {
    total[prop] = getTimeInMs(
      getComputedStyle(element).getPropertyValue(PROPERTY_NAMES[prop])
    );
  });
  return total;
};

/**
 * Returns true if the animation type is 'visibility'
 * @param {string} animType - Either 'motion' or 'visibility'
 * @returns True if animation type is 'visibility'. False otherwise.
 */
const isVisibility = animType => animType === 'visibility';
/**
 * Returns true if the animation type is 'motion'
 * @param {string} animType - Either 'motion' or 'visibility'
 * @returns True if animation type is 'motion'. False otherwise.
 */
const isMotion = animType => animType === 'motion';

/**
 * Removes the current motion animation CSS class from the element
 * @param {HTMLElement} element - The DOM element being animated
 */
const removeMotionCssClass = element => {
  const className = [...element.classList].find(cl =>
    cl.match(/js\-anim\-\-(rotate|scale)/)
  );
  if (className) element.classList.remove(className);
};

/**
 * Sets an attribute to indicate that the element is currently being animated
 * and so can not perform any other animations
 * @param {HTMLElement} element - The DOM element being animated
 */
const disable = element => {
  element.setAttribute('js-anim--disabled', 'true');
};

/**
 * Removes the attribute that indicates that an element is currently being animated
 * @param {HTMLElement} element
 */
const enable = element => {
  element.removeAttribute('js-anim--disabled');
};

/**
 * Verifies if an element is already being animated or not
 * @param {HTMLElement} element - The DOM element to check
 * @returns True if the element is not currently being animated
 */
const isEnabled = element =>
  !(element.getAttribute('js-anim--disabled') === 'true');

/**
 * Verifies if an element has defined an iteration CSS property
 * @param {HTMLElement} element
 * @returns True if the element has an iteration CSS property set, False otherwise
 */
const hasIterationProp = element => {
  return (
    element.style
      .getPropertyValue(PROPERTY_NAMES.iteration)
      .match(/^(infinite|\d+)$/) !== null
  );
};

/**
 * Sets the parent element dimensions, if needed.
 *
 * Removes the collapsed or hidden class from the element, when necessary
 * @param {HTMLElement} element - The DOM element being animated
 * @param {{
 *  parentState: string,
 *  element: HTMLElement,
 *  parentMeasures: Object,
 *  action: string,
 *  dimension: string | undefined,
 *  keepSpace: boolean
 * }} args - All the necessary arguments
 */
const handleVisibilityToggle = (element, args) => {
  setTimeout(() => {
    if (args.dimension) setParentMaxMeasures(args);
    if (args.action === 'show') {
      args.keepSpace
        ? element.classList.remove(CLASS_NAMES.hidden)
        : element.classList.remove(CLASS_NAMES.collapsed);
    }
  }, 0);
};

/**
 * Adds the hidden or collapsed class, when necessary.
 * Finalize parent element's resize operations, if needed.
 * @param {HTMLElement} element - The DOM element being animated
 * @param {Object} opts - All the necessary options
 */
const endVisibilityToggle = (element, opts) => {
  if (opts.action === 'hide') {
    opts.keepSpace
      ? element.classList.add(CLASS_NAMES.hidden)
      : element.classList.add(CLASS_NAMES.collapsed);
  }
  if (opts.heightTransition || opts.widthTransition)
    endParentResize(element, opts);
};

/**
 * Executes a given callback, checking, when necessary, if the callback was already
 * executed by another element being animated by the same trigger button
 * @param {string} trigger - The CSS selector of the element that triggered the animation
 * @param {Function} fn - The callback to execute
 * @param {string} type - Either 'start' or 'complete'
 */
const initCallback = (trigger, fn, type) => {
  if (!['start', 'complete'].includes(type))
    throw new ReferenceError(
      `Invalid callback type: ${type}. Should be 'start' or 'complete'`
    );
  if (trigger) {
    if (!(trigger in CALLBACK_TRACKER.executing))
      CALLBACK_TRACKER.init(trigger);
    if (!CALLBACK_TRACKER.executing[trigger][type]) {
      CALLBACK_TRACKER.executing[trigger][type] = true;
      fn();
    }
  } else {
    fn();
  }
};

/**
 * Handles all the animation process
 * @param {HTMLElement} element - The DOM element to animate
 * @param {string} action - 'show', 'hide', or 'move'
 * @param {number} id - ID of an animation in the *_ANIMS_ID objects
 * @param {Object.<string, any>} opts - All the options passed by the user
 * @see {@link module:globals.VISIBILITY_ANIMS_ID}
 * @see {@link module:globals.MOTION_ANIMS_ID}
 */
const animate = (element, action, id, opts = {}) => {
  disable(element);
  const {
    animType,
    trigger,
    start,
    complete,
    keepSpace,
    dimensionsTransition = keepSpace || isMotion(animType) ? false : true,
    widthTransition = dimensionsTransition,
    heightTransition = dimensionsTransition,
    overflowHidden = true,
  } = opts;
  const { duration, delay } = getTotalAnimTime(element);
  const OPPOSITE_ACTION = Object.freeze({
    hide: 'show',
    show: 'hide',
    move: 'moveBack',
    moveBack: 'move',
  });
  let parentMeasures, dimension, currentTransition;

  if (trigger) TARGETS_STACK.add(element, trigger);

  const handleAnimation = {
    begining: {
      visibility: () => {
        if (widthTransition || heightTransition) {
          ({ parentMeasures, dimension } = initParentResize({
            element,
            action,
            widthTransition,
            heightTransition,
            overflowHidden,
          }));
        }
      },
      motion: () => {
        currentTransition = getCurrentTransition(element);
        removeMotionCssClass(element);
      },
    },
    middle: {
      visibility: () => {
        handleVisibilityToggle(element, {
          parentState: 'final',
          element,
          parentMeasures,
          action,
          dimension,
          keepSpace,
        });
      },
      motion: () => {
        if (currentTransition) {
          appendTransition(element, CLASS_NAMES[action][id], currentTransition);
        }
        if (action === 'move') element.classList.add(CLASS_NAMES.moved);
      },
    },
    end: {
      visibility: () => {
        endVisibilityToggle(element, {
          action,
          keepSpace,
          widthTransition,
          heightTransition,
        });
        if (!hasIterationProp(element))
          element.classList.remove(CLASS_NAMES[action][id]);
      },
      motion: () => {
        if (action === 'moveBack') element.classList.remove(CLASS_NAMES.moved);
      },
    },
    conclude: () => {
      if (trigger && opts.queryIndex === opts.totalTargets - 1) {
        opts.staggerDelay
          ? CALLBACK_TRACKER.remove(trigger)
          : setTimeout(() => CALLBACK_TRACKER.remove(trigger), delay);
        TARGETS_STACK.get(trigger).forEach(el => enable(el));
        TARGETS_STACK.remove(trigger);
      } else if (!trigger) {
        enable(element);
      }
    },
  };

  handleAnimation.begining[animType]();
  if (typeof start === 'function') {
    initCallback(trigger, start, 'start');
  }
  element.classList.add(CLASS_NAMES[action][id]);
  element.classList.remove(CLASS_NAMES[OPPOSITE_ACTION[action]][id]);
  handleAnimation.middle[animType]();

  setTimeout(() => {
    handleAnimation.end[animType]();
    if (typeof complete === 'function') {
      initCallback(trigger, complete, 'complete');
    }
    handleAnimation.conclude();
  }, duration + delay);
};

/**
 * Checks which animation CSS class is set to determine wich action to perform next
 * @param {HTMLElement} element - The DOM element being animated
 * @param {*} animType - Either 'motion' or 'visibility'
 * @returns 'show' or 'hide' or 'move' or 'moveBack'
 */
const getAction = (element, animType) => {
  const classList = [...element.classList];
  return isVisibility(animType)
    ? classList.find(
        c => c === CLASS_NAMES.collapsed || c === CLASS_NAMES.hidden
      )
      ? 'show'
      : 'hide'
    : isMotion(animType)
    ? classList.includes(CLASS_NAMES.moved)
      ? 'moveBack'
      : 'move'
    : null;
};

/**
 * Sets the CSS properties customized by the user,
 * prior to the begining of the animation
 * @param {HTMLElement} el - The DOM element being animated
 * @param {Object} args - The animation's ID and type and all the options passed by the user
 */
const preset = (el, args) => {
  const { opts, animationId } = args;
  const { animType } = opts;
  if (
    !isMotion(animType) ||
    ![MOTION_ANIMS_ID.rotate, MOTION_ANIMS_ID.rotationLoop].includes(
      animationId
    )
  )
    opts.angle = undefined;

  updateCssProperties(el, opts);

  if (opts.staggerDelay) {
    const staggeredDelay =
      getTimeInMs(opts.delay) +
      getTimeInMs(opts.staggerDelay) * opts.queryIndex;
    setCssProperty(el, 'delay', `${staggeredDelay}ms`);
  }
};

/**
 * Generates the handler function to be passed to the event listener
 * @param {HTMLElement} el - The DOM element being animated
 * @param {number} animationId - The ID of the animation in the *_ANIMS_ID
 * @param {Object} opts - The options passed by the user
 * @returns A function to be passed to the addEventListener() as a handler
 * @see {@link module:globals.VISIBILITY_ANIMS_ID}
 * @see {@link module:globals.MOTION_ANIMS_ID}
 */
const eventHandler = (el, animationId, opts) => {
  return (/** @type {Event} */ e) => {
    e.stopPropagation();

    const action = getAction(el, opts.animType);
    if (!action)
      throw new ReferenceError(
        `Can't find a valid action for this animation type`
      );

    preset(el, {
      animationId,
      opts,
    });

    if (isEnabled(el)) animate(el, action, animationId, opts);
  };
};

/**
 * Initiate the event listener with the animation
 * @param {number} animationId - The ID of the animation in *_ANIMS_ID object
 * @param {Object} opts - All options passed by the user
 * @param {string} eventType - The event to attach the animation to
 * @see {@link module:globals.VISIBILITY_ANIMS_ID}
 * @see {@link module:globals.MOTION_ANIMS_ID}
 */
const init = (animationId, opts = {}, eventType = 'click') => {
  const { trigger = `.${CLASS_NAMES.trigger}`, targetSelector, cursor } = opts;

  document.querySelectorAll(trigger).forEach(btn => {
    btn.classList.add(CLASS_NAMES.btnCursor);
    if (typeof cursor === 'string') {
      setCssProperty(btn, 'cursor', cursor);
    }
    if (typeof targetSelector === 'string') {
      btn.setAttribute('target-selector', targetSelector);
    }

    document
      .querySelectorAll(getTargetSelector(btn))
      .forEach((el, i, queryList) => {
        btn.addEventListener(
          eventType,
          // @ts-ignore
          eventHandler(el, animationId, {
            ...opts,
            totalTargets: queryList.length,
            queryIndex: i,
          })
        );
      });
  });
};

export { init, animate, preset, isEnabled };
