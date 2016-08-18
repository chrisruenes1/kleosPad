const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Patterns = require('./patterns');

const Sequencer = function(){
  
  this.kick = new Kick();
  this.snare = new Snare();
  this.hiHat = new HiHat();
  this.ride = newRide();
  
  this.tempo = 125;
  
  this.pattern = Patters.goingHome;
  
  this.playQueue = [];
  
  const INSTRUMENTS = {
    "kick": this.kick,
    "snare": this.snare,
    "hiHat": this.hiHat,
    "ride": this.ride
  };
    
};

Sequencer.prototype.testScope = function(){
  testScope();
};

const testScope = () => {
  console.log(this.tempo);
};

module.exports = Sequencer;
