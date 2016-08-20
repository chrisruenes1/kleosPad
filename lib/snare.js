const Drum = require('./drum');
const Util = require('./util');

const Snare = function(options = {}){
  options.name = "snare";
  
  options.duration = 0.2;
  options.frequency = 200;
  
  options.color = "green";
  
  Drum.call(this, options);
};

Util.inherits(Snare, Drum);

Snare.prototype.attack = function(time, filterNodes) {
  //TODO: consider replacing nodes arrays with actual linked lists
  
  this.playing = true;
  
  //generate ringing of snares with filtered white noise
  this.noise = this.generateNoise();
  let highPassFilter = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq:1000
  });
  this.noiseEnvelope = this.generateEnvelope();
  this.buildAudioGraph(filterNodes, this.noise, highPassFilter, this.noiseEnvelope);

  //generate hit
  this.oscillator = this.generateOscillator();
  this.oscillator.type = "triangle";
  this.oscillatorEnvelope = this.generateEnvelope(0.7);//felt, not heard
  this.hitDuration = 0.1; //cut off the hit early for snappiness
  this.buildAudioGraph(filterNodes, this.oscillator, this.oscillatorEnvelope);
  
  this.noise.start(time);
  this.oscillator.start(time);
};

Snare.prototype.release = function(time) {
  this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.hitDuration);
  
  this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  this.oscillator.stop(time + this.duration);
  this.noise.stop(time + this.duration);
  this.oscillator.onended = () => {
    console.log("snare ended");
    this.playing = false;
  };
};

module.exports = Snare;
