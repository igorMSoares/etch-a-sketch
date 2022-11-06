const validateDimension = dimension => {
  if (dimension !== 'height' && dimension !== 'width') {
    throw new ReferenceError(
      `Invalid dimension: ${dimension}. Use 'height' or 'width'`
    );
  }
};

const getMarginNumericValue = margin => {
  return +margin.match(/[\d.]+/);
};

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

const getElementMargins = (element, axis) => {
  const calcMargins = {
    horizontal: getHorizMargin,
    vertical: getVertMargin,
  };

  const margins = getComputedStyle(element).margin.split(' ');
  const arrLength = margins.length;

  return calcMargins[axis](margins, arrLength);
};

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

const getParentMeasure = (elem, dimension) => {
  validateDimension(dimension);

  const measure = {};
  const parent = elem.parentElement;

  /** parent measurement before setting child to display: none */
  measure.before =
    dimension === 'height' ? parent.offsetHeight : parent.offsetWidth;
  if (getComputedStyle(elem).display === 'none') {
    measure.before += getElementMeasure(elem, dimension);
  }

  elem.style.setProperty('display', 'none');
  /** parent measurement after setting child to display: none */
  measure.after =
    dimension === 'height' ? parent.offsetHeight : parent.offsetWidth;
  elem.style.removeProperty('display');

  return measure;
};

const getParentMeasures = elem => {
  return {
    height: getParentMeasure(elem, 'height'),
    width: getParentMeasure(elem, 'width'),
  };
};

const measured = {
  hide: { initial: 'before', final: 'after' },
  show: { initial: 'after', final: 'before' },
};

const setDimensionMax = (elem, dimension, value) =>
  elem.style.setProperty(`max-${dimension}`, value);

const removeDimensionMax = (elem, dimension) =>
  elem.style.removeProperty(`max-${dimension}`);

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
