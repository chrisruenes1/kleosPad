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
  let noiseNodes = [];
  this.noise = this.generateNoise();
  noiseNodes.push(this.noise);
  let highPassFilter = this.generateBiquadFilter({
    type:"highpass",
    cutoffFreq:1000
  });
  noiseNodes.push(highPassFilter);
  this.noiseEnvelope = this.generateEnvelope();
  noiseNodes.push(this.noiseEnvelope);
  
  //construct audio graph for ringing of snares
  noiseNodes = noiseNodes.concat(filterNodes);
  noiseNodes.forEach( (node, idx, arr) => {
    if (idx === arr.length - 1){
      node.connect(this.context.destination);
    }
    else {
      node.connect(arr[idx + 1]);
    }
  });
  
  // this.noise.connect(highPassFilter);
  // highPassFilter.connect(this.noiseEnvelope);
  // this.noiseEnvelope.connect(this.context.destination);

  //generate hit
  let hitNodes = [];
  this.oscillator = this.generateOscillator();
  this.oscillator.type = "triangle";
  hitNodes.push(this.oscillator);
  this.oscillatorEnvelope = this.generateEnvelope(0.7);//felt, not heard
  hitNodes.push(this.oscillatorEnvelope);
  this.hitDuration = 0.1; //cut off the hit early for snappiness
  hitNodes = hitNodes.concat(filterNodes);
  
  //construct audio graph for hit
  //TODO this method should definitely be abstracted
  hitNodes.forEach( (node, idx, arr) => {
    if (idx === arr.length - 1){
      node.connect(this.context.destination);
      
    }
    else {
      node.connect(arr[idx + 1]);
    }
  });

  // this.oscillator.connect(this.oscillatorEnvelope);
  // this.oscillatorEnvelope.connect(this.context.destination);
  
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
