import {
  VISIBILITY_ANIMS_ID,
  MOTION_ANIMS_ID,
  PROPERTY_NAMES,
  CLASS_NAMES,
  CUSTOM_CSS_PROPERTIES,
} from './globals.js';

import {
  initParentTransitions,
  handleVisibilityToggle,
  endVisibilityToggle,
} from './dimensions.js';

import {
  setDimensionsTransitions,
  appendTransition,
  getCurrentTransition,
} from './transitions.js';

const CALLBACK_TRACKER = Object.freeze({
  executing: {},
});

export const removeCustomCssProperties = element => {
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    element.style.removeProperty(PROPERTY_NAMES[prop]);
  });
};

export const setCssProperty = (element, property, value) => {
  element.style.setProperty(PROPERTY_NAMES[property], value);
};

const updateCssProperties = (element, opts) => {
  removeCustomCssProperties(element);
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    if (typeof opts[prop] === 'string' || typeof opts[prop] === 'number') {
      if (
        ['delay', 'duration'].includes(prop) &&
        typeof opts[prop] === 'number'
      ) {
        opts[prop] = `${opts[prop]}ms`;
      }
      setCssProperty(element, prop, opts[prop]);
    }
  });
};

const getTargetSelector = eventTarget => {
  let toggleBtn = eventTarget;
  while (toggleBtn && !toggleBtn.getAttribute('target-selector')) {
    /** bubbles up untill the attribute is found */
    toggleBtn = toggleBtn.parentElement;
  }

  if (!toggleBtn)
    throw new ReferenceError('target-selector attribute not found');

  return toggleBtn.getAttribute('target-selector');
};

const DURATION_REGEX = Object.freeze(new RegExp(/(\d?\.\d+|\d+)(ms|s)?/));

const getTimeInMs = string => {
  if (string === undefined) return 0;
  let match = string.match(DURATION_REGEX);
  return match.at(-1) === 's' ? Number(match[1]) * 1000 : Number(match[1]);
};

const getTotalAnimTime = element => {
  const total = {};
  ['duration', 'delay'].forEach(prop => {
    total[prop] = getTimeInMs(
      getComputedStyle(element).getPropertyValue(PROPERTY_NAMES[prop])
    );
  });
  return total;
};

const isVisibility = animType => animType === 'visibility';
const isMotion = animType => animType === 'motion';

const removeVisibilityCssClasses = element => {
  Object.values(VISIBILITY_ANIMS_ID).forEach(animId => {
    element.classList.remove(
      CLASS_NAMES.show[animId],
      CLASS_NAMES.hide[animId]
    );
  });
};

const removeMotionCssClasses = element => {
  Object.values(MOTION_ANIMS_ID).forEach(animId => {
    element.classList.remove(
      CLASS_NAMES.move[animId],
      CLASS_NAMES.moveBack[animId]
    );
  });
};

const disable = element => {
  element.setAttribute('js-anim--disabled', 'true');
};

const enable = element => {
  element.removeAttribute('js-anim--disabled');
};

const isEnabled = element =>
  !(element.getAttribute('js-anim--disabled') === 'true');

const targetsStack = {};

const animate = (element, action, id, opts = {}) => {
  disable(element);
  const { animType, toggleBtn, start, complete, resetAfter, hide } = opts;
  const { duration, delay } = getTotalAnimTime(element);
  const OPPOSITE_ACTION = Object.freeze({
    hide: 'show',
    show: 'hide',
    move: 'moveBack',
    moveBack: 'move',
  });
  let parentMeasures, dimension, currentTransition;

  if (opts.staggerDelay && toggleBtn) {
    if (!targetsStack[toggleBtn]) targetsStack[toggleBtn] = [];
    targetsStack[toggleBtn].push(element);
  }

  if (!CALLBACK_TRACKER.executing[toggleBtn])
    CALLBACK_TRACKER.executing[toggleBtn] = {};

  if (isVisibility(animType)) {
    if (!toggleBtn) removeVisibilityCssClasses(element);
    const { widthTransition = true, heightTransition = true } = opts;
    ({ parentMeasures, dimension } = initParentTransitions({
      element,
      action,
      widthTransition,
      heightTransition,
    }));
  } else if (isMotion(animType)) {
    currentTransition = getCurrentTransition(element);
    removeMotionCssClasses(element);
  }

  if (typeof start === 'function') {
    if (toggleBtn && !CALLBACK_TRACKER.executing[toggleBtn].start) {
      CALLBACK_TRACKER.executing[toggleBtn].start = true;
      start();
    } else if (!toggleBtn) {
      start();
    }
  }

  element.classList.remove(CLASS_NAMES[OPPOSITE_ACTION[action]][id]);
  element.classList.add(CLASS_NAMES[action][id]);

  if (isVisibility(animType)) {
    setTimeout(() => {
      handleVisibilityToggle(element, {
        parentState: 'final',
        element,
        parentMeasures,
        action,
        dimension,
        hide,
      });
    }, 0);
  } else if (isMotion(animType)) {
    if (currentTransition) {
      appendTransition(element, CLASS_NAMES[action][id], currentTransition);
    }
    if (action === 'move') element.classList.add(CLASS_NAMES.moved);
  }

  setTimeout(() => {
    if (isVisibility(animType)) {
      endVisibilityToggle(element, action, hide);
    } else if (isMotion(animType) && action === 'moveBack') {
      element.classList.remove(CLASS_NAMES.moved);
    }

    if (opts.staggerDelay) {
      if (opts.queryIndex === opts.totalTargets - 1) {
        targetsStack[toggleBtn].forEach(el => enable(el));
      }
    } else {
      enable(element);
    }

    if (typeof complete === 'function') {
      if (toggleBtn && !CALLBACK_TRACKER.executing[toggleBtn].complete) {
        CALLBACK_TRACKER.executing[toggleBtn].complete = true;
        complete();
      } else if (!toggleBtn) {
        complete();
      }
    }

    if (toggleBtn) {
      setTimeout(() => {
        delete CALLBACK_TRACKER.executing[toggleBtn];
      }, delay);
    }

    if (resetAfter) removeCustomCssProperties(element);
  }, duration + delay);
};

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

