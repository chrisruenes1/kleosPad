const WebAudioContext = require('./web_audio_context');

const Drum = function(options){
  this.name = options.name;
  
  this.context = WebAudioContext.getContext();
  this.duration = options.duration;
  this.frequency = options.frequency;
  
  this.color = options.color;
  this.pos = null;
  this.playing = false;
};

Drum.prototype.generateEnvelope = function(gainValue = 1){
  let envelope = this.context.createGain();
  envelope.gain.setValueAtTime(gainValue, this.currentTime());
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

Drum.prototype.buildAudioGraph = function(filterNodes, ...synthesisNodes){
  //generate effects signal
  let graphNodes = synthesisNodes.concat(filterNodes);
  graphNodes.forEach( (node, idx, arr) => {
    if (idx === arr.length - 1){
      node.connect(this.context.destination);
      
    }
    else {
      node.connect(arr[idx + 1]);
    }
  });
  
  // generate dry signal, at 0.5 volume, only if effects are being passed currently
  if (filterNodes.length > 0){
    synthesisNodes.forEach( (node, idx, arr) => {
      if (idx === arr.length -1){
        let gain = this.generateEnvelope(0.1);
        node.connect(gain);
        gain.connect(this.context.destination);
      }
      else {
        node.connect(arr[idx + 1]);
      }
    });
  }
  
};

Drum.prototype.play = function(time, filterNodes){
  startTime = time - this.currentTime();
  
  if (startTime < this.currentTime()){ //in case we navigate away and current time keeps counting but time resets
    startTime = this.currentTime();
  }
  
  this.attack(startTime, filterNodes);
  this.release(startTime);
};

Drum.prototype.currentTime = function(){
  return this.context.currentTime;
};

Drum.prototype.attack = function(){
  //implemented by subclasses
};

Drum.prototype.release = function(){
  //implemented by subclasses
};

//visual aspects

Drum.prototype.setPos = function(pos){
  this.pos = pos;
};


module.exports = Drum;
