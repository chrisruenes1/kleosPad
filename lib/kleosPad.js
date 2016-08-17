const Kick = require('./kick');

let kick = new Kick();

window.setInterval(() => {
  kick.play();
}, 400);
