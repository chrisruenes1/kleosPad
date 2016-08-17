const Kick = require('./kick');
const Snare = require('./snare');

let kick = new Kick();
let snare = new Snare();

window.setInterval( () => {
  kick.play();
}, 400);

window.setTimeout(() => {
  window.setInterval( () => {
    snare.play();
  }, 400);
}, 200);
