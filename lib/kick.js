const Drum = require('./drum');
const Util = require('./util');

const Kick = function (options = {}){
  options.frequency = 150;
  options.duration = 0.5;
  Drum.call(this, options);
};

Util.inherits(Kick, Drum);

Kick.prototype.attack = function(){
  this.envelope = this.generateEnvelope();
  this.oscillator= this.generateOscillator();
  
  this.envelope.connect(this.context.destination);
  this.oscillator.connect(this.envelope);
  
  this.oscillator.start();
};

Kick.prototype.release = function(){

  this.envelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
  
  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
  
  this.oscillator.stop(this.context.currentTime + this.duration);
};

module.exports = Kick;
