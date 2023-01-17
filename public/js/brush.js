export const Brush = (function () {
  let type = 'brush';
  const toggle = {
    brush: 'eraser',
    eraser: 'brush',
  };

  const setCanvasTitleAttr = () => {
    const action = type === 'brush' ? 'coloring' : 'erasing';
    canvas.setAttribute('title', `Click to start ${action}`);
  };

  return {
    isOn: false,
    set state(state) {
      if (state === 'on') {
        this.isOn = true;
        canvas.classList.add(type);
        canvas.classList.remove(toggle[type]);
        canvas.removeAttribute('title');
      } else if (state === 'off') {
        this.isOn = false;
        canvas.classList.remove(type);
        setCanvasTitleAttr();
      }
    },
    set mode(mode) {
      type = mode;
      canvas.classList.remove(toggle[type]);
      if (this.isOn) canvas.classList.add(type);
      setCanvasTitleAttr();
    },
  };
})();
