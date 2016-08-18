const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Sequencer = require('./sequencer');


let kick = new Kick();
let snare = new Snare();
let hiHat = new HiHat();
let ride = new Ride();
let sequencer = new Sequencer();



const playSample = function(){
  window.setInterval( () => {
    kick.play();
  }, 800);

  window.setTimeout(() => {
    window.setInterval( () => {
      snare.play();
    }, 800);
  }, 400);

  window.setInterval( () => {
    hiHat.play();
  }, 200);


  window.setInterval( () => {
    ride.play();
  }, 1600/3);

};
//
// // playSample();
sequencer.sequence({patternName: "heartless"});
// sequencer.sequence({patternName: "goingHome"});
