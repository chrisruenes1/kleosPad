const WebAudioContext = require('./web_audio_context');

const Drum = function(options){
  this.name = options.name;
  
  this.audioContext = WebAudioContext.getContext();
  
  this.duration = options.duration;
  this.frequency = options.frequency;
  
  this.colors = options.colors;
  this.pos = null;
  this.playing = false;
};

Drum.prototype.generateEnvelope = function(gainValue = 0.5){
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
  
  //first we need a muted version of the synthesis to go to the output. If the nodes connecting to the output
  //are disconnected between start and stop of note, the severed graph will not be able to end the note
  
  this.silentEnvelope = this.generateEnvelope(0);
  this.silentEnvelope.connect(this.audioContext.destination);
  let last = synthesisNodes.length - 1;
  synthesisNodes[last].connect(this.silentEnvelope);
  
  //next, add the sequential filters
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
