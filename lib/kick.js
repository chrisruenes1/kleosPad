const Drum = require('./drum');
const Util = require('./util');

const Kick = function (options = {}){
  options.name = "kick";
  
  options.frequency = 150;
  options.duration = 0.5;
  
  options.colors = {
    clean: "rgb(204, 178, 183)",
    saturated: "rgb(110, 2, 21, 1)",
    unsaturated: "rgb(255, 192, 203, 1)"
  };
  
  Drum.call(this, options);
};

Util.inherits(Kick, Drum);

Kick.prototype.attack = function(startTime, filterNodes){
  
  this.playing = true;
  this.oscillator= this.generateOscillator();
  this.envelope = this.generateEnvelope();
  
  this.buildAudioGraph(filterNodes, this.oscillator, this.envelope);
  
  let when = startTime > this.currentTime() ?
  startTime - this.currentTime() :
  0;
  
  this.oscillator.start(when);
  
};

Kick.prototype.release = function(){
  let time = this.currentTime();
  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
  
  this.oscillator.stop(time + this.duration);
  this.oscillator.onended = () => {
    this.playing = false;
  };
  
};



module.exports = Kick;
