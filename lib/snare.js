const Drum = require('./drum');
const Util = require('./util');

const Snare = function(options){
  Drum.call(this, options);
};

Util.inherits(Snare, Drum);

Snare.prototype.noiseBuffer = function() {
  
  //create white noise buffer to mimic wire snare sound
  
  let bufferSize = this.context.sampleRate;
  let buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate); //# of channels, sample length, sampleRate
  let output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  let noise = this.context.createBufferSource();
  noise.buffer = buffer;
  
  //filter the white noise through a hi pass
  
  let hiPass = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq:1000
  });
  
  this.noise.connect(hiPass);
  
  return buffer;
};

module.exports = Snare;
