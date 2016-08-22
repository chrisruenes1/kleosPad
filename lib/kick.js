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

Kick.prototype.attack = function(startTime, filterNodes){
  
  this.playing = true;
  this.oscillator= this.generateOscillator();
  this.envelope = this.generateEnvelope();
  
  this.buildAudioGraph(filterNodes, this.oscillator, this.envelope);
  
  let when = startTime > this.currentTime() ?
  startTime - this.currentTime() :
  0;
  
  console.log("going to kick in " + when + " seconds");
  
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
