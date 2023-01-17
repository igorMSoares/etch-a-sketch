import displayMessage from './message.js';
import { showColorPicker } from './color-picker.js';
import { Brush } from './brush.js';
import isMobile from './is-mobile.js';
import { renderCanvas } from './render-canvas.js';

export const resetCanvas = async () => {
  const inputField = document.getElementById('number-of-columns');
  const columns = parseInt(inputField.value);

  if (!columns) {
    inputField.setAttribute('placeholder', '');
    inputField.classList.add('red-bg');

    setTimeout(() => {
      inputField.classList.remove('red-bg');
      inputField.setAttribute('placeholder', '...');
    }, 200);
  } else if (columns <= 1) {
    inputField.value = '';
    displayMessage('Type in a positive number greater than 1');
  } else if (columns > 100) {
    inputField.value = '';
    displayMessage('Choose a number less than or equal to 100');
  } else {
    document.querySelectorAll('.color-mode-selector').forEach(box => {
      box.checked = false;
      box.nextElementSibling.ariaChecked = false;
      box.disabled = false;
      box.nextElementSibling.classList.remove('disabled-cbox');
      showColorPicker();
    });

    Brush.mode = 'brush';
    if (!isMobile()) Brush.state = 'off';
    canvas.style.removeProperty('height');
    canvas.style.removeProperty('width');
    renderCanvas(columns);
    Brush.mode = 'brush';
  }
};
