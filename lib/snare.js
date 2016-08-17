const Drum = require('./drum');
const Util = require('./util');

const Snare = function(options = {}){
  options.duration = 0.5;
  Drum.call(this, options);
};

Util.inherits(Snare, Drum);

Snare.prototype.attack = function() {

  this.noise = this.generateNoise();
  let highPassFilter = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq:800
  });
  this.envelope = this.generateEnvelope();
  
  //construct audio graph
  this.noise.connect(highPassFilter);
  highPassFilter.connect(this.envelope);
  this.envelope.connect(this.context.destination);
  
  this.noise.start();
};

Snare.prototype.release = function() {
  this.envelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
  
  this.noise.stop(this.context.currentTime + this.duration);
};

module.exports = Snare;
