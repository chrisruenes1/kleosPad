const Drum = function(options){
  this.context = new AudioContext();
  this.duration = options.duration;
  this.decay = options.decay;
  this.frequency = options.frequency;
};

Drum.prototype.play = function(){
  this.oscillator = this.context.createOscillator();
  this.oscillator.frequency = this.frequency;
  this.oscillator.connect(this.context.destination);
  this.oscillator.start();
};

Drum.prototype.deaden = function(){
  this.oscillator.stop();
};

module.exports = Drum;
