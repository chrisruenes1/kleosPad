/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	const Kick = __webpack_require__(2);
	const Snare = __webpack_require__(4);
	const HiHat = __webpack_require__(5);
	const Ride = __webpack_require__(6);
	
	let kick = new Kick();
	let snare = new Snare();
	let hiHat = new HiHat();
	let ride = new Ride();
	
	
	window.setInterval( () => {
	  kick.play();
	}, 800);
	
	window.setTimeout(() => {
	  window.setInterval( () => {
	    snare.play();
	  }, 800);
	}, 400);
	
	window.setInterval( () => {
	  hiHat.play();
	}, 200);
	
	window.setInterval( () => {
	  ride.play();
	}, 1600/3);


/***/ },
/* 1 */
/***/ function(module, exports) {

	const Drum = function(options){
	  this.context = new AudioContext();
	  this.duration = options.duration;
	  // this.decay = options.decay;
	  this.frequency = options.frequency;
	};
	
	
	Drum.prototype.generateEnvelope = function(gainValue = 1){
	  let envelope = this.context.createGain();
	  envelope.gain.setValueAtTime(gainValue, this.context.currentTime);
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
	
	Drum.prototype.play = function(){
	  this.attack();
	  this.release();
	};
	
	Drum.prototype.attack = function(){
	  //implemented by subclasses
	};
	
	Drum.prototype.release = function(){
	  //implemented by subclasses
	};
	
	module.exports = Drum;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(1);
	const Util = __webpack_require__(3);
	
	const Kick = function (options = {}){
	  options.frequency = 150;
	  options.duration = 0.5;
	  Drum.call(this, options);
	};
	
	Util.inherits(Kick, Drum);
	
	Kick.prototype.attack = function(){
	  this.envelope = this.generateEnvelope();
	  this.oscillator= this.generateOscillator();
	  
	  //construct audio graph
	  this.oscillator.connect(this.envelope);
	  this.envelope.connect(this.context.destination);
	  
	  this.oscillator.start();
	};
	
	Kick.prototype.release = function(){
	
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
	  
	  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
	  
	  this.oscillator.stop(this.context.currentTime + this.duration);
	};
	
	module.exports = Kick;


/***/ },
/* 3 */
/***/ function(module, exports) {

	const Util = {
	  inherits: function(Child, Parent){
	    const Surrogate = function(){};
	    Surrogate.prototype = Parent.prototype;
	    Child.prototype = new Surrogate();
	    Child.prototype.constructor = Child;
	  }
	};
	
	module.exports = Util;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(1);
	const Util = __webpack_require__(3);
	
	const Snare = function(options = {}){
	  options.duration = 0.2;
	  options.frequency = 200;
	  Drum.call(this, options);
	  
	};
	
	Util.inherits(Snare, Drum);
	
	Snare.prototype.attack = function() {
	
	  //generate ringing of snares with filtered white noise
	  this.noise = this.generateNoise();
	  let highPassFilter = this.generateBiquadFilter({
	    type:"highpass",
	    cutoffFreq:1000
	  });
	  this.noiseEnvelope = this.generateEnvelope();
	  
	  //construct audio graph for ringing of snares
	  this.noise.connect(highPassFilter);
	  highPassFilter.connect(this.noiseEnvelope);
	  this.noiseEnvelope.connect(this.context.destination);
	
	  //generate hit
	  this.oscillator = this.generateOscillator();
	  this.oscillator.type = "triangle";
	  this.oscillatorEnvelope = this.generateEnvelope(0.3);//felt, not heard
	  this.hitDuration = 0.1; //cut off the hit early for snappiness
	  
	  //construct audio graph for hit
	  this.oscillator.connect(this.oscillatorEnvelope);
	  this.oscillatorEnvelope.connect(this.context.destination);
	  
	  this.noise.start();
	  this.oscillator.start();
	};
	
	Snare.prototype.release = function() {
	  this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.hitDuration);
	  
	  this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
	  
	  this.oscillator.stop(this.context.currentTime + this.duration);
	  this.noise.stop(this.context.currentTime + this.duration);
	};
	
	module.exports = Snare;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(7);
	const Util = __webpack_require__(3);
	
	const HiHat = function(options = {}){
	  options.frequency = 100;
	  options.duration = 0.15;
	  Cymbal.call(this, options);
	};
	
	Util.inherits(HiHat, Cymbal);
	
	
	
	module.exports = HiHat;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(7);
	const Util = __webpack_require__(3);
	
	const Ride = function(options = {}){
	  options.frequency = 500;
	  options.duration = 0.5;
	  Cymbal.call(this, options);
	};
	
	Util.inherits(Ride, Cymbal);
	
	module.exports = Ride;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(1);
	const Util = __webpack_require__(3);
	
	const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]; //ratios for metallic overtones
	
	const Cymbal = function(options = {}){
	  //child classes determine frequency and duration
	  Drum.call(this, options);
	};
	
	Util.inherits(Cymbal, Drum);
	
	Cymbal.prototype.attack = function(){
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
	    oscillator.start();
	    return oscillator;
	  });
	};
	
	Cymbal.prototype.release = function(){
	  this.envelope.gain.setValueAtTime(0.01, this.context.currentTime);
	  this.envelope.gain.exponentialRampToValueAtTime(1, this.context.currentTime + 0.02);
	  this.envelope.gain.exponentialRampToValueAtTime(0.3, this.context.currentTime + 0.03);
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.duration);
	  this.oscillators.forEach((oscillator) => {
	    oscillator.stop(this.context.currentTime + this.duration);
	  });
	};
	
	module.exports = Cymbal;


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map