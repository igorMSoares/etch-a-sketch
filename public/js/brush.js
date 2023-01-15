const brush = (function () {
  let instance;

  function init() {
    this.brush = {
      isOn: false,
      type: 'brush',
      set state(state) {
        if (state === 'on') {
          this.isOn = true;
          canvas.classList.add(this.type);
          canvas.classList.remove(this.toggle[this.type]);
          canvas.removeAttribute('title');
        } else if (state === 'off') {
          this.isOn = false;
          canvas.classList.remove(this.type);
          this.setCanvasTitleAttr();
        }
      },
      set mode(mode) {
        this.type = mode;
        canvas.classList.remove(this.toggle[this.type]);
        if (this.isOn) canvas.classList.add(this.type);
        this.setCanvasTitleAttr();
      },
      toggle: {
        brush: 'eraser',
        eraser: 'brush',
      },
      setCanvasTitleAttr() {
        const action = this.type === 'brush' ? 'coloring' : 'erasing';
        canvas.setAttribute('title', `Click to start ${action}`);
      },
    };
  }

  return function () {
    if (!instance) instance = new init();
    return instance.brush;
  };
})();

export default brush();
