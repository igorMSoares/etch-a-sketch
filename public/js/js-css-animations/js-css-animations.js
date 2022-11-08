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
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    if (typeof opts[prop] === 'string') {
      setCssProperty(element, prop, opts[prop]);
    }
  });
};

const getToggleSelector = eventTarget => {
  let toggleBtn = eventTarget;
  while (toggleBtn && !toggleBtn.getAttribute('toggle-selector')) {
    /** bubbles up untill the attribute is found */
    toggleBtn = toggleBtn.parentElement;
  }

  if (!toggleBtn)
    throw new ReferenceError('toggle-selector attribute not found');

  return toggleBtn.getAttribute('toggle-selector');
};

const getTotalAnimTime = element => {
  const total = {};
  ['duration', 'delay'].forEach(prop => {
    total[prop] = Number(
      getComputedStyle(element)
        .getPropertyValue(PROPERTY_NAMES[prop])
        .match(/\d+/)
    );
  });
  return total;
};

const isVisibility = animType => animType === 'visibility';
const isMotion = animType => animType === 'motion';

const removeVisibilityCssClasses = element => {
  Object.values(VISIBILITY_ANIMS_ID).forEach(animId => {
    element.classList.remove(CLASS_NAMES.hide[animId]);
    element.classList.remove(CLASS_NAMES.show[animId]);
  });
};

const removeMotionCssClasses = element => {
  Object.values(MOTION_ANIMS_ID).forEach(animId => {
    element.classList.remove(CLASS_NAMES.move[animId]);
  });
};

const animate = (animType, element, action, id, opts = {}) => {
  element.setAttribute('js-anim--disabled', 'true');
  const { complete, start, toggleBtn, resetAfter, hide } = opts;
  const { duration, delay } = getTotalAnimTime(element);
  const OPPOSITE_ACTION = Object.freeze({
    hide: 'show',
    show: 'hide',
    move: 'moveBack',
    moveBack: 'move',
  });
  let parentMeasures, dimension, currentTransition;
  console.log(element);
  console.log(action);

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
  }

  if (
    typeof start === 'function' &&
    !CALLBACK_TRACKER.executing[toggleBtn].start
  ) {
    CALLBACK_TRACKER.executing[toggleBtn].start = true;
    start();
  }

  if (isMotion(animType)) {
    currentTransition = getCurrentTransition(element);
    removeMotionCssClasses(element);
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
    }, delay);
  } else if (isMotion(animType)) {
    if (currentTransition) {
      appendTransition(element, CLASS_NAMES[action][id], currentTransition);
    }
    if (action === 'move') element.classList.add(CLASS_NAMES.rotated);
  }

  setTimeout(() => {
    if (isVisibility(animType)) {
      endVisibilityToggle(element, action, hide);
    } else if (isMotion(animType) && action === 'moveBack') {
      element.classList.remove(CLASS_NAMES.rotated);
    }

    setTimeout(() => element.removeAttribute('js-anim--disabled'), 100);

    if (
      typeof complete === 'function' &&
      !CALLBACK_TRACKER.executing[toggleBtn].complete
    ) {
      CALLBACK_TRACKER.executing[toggleBtn].complete = true;
      complete();
    }

    if (toggleBtn) {
      setTimeout(() => {
        delete CALLBACK_TRACKER.executing[toggleBtn];
      }, delay);
    }

    setTimeout(() => {
      if (resetAfter) removeCustomCssProperties(element);
    }, duration + delay);
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
    ? classList.includes(CLASS_NAMES.rotated)
      ? 'moveBack'
      : 'move'
    : null;
};

const eventHandler = (triggerBtn, id, animType, opts = {}) => {
  document.querySelectorAll(getToggleSelector(triggerBtn)).forEach(element => {
    const action = getAction(element, animType);
    if (!action)
      throw new ReferenceError(
        `Can't find a valid action for this animation type`
      );

    if (!element.getAttribute('js-anim--disabled'))
      animate(animType, element, action, id, opts);
  });
};

const init = (animationId, opts = {}, animationType) => {
  const {
    toggleBtn = `.${CLASS_NAMES.toggleBtn}`,
    toggleSelector,
    cursor,
    widthTransition = true,
    heightTransition = true,
  } = opts;

  document.querySelectorAll(toggleBtn).forEach(btn => {
    btn.classList.add(CLASS_NAMES.btnCursor);
    if (typeof cursor === 'string') {
      setCssProperty(btn, 'cursor', cursor);
    }
    if (typeof toggleSelector === 'string') {
      btn.setAttribute('toggle-selector', toggleSelector);
    }

    document.querySelectorAll(getToggleSelector(btn)).forEach(el => {
      updateCssProperties(el, opts);
      if (isVisibility(animationType)) {
        setDimensionsTransitions(
          el.parentElement,
          widthTransition,
          heightTransition
        );
      }
    });

    btn.addEventListener('click', e => {
      e.stopPropagation();
      eventHandler(e.target, animationId, animationType, opts);
    });
  });
};

const jsCssAnimations = (function () {
  const animationFunctions = (function () {
    const handlers = {};
    ['show', 'hide', 'move'].forEach(verb => {
      const { animIds, animType } =
        verb === 'move'
          ? { animIds: MOTION_ANIMS_ID, animType: 'motion' }
          : { animIds: VISIBILITY_ANIMS_ID, animType: 'visibility' };

      for (const [name, id] of Object.entries(animIds)) {
        handlers[name] = (element, opts = {}) => {
          const {
            widthTransition = false,
            heightTransition = false,
            hide = true,
            resetAfter = true,
          } = opts;
          let action = opts.action ?? verb;
          if (
            (action !== verb &&
              action === 'move' &&
              MOTION_ANIMS_ID[name] === undefined) ||
            (['show', 'hide'].includes(action) &&
              VISIBILITY_ANIMS_ID[name] === undefined)
          ) {
            action = verb;
          }
          updateCssProperties(element, opts);
          animate(animType, element, action, id, {
            widthTransition,
            heightTransition,
            hide,
            resetAfter,
          });
        };
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
        animations[animName] = opts => init(animIds[animName], opts, animType);
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
  const animationsHandler = Object.freeze({
    init: eventAnimations,
    ...animationFunctions,
  });

  return new Proxy(animationsHandler, verifyAnimationName);
})();

export default jsCssAnimations;
