const findCornerClass = element =>
  [...element.classList].find(c => c.match(/top|bottom|right|left/));

const resetPixelsClasses = element => {
  const corner = findCornerClass(element);

  element.setAttribute('class', 'pixel');
  if (corner) element.classList.add(corner);
};

const cancelEvent = event => (event.target.onpointerenter = '');

const setColorBg = event => {
  resetPixelsClasses(event.target);
  event.target.classList.add(
    `bg-${document
      .getElementById('color-picker')
      .getAttribute('current-color')}`
  );
};

const setRandomBg = event => {
  resetPixelsClasses(event.target);

  event.target.classList.add('random-bg');
  event.target.style.setProperty('--h-value', Math.round(Math.random() * 300));
};

const resetBg = event => resetPixelsClasses(event.target);

const setGradientBg = event => {
  resetPixelsClasses(event.target);

  let mode;
  if (document.getElementById('progressive-darkening-mode').checked) {
    mode = 'darkening-bg';
  } else if (document.getElementById('progressive-lighten-mode').checked) {
    mode = 'lighten-bg';
  }
  event.target.classList.add(mode);

  const currentColor = document
    .getElementById('color-picker')
    .getAttribute('current-color');

  const startValue = mode === 'darkening-bg' ? 100 : 0;
  const stopValue = mode === 'darkening-bg' ? 0 : 100;

  let hValue;
  let sValue = 96;
  const lValue =
    parseInt(event.target.style.getPropertyValue('--l-value')) || startValue;

  if (currentColor === 'black') {
    hValue = 0;
    sValue = 0;
  } else {
    hValue = currentColor;
  }

  if (lValue !== stopValue) {
    let newValue;
    if (mode === 'darkening-bg') {
      newValue = lValue >= 10 ? lValue - 10 : stopValue;
    } else if (mode === 'lighten-bg') {
      newValue = lValue < 90 ? lValue + 10 : stopValue;
    }

    event.target.style.setProperty('--h-value', `${hValue}`);
    event.target.style.setProperty('--s-value', `${sValue}%`);
    event.target.style.setProperty('--l-value', `${newValue}%`);
    if (newValue === stopValue) cancelEvent(event);
  }
};

export { setColorBg, setRandomBg, setGradientBg, resetBg };
