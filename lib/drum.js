const Drum = function(options){
  this.context = new AudioContext();
  this.duration = options.duration;
  // this.decay = options.decay;
  this.frequency = options.frequency;
};


Drum.prototype.generateEnvelope = function(gainValue = 1){
  let envelope = this.context.createGain();
  envelope.gain.setValueAtTime(gainValue, this.context.currentTime);
  return envelope;
};

Drum.prototype.generateBiquadFilter = function(options){
  let filter = this.context.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.cutoffFreq;
  return filter;
};

Drum.prototype.generateOscillator = function(frequency = this.frequency){
  let oscillator = this.context.createOscillator();
  oscillator.frequency.value = frequency;
  return oscillator;
};

Drum.prototype.generateNoise = function(){
  let bufferSize = this.context.sampleRate;
  let buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
  let output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  let noise = this.context.createBufferSource();
  noise.buffer = buffer;
    
  return noise;
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
