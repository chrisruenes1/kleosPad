const Drum = require('./drum');
const Util = require('./util');

const Kick = function (options = {}){
  options.name = "kick";
  
  options.frequency = 150;
  options.duration = 0.5;
  
  options.color = "blue";
  
  Drum.call(this, options);
};

Util.inherits(Kick, Drum);

Kick.prototype.attack = function(startTime){
  
  this.playing = true;
  this.envelope = this.generateEnvelope();
  this.oscillator= this.generateOscillator();
  
  //construct audio graph
  this.oscillator.connect(this.envelope);
  this.envelope.connect(this.context.destination);
  
  this.oscillator.start(startTime);
  
};

Kick.prototype.release = function(time){
  
  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.stop(time + this.duration);
  this.oscillator.onended = () => {
    this.playing = false;
  };
};



module.exports = Kick;
