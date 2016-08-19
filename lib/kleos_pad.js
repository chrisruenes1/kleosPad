const Sequencer = require('./sequencer');
const Visualizer = require('./visualizer');




document.addEventListener("DOMContentLoaded", () => {
  let ctx = document.getElementById("pad").getContext('2d');
  let sequencer = new Sequencer();
  let visualizer = new Visualizer(sequencer, pad);
  sequencer.sequence({patternName: "heartless"});
});