const eventHandler = (el, animationId, opts) => {
  return e => {
    e.stopPropagation();

    const action = getAction(el, opts.animType);
    if (!action)
      throw new ReferenceError(
        `Can't find a valid action for this animation type`
      );

    if (isEnabled(el)) animate(el, action, animationId, opts);
  };
};

const preset = (el, args) => {
  const { opts, animType, widthTransition, heightTransition } = args;

  updateCssProperties(el, opts);

  if (opts.staggerDelay) {
    const staggeredDelay =
      getTimeInMs(opts.delay?.toString()) +
      getTimeInMs(opts.staggerDelay.toString()) * args.queryIndex;
    setCssProperty(el, 'delay', `${staggeredDelay}ms`);
  }

  if (isVisibility(animType)) {
    setDimensionsTransitions(
      el.parentElement,
      widthTransition,
      heightTransition
    );
  }
};

const init = (animationId, opts = {}) => {
  const {
    toggleBtn = `.${CLASS_NAMES.toggleBtn}`,
    toggleSelector,
    cursor,
    animType,
    widthTransition = true,
    heightTransition = true,
  } = opts;

  document.querySelectorAll(toggleBtn).forEach(btn => {
    btn.classList.add(CLASS_NAMES.btnCursor);
    if (typeof cursor === 'string') {
      setCssProperty(btn, 'cursor', cursor);
    }
    if (typeof toggleSelector === 'string') {
      btn.setAttribute('target-selector', toggleSelector);
    }

    document
      .querySelectorAll(getTargetSelector(btn))
      .forEach((el, i, queryList) => {
        preset(el, {
          animType,
          widthTransition,
          heightTransition,
          opts,
          queryIndex: i,
        });

        btn.addEventListener(
          'click',
          eventHandler(el, animationId, {
            ...opts,
            totalTargets: queryList.length,
            queryIndex: i,
          })
        );
      });
  });
};

const getTargets = element => {
  const el =
    element instanceof HTMLElement
      ? [element]
      : typeof element === 'string'
      ? document.querySelectorAll(element)
      : null;
  if (!el)
    throw new ReferenceError(
      `Invalid element: '${element}' Expected HTMLElement or a valid element selector`
    );
  return el;
};

const jsCssAnimations = (function () {
  const animationFunctions = (function () {
    const handlers = {};
    ['show', 'hide', 'move'].forEach(action => {
      const { animIds, animType } =
        action === 'move'
          ? { animIds: MOTION_ANIMS_ID, animType: 'motion' }
          : { animIds: VISIBILITY_ANIMS_ID, animType: 'visibility' };

      for (const [name, id] of Object.entries(animIds)) {
        const handler = (target, opts = {}) => {
          const {
            start,
            complete,
            hide,
            widthTransition = true,
            heightTransition = true,
            resetAfter = true,
          } = opts;

          getTargets(target).forEach((element, i) => {
            preset(element, {
              animType,
              widthTransition,
              heightTransition,
              opts,
              queryIndex: i,
            });

            if (isEnabled(element))
              animate(element, action, id, {
                animType,
                start,
                complete,
                widthTransition,
                heightTransition,
                hide,
                resetAfter,
              });
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

  const eventBoundAnimations = (() => {
    const animations = {};
    [VISIBILITY_ANIMS_ID, MOTION_ANIMS_ID].forEach(animIds => {
      const animType =
        animIds === VISIBILITY_ANIMS_ID ? 'visibility' : 'motion';
      Object.keys(animIds).forEach(animName => {
        animations[animName] = opts =>
          init(animIds[animName], { animType, ...opts });
      });
    });
    return animations;
  })();

  const verifyAnimationName = {
    get(animations, name) {
      if (!(name in animations))
        throw new ReferenceError(`${name} is not a valid animation`);
      return animations[name];
    },
  };

  const eventAnimations = new Proxy(eventBoundAnimations, verifyAnimationName);
  const showVisibilityAnim = new Proxy(
    animationFunctions.show,
    verifyAnimationName
  );
  const hideVisibilityAnim = new Proxy(
    animationFunctions.hide,
    verifyAnimationName
  );
  const animationsHandler = Object.freeze({
    init: eventAnimations,
    ...animationFunctions,
    show: showVisibilityAnim,
    hide: hideVisibilityAnim,
  });

  return new Proxy(animationsHandler, verifyAnimationName);
})();

export default jsCssAnimations;
