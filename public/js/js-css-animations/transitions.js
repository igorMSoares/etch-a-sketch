import { CLASS_NAMES } from './globals.js';

const getAllTransitions = cssProperties => {
  const transitions = {
    property: [],
    duration: [],
    timingFunction: [],
    delay: [],
  };
  let allTransitions = '';
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

  properties.reverse().forEach(prop => {
    transitions.property.push(prop);
    transitions.duration.push(
      duration.pop() ?? transitions.duration.at(-1) ?? '0s'
    );
    transitions.timingFunction.push(
      timingFunction.pop() ?? transitions.timingFunction.at(-1) ?? ''
    );
    transitions.delay.push(delay.pop() ?? transitions.delay.at(-1)) ?? '0s';
  });

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

export const getCurrentTransition = element => {
  let currTransition = getComputedStyle(element).transition;
  if (currTransition !== getDefaultComputedStyle(element).transition) {
    if (currTransition === '') {
      currTransition = getAllTransitions(getComputedStyle(element));
    }
  } else {
    currTransition = '';
  }
  return currTransition;
};

export const getClassTransition = className => {
  const css = [
    ...[...document.styleSheets].find(ss => ss.href.match(/js-animations\.css/))
      .cssRules,
  ].find(r => r.cssText.match(`\\.${className}`));
  if (css.style.transition === '') {
    return getAllTransitions(css.style);
  }
  return css.style.transition;
};

export const appendTransition = (element, className, currTransition) => {
  const classTransition = getClassTransition(className);

  if (classTransition) {
    element.style.setProperty(
      'transition',
      currTransition.match(/transform|max\-width|max\-height/)
        ? `${currTransition}`
        : `${classTransition}, ${currTransition}`
    );
  }
};

export const setDimensionsTransitions = (element, wTransit, hTransit) => {
  const currTransition = getCurrentTransition(element);
  let className;

  if (wTransit && hTransit) {
    className = CLASS_NAMES.dimensionsTransitions;
  } else if (wTransit) {
    className = CLASS_NAMES.widthTransition;
  } else if (hTransit) {
    className = CLASS_NAMES.heightTransition;
  }

  if (className) {
    element.classList.add(className);
    if (currTransition) appendTransition(element, className, currTransition);
  }
};
