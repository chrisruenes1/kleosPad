const Sequencer = require('./sequencer');
const Visualizer = require('./visualizer');




document.addEventListener("DOMContentLoaded", () => {
  let canvas = document.getElementById("pad");
  let sequencer = new Sequencer();
  let visualizer = new Visualizer(sequencer, canvas);
  sequencer.sequence({patternName: "heartless"});
});
