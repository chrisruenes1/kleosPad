const Drum = require('./drum');
const Util = require('./util');

const Snare = function(options = {}){
  options.name = "snare";
  
  options.duration = 0.2;
  options.frequency = 200;
  
  options.colors = {
    clean: {
      r: 1,
      g: 128,
      b: 1
    },
    saturated: {
      r: 1,
      g: 50,
      b: 1
    },
    unsaturated: {
      r: 174,
      g: 241,
      b: 174
    }
  };
  
  Drum.call(this, options);
};

Util.inherits(Snare, Drum);

Snare.prototype.attack = function(startTime, filterNodes) {
  
  this.playing = true;
  this.onTime = this.currentTime();
  
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
  
  let when = startTime > this.currentTime() ?
  startTime - this.currentTime() :
  0;
  
  
  this.noise.start(when);
  this.oscillator.start(when);
};

Snare.prototype.release = function() {
  let time = this.currentTime(); //called by visualizer
  this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.hitDuration);
  
  this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
  this.oscillator.stop(time + this.duration);
  this.noise.stop(time + this.duration);
  this.oscillator.onended = () => {
    this.playing = false;
    this.onTime = null;
  };
};

module.exports = Snare;
