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
  setCssProperty,
  removeCustomCssProperties,
} from './js-css-animations.js';

const getRootCssProperty = property => {
  return getComputedStyle(document.documentElement).getPropertyValue(
    PROPERTY_NAMES[property]
  );
};

const setParentCssProperties = element => {
  let currentProp;
  CUSTOM_CSS_PROPERTIES.forEach(prop => {
    currentProp = getComputedStyle(element).getPropertyValue(
      PROPERTY_NAMES[prop]
    );

    if (currentProp !== getRootCssProperty(prop)) {
      setCssProperty(element.parentElement, prop, currentProp);
    }
  });
};

const getDimension = (wTransit, hTransit) => {
  let dimension;
  if (wTransit && hTransit) dimension = 'all';
  else if (wTransit) dimension = 'width';
  else if (hTransit) dimension = 'height';
  return dimension;
};

const setOverflowHidden = el => {
  el.style.setProperty('overflow', 'hidden');
};

const removeOverflowHidden = el => {
  el.style.removeProperty('overflow');
};

const initParentTransitions = args => {
  const { element, action, widthTransition, heightTransition } = args;
  const parentMeasures = getParentMeasures(element);
  const dimension = getDimension(widthTransition, heightTransition);
  setParentCssProperties(element);
  if (args.overflowHidden) setOverflowHidden(element.parentElement);
  setParentMaxMeasures({
    element,
    parentMeasures,
    action,
    dimension,
  });
  return { parentMeasures, dimension };
};

const handleVisibilityToggle = (element, args) => {
  setParentMaxMeasures(args);
  if (args.action === 'show') {
    args.hide
      ? element.classList.remove(CLASS_NAMES.hidden)
      : element.classList.remove(CLASS_NAMES.collapsed);
  }
};

const endVisibilityToggle = (element, action, hide) => {
  if (action === 'hide') {
    hide
      ? element.classList.add(CLASS_NAMES.hidden)
      : element.classList.add(CLASS_NAMES.collapsed);
  }
  removeDimensionMax(element.parentElement, 'height');
  removeDimensionMax(element.parentElement, 'width');
  removeCustomCssProperties(element.parentElement);
  removeOverflowHidden(element.parentElement);
};

export { initParentTransitions, handleVisibilityToggle, endVisibilityToggle };
