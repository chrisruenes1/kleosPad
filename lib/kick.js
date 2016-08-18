const Drum = require('./drum');
const Util = require('./util');

const Kick = function (options = {}){
  options.frequency = 150;
  options.duration = 0.5;
  Drum.call(this, options);
};

Util.inherits(Kick, Drum);

Kick.prototype.attack = function(time){
  this.envelope = this.generateEnvelope();
  this.oscillator= this.generateOscillator();
  
  //construct audio graph
  this.oscillator.connect(this.envelope);
  this.envelope.connect(this.context.destination);
  
  this.oscillator.start(time);
};

Kick.prototype.release = function(time){
  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.stop(time + this.duration);
};

module.exports = Kick;
