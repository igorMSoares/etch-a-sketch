/**
 * Handle element's width and height calculations
 * so that, when an element's visibility changes,
 * parent element's dimensions can be properly transitioned
 * @module measurements
 */

/**
 * Throws a ReferenceError if 'dimension' is neither 'width' nor 'height'
 * @param {string} dimension - Either 'width' or 'height'
 */
const validateDimension = dimension => {
  if (dimension !== 'height' && dimension !== 'width') {
    throw new ReferenceError(
      `Invalid dimension: ${dimension}. Use 'height' or 'width'`
    );
  }
};

/**
 * Returns only the numeric part of the margin property
 * @param {string} margin - Margin value along with its unit
 * @returns Margin value without unit
 */
const getMarginNumericValue = margin => {
  return +(margin.match(/[\d.]+/) ?? 0);
};

/**
 * Calculates the total margin of an element in the vertical axis
 * @param {string[]} margins - Array containing an element's margin values
 * @param {number} arrLength - Number of values declared in the CSS margin property
 * @returns The sum of top-margin and bottom-margin
 */
const getVertMargin = (margins, arrLength) => {
  let marginSize = 0;
  if ((arrLength === 1 || arrLength === 2) && margins[0] !== '0px') {
    marginSize = 2 * getMarginNumericValue(margins[0]);
  } else if (arrLength === 3 || arrLength === 4) {
    marginSize = getMarginNumericValue(margins[0]);
    marginSize += getMarginNumericValue(margins[2]);
  }

  return marginSize;
};

/**
 * Calculates the total margin of an element in the horizontal axis
 * @param {string[]} margins - Array containing an element's margin values
 * @param {number} arrLength - Number of values declared in the CSS margin property
 * @returns The sum of left-margin and right-margin
 */
const getHorizMargin = (margins, arrLength) => {
  let marginSize = 0;
  if (arrLength === 2 || arrLength === 3) {
    marginSize = 2 * getMarginNumericValue(margins[1]);
  } else if (arrLength === 4) {
    marginSize = getMarginNumericValue(margins[1]);
    marginSize += getMarginNumericValue(margins[3]);
  }

  return marginSize;
};

/**
 * Element's total margin in a given axis
 * @param {HTMLElement} element - The DOM element to calculate margins from
 * @param {string} axis - 'horizontal' or 'vertical' margins
 * @returns {number} Total margin in a given axis
 */
const getElementMargins = (element, axis) => {
  const calcMargins = {
    horizontal: getHorizMargin,
    vertical: getVertMargin,
  };
  if (!(axis in calcMargins))
    throw new ReferenceError(`
    Invalid axis: ${axis}. Should be either 'horizontal' or 'vertical'
  `);

  const margins = getComputedStyle(element).margin.split(' ');
  const arrLength = margins.length;

  return calcMargins[axis](margins, arrLength);
};

/**
 * Calculates the total width or height of an element
 * @param {HTMLElement} element - The Dom element to measure
 * @param {string} dimension - Either 'width' or 'height'
 * @returns The total dimension of an element, including its margins
 */
const getElementMeasure = (element, dimension) => {
  validateDimension(dimension);

  element.style.setProperty(
    'display',
    getComputedStyle(element).display === 'none' ? 'block' : ''
  );

  const measure =
    dimension === 'height' ? element.offsetHeight : element.offsetWidth;

  element.style.removeProperty('display');

  return (
    measure +
    getElementMargins(
      element,
      dimension === 'height' ? 'vertical' : 'horizontal'
    )
  );
};

/**
 * Calculates the element's parent dimension before and after 'element' is set to 'display: none'
 * @param {HTMLElement} element - The DOM element from which the parent will be measured
 * @param {string} dimension - Either 'width' or 'height'
 * @returns An object containing the parent element's dimension before and after the child element is set to 'display: none'
 */
const getParentMeasure = (element, dimension) => {
  validateDimension(dimension);

  const measure = {};
  const parent = element.parentElement;

  /** parent measurement before setting child to display: none */
  measure.before =
    dimension === 'height'
      ? parent?.offsetHeight ?? 0
      : parent?.offsetWidth ?? 0;
  if (getComputedStyle(element).display === 'none') {
    measure.before += getElementMeasure(element, dimension);
  }

  element.style.setProperty('display', 'none');
  /** parent measurement after setting child to display: none */
  measure.after =
    dimension === 'height'
      ? parent?.offsetHeight ?? 0
      : parent?.offsetWidth ?? 0;
  element.style.removeProperty('display');

  return measure;
};

/**
 * Calculates the width and height of an element's parent,
 * before and after the element is set to 'display: none'
 * @param {HTMLElement} element - The DOM element to get the parent's measurements from
 * @returns An object with the width and height of the parent element
 */
const getParentMeasures = element => {
  return {
    height: getParentMeasure(element, 'height'),
    width: getParentMeasure(element, 'width'),
  };
};

/** Tracks whether the parent's element measurement should be before or after the element is set to 'display: none' */
const measured = {
  hide: { initial: 'before', final: 'after' },
  show: { initial: 'after', final: 'before' },
};

/**
 * Sets the element's 'max-width' or 'max-height' CSS property
 * @param {HTMLElement|null} element - The DOM element to set max-width or max-height value
 * @param {string} dimension - Either 'width' or 'height'
 * @param {string} value - The CSS property value, in pixels
 */
const setDimensionMax = (element, dimension, value) => {
  validateDimension(dimension);
  if (!element) throw new ReferenceError('element is null');
  element.style.setProperty(`max-${dimension}`, value);
};

/**
 * Removes the element's 'max-width' or 'max-height' CSS property
 * @param {HTMLElement|null} element - The DOM element to set max-width or max-height value
 * @param {string} dimension - Either 'width' or 'height'
 */
const removeDimensionMax = (element, dimension) => {
  validateDimension(dimension);
  if (!element) throw new ReferenceError('element is null');
  element.style.removeProperty(`max-${dimension}`);
};

/**
 * @typedef {Object} DimensionsMeasurements
 * @property {{before: number, after: number}} height - Element's height before and after child element is set to 'display: none'
 * @property {{before: number, after: number}} width - Element's width before and after child element is set to 'display: none'
 */
/**
 * Sets element's parent's 'max-width' or 'max-height' property.
 *
 * If 'dimension' is undefined or different from 'all', 'width' or 'height',
 * no property will be set.
 * @param {{parentState: string, element: HTMLElement, parentMeasures: DimensionsMeasurements, action: string, dimension: string|undefined}} args - Object containing all the information needed
 */
const setParentMaxMeasures = args => {
  const {
    parentState = 'initial',
    element,
    parentMeasures,
    action,
    dimension,
  } = args;
  if (!dimension) return;

  if (dimension === 'all') {
    setDimensionMax(
      element.parentElement,
      'height',
      `${parentMeasures.height[measured[action][parentState]]}px`
    );
    setDimensionMax(
      element.parentElement,
      'width',
      `${parentMeasures.width[measured[action][parentState]]}px`
    );
  } else {
    setDimensionMax(
      element.parentElement,
      dimension,
      `${parentMeasures.width[measured[action][parentState]]}px`
    );
  }
};

export { getParentMeasures, setParentMaxMeasures, removeDimensionMax };
