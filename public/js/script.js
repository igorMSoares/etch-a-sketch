const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');

const resetClasses = element => {
  element.setAttribute('class', 'pixel');
};

const setBlackBg = event => {
  event.target.classList.add('black-bg');
  event.target.onmouseenter = '';
};

const setRandomBg = event => {
  event.target.classList.add('change-bg-color');
  event.target.style.setProperty('--h-value', Math.random() * 300);
  event.target.style.setProperty('--l-value', '46%');
  event.target.onmouseenter = '';
};

const setDarkeningBg = event => {
  event.target.classList.add('change-bg-color');
  event.target.style.setProperty('--h-value', '96');

  const lValue = parseInt(
    window.getComputedStyle(event.target).getPropertyValue('--l-value')
  );

  if (lValue !== 0) {
    event.target.style.setProperty(
      '--l-value',
      `${lValue >= 10 ? lValue - 10 : 0}%`
    );
  }
};

const renderCanvas = squaresPerRow => {
  canvas.innerHTML = '';
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;

  let size = Math.round(canvasWidth / squaresPerRow) - 1;

  root.style.setProperty('--square-size', `${size}px`);
  root.style.setProperty('--squares-per-row', `${squaresPerRow}`);

  let div;
  for (let i = 0; i < squaresPerRow * Math.floor(canvasHeight / size); i++) {
    div = document.createElement('div');
    div.setAttribute('id', i);
    div.classList.add('pixel');
    div.onmouseenter = setBlackBg;
    canvas.appendChild(div);
  }

  document
    .getElementById('number-of-columns')
    .setAttribute('value', squaresPerRow);
};

const resetCanvas = () => {
  const inputField = document.getElementById('number-of-columns');
  const columns = parseInt(document.getElementById('number-of-columns').value);
  if (!columns || columns <= 0) {
    console.log('erro');
  } else if (columns > 100) {
    inputField.value = '';
    inputField.setAttribute('placeholder', 'Number > 100 not allowed');
  } else {
    document
      .querySelectorAll('input[type="checkbox"]')
      .forEach(box => (box.checked = false));
    renderCanvas(columns);
  }
};

document.getElementById('reset-canvas-btn').onclick = resetCanvas;
document.getElementById('number-of-columns').onchange = resetCanvas;
document.getElementById('number-of-columns').onkeyup = e => {
  if (e.key === 'Enter') resetCanvas();
};

document.getElementById('random-color-mode').onchange = e => {
  let eventHandler;
  if (e.target.checked) {
    document.getElementById('progressive-darkening-mode').disabled = true;
    eventHandler = setRandomBg;
  } else {
    document.getElementById('progressive-darkening-mode').disabled = false;
    eventHandler = setBlackBg;
  }
  document.querySelectorAll('.pixel').forEach(square => {
    resetClasses(square);
    square.onmouseenter = eventHandler;
  });
};

document.getElementById('progressive-darkening-mode').onchange = e => {
  let eventHandler;
  if (e.target.checked) {
    document.getElementById('random-color-mode').disabled = true;
    eventHandler = setDarkeningBg;
  } else {
    document.getElementById('random-color-mode').disabled = false;
    eventHandler = setDarkeningBg;
    eventHandler = setBlackBg;
  }
  document.querySelectorAll('.pixel').forEach(square => {
    resetClasses(square);
    square.onmouseenter = eventHandler;
  });
};
renderCanvas(30);
