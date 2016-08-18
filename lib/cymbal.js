const Drum = require('./drum');
const Util = require('./util');

const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]; //ratios for metallic overtones

const Cymbal = function(options = {}){
  //child classes determine frequency and duration
  Drum.call(this, options);
};

Util.inherits(Cymbal, Drum);

Cymbal.prototype.attack = function(time){
  //begin by building the audio graph
  let bandpass = this.generateBiquadFilter({
    type:"bandpass",
    cutoffFreq: 10000
  });
  
  let highpass = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq: 7000
  });
  
  this.envelope = this.generateEnvelope();
  
  //connect audio graph
  
  bandpass.connect(highpass);
  highpass.connect(this.envelope);
  this.envelope.connect(this.context.destination);
  
  //now generate the oscillators for various overtones of the hit
  
  this.oscillators = RATIOS.map((ratio) => {
    let oscillator = this.generateOscillator(this.frequency * ratio);
    oscillator.type="square";
    //connect to audio graph
    oscillator.connect(bandpass);
    oscillator.start(time);
    return oscillator;
  });
};

Cymbal.prototype.release = function(time){
  console.log(time);
  this.envelope.gain.exponentialRampToValueAtTime(1, time + 0.02);
  this.envelope.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  this.oscillators.forEach((oscillator) => {
    oscillator.stop(time + this.duration);
  });
};

module.exports = Cymbal;
