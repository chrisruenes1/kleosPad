const Drum = function(options){
  this.context = new AudioContext();
  this.duration = options.duration;
  this.decay = options.decay;
  this.frequency = options.frequency;
};


Drum.prototype.generateEnvelope = function(){
  let envelope = this.context.createGain();
  envelope.gain.setValueAtTime(1, this.context.currentTime);
  return envelope;
};

Drum.prototype.generateBiquadFilter = function(options){
  let filter = this.context.createBiquadFilter();
  noiseFilter.type = options.type;
  noiseFilter.frequency.value = options.cutoffFreq;
  return filter;
};

Drum.prototype.generateOscillator = function(){
  let oscillator = this.context.createOscillator();
  oscillator.frequency = this.frequency;
  return oscillator;
};

Drum.prototype.play = function(){
  this.attack();
  this.release();
};

Drum.prototype.attack = function(){
  //implemented by subclasses
};

Drum.prototype.release = function(){
  //implemented by subclasses
};

module.exports = Drum;
