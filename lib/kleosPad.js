const Drum = require('./drum');

let drum = new Drum({
  frequency:1000
});
drum.play();
window.setTimeout(() => {
  drum.deaden();
}, 1000);
