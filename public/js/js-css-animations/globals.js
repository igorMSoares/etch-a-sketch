export const VISIBILITY_ANIMS_ID = Object.freeze({
  collapse: 0,
  slideUp: 1,
  slideDown: 2,
  slideLeft: 3,
  slideRight: 4,
  fade: 5,
});

export const MOTION_ANIMS_ID = Object.freeze({
  rotateUp: 0,
  rotateUpCCW: 1,
  rotateRight: 2,
  rotateRightCCW: 3,
  rotateDown: 4,
  rotateDownCCW: 5,
  rotateLeft: 6,
  rotateLeftCCW: 7,
});

export const PROPERTY_NAMES = Object.freeze({
  duration: '--js-css-animation--duration',
  timingFunction: '--js-css-animation--timing-function',
  delay: '--js-css-animation--delay',
  fillMode: '--js-css-animation--fill-mode',
  cursor: '--js-css-animation--cursor',
  blur: '--js-css-animation--blur',
  rotationDeg: '--js-css-animation--rotation-deg',
});

export const CLASS_NAMES = Object.freeze({
  dimensionsTransitions: 'js-anim--dimensions-transitions',
  heightTransition: 'js-anim--height-transition',
  widthTransition: 'js-anim--width-transition',
  toggleBtn: 'js-anim--toggle-btn',
  btnCursor: 'js-anim--btn-cursor',
  collapsed: 'js-anim--collapsed',
  hidden: 'js-anim--hidden',
  rotated: 'js-anim--rotated',
  hide: [
    'js-anim--collapse',
    'js-anim--slide-up',
    'js-anim--slide-down',
    'js-anim--slide-left',
    'js-anim--slide-right',
    'js-anim--fade-out',
  ],
  show: [
    'js-anim--expand',
    'js-anim--slide-up__back',
    'js-anim--slide-down__back',
    'js-anim--slide-left__back',
    'js-anim--slide-right__back',
    'js-anim--fade-in',
  ],
  move: [
    'js-anim--rotate-up',
    'js-anim--rotate-up__ccw',
    'js-anim--rotate-right',
    'js-anim--rotate-right__ccw',
    'js-anim--rotate-down',
    'js-anim--rotate-down__ccw',
    'js-anim--rotate-left',
    'js-anim--rotate-left__ccw',
  ],
  moveBack: [
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
    'js-anim--rotate-up',
  ],
});

export const CUSTOM_CSS_PROPERTIES = Object.freeze(
  Object.keys(PROPERTY_NAMES).filter(k => k !== 'cursor')
);
