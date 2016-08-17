const Drum = function(options){
  this.context = new AudioContext();
  this.duration = options.duration;
  this.decay = options.decay;
  this.frequency = options.frequency;
};

Drum.prototype.play = function(){
  let oscillator = this.context.createOscillator();
  oscillator.frequency = this.frequency;
  
  let gainNode = this.context.createGain();
  gainNode.gain.setValueAtTime(0.8, this.context.currentTime);
  gainNode.connect(this.context.destination);
  
  oscillator.connect(gainNode);
  
  oscillator.start();
  
  gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
  oscillator.frequency.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
  
  oscillator.stop(this.context.currentTime + this.duration);
};


module.exports = Drum;
