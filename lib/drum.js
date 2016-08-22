const WebAudioContext = require('./web_audio_context');

const Drum = function(options){
  this.name = options.name;
  
  this.audioContext = WebAudioContext.getContext();
  
  this.duration = options.duration;
  this.frequency = options.frequency;
  
  this.color = options.color;
  this.pos = null;
  this.playing = false;
};

Drum.prototype.generateEnvelope = function(gainValue = 1){
  let envelope = this.audioContext.createGain();
  envelope.gain.setValueAtTime(gainValue, this.currentTime());
  return envelope;
};

Drum.prototype.generateBiquadFilter = function(options){
  let filter = this.audioContext.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.cutoffFreq;
  return filter;
};

Drum.prototype.generateOscillator = function(frequency = this.frequency){
  let oscillator = this.audioContext.createOscillator();
  oscillator.frequency.value = frequency;
  return oscillator;
};

Drum.prototype.generateNoise = function(){
  let bufferSize = this.audioContext.sampleRate;
  let buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
  let output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  let noise = this.audioContext.createBufferSource();
  noise.buffer = buffer;
    
  return noise;
};

Drum.prototype.buildAudioGraph = function(filters, ...synthesisNodes){
  //separate the filters first
  let sequentialFilterNodes = [];
  let adjacentFilterNodes = [];
  
  filters.forEach( (filter) => {
    if (filter.splitAudioGraph){
      adjacentFilterNodes.push(filter.node);
    }
    else {
      sequentialFilterNodes.push(filter.node);
    }
  });
  
  this.lastProcessedNode = null;
  
  let graphNodes = synthesisNodes.concat(sequentialFilterNodes); //connect synthesis and sequential filter nodes
  
  graphNodes.forEach( (node, idx, arr) => {
    if (idx === arr.length - 1){
      node.connect(this.audioContext.destination);
      this.lastProcessedNode = node;
    }
    else {
      node.connect(arr[idx + 1]);
    }
  });
  //split processed signal at any adjacent filter, creating multiple simultaneous signals
  adjacentFilterNodes.forEach( (node) => {
    this.lastProcessedNode.connect(node);
    node.connect(this.audioContext.destination);
  });
};

Drum.prototype.play = function(time, filterNodes){
    this.attack(time, filterNodes);
    this.release();
  
};

Drum.prototype.currentTime = function(){
  return this.audioContext.currentTime;
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
