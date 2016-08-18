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

	const Kick = __webpack_require__(1);
	const Snare = __webpack_require__(5);
	const HiHat = __webpack_require__(6);
	const Ride = __webpack_require__(8);
	const Sequencer = __webpack_require__(9);
	
	
	let kick = new Kick();
	let snare = new Snare();
	let hiHat = new HiHat();
	let ride = new Ride();
	let sequencer = new Sequencer();
	
	
	
	const playSample = function(){
	  window.setInterval( () => {
	    kick.play(0);
	  }, 800);
	
	  window.setTimeout(() => {
	    window.setInterval( () => {
	      snare.play(0);
	    }, 800);
	  }, 400);
	
	  window.setInterval( () => {
	    hiHat.play(0);
	  }, 200);
	
	
	  window.setInterval( () => {
	    ride.play(0);
	  }, 1600/3);
	
	};
	//
	// playSample();
	sequencer.sequence();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(2);
	const Util = __webpack_require__(4);
	
	const Kick = function (options = {}){
	  options.frequency = 150;
	  options.duration = 1.0;
	  Drum.call(this, options);
	};
	
	Util.inherits(Kick, Drum);
	
	Kick.prototype.attack = function(time){
	  this.envelope = this.generateEnvelope();
	  this.oscillator= this.generateOscillator();
	  
	  //construct audio graph
	  this.oscillator.connect(this.envelope);
	  this.envelope.connect(this.context.destination);
	  
	  this.oscillator.start(time);
	};
	
	Kick.prototype.release = function(time){
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.stop(time + this.duration);
	};
	
	module.exports = Kick;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	const WebAudioContext = __webpack_require__(3);
	
	const Drum = function(options){
	  this.context = WebAudioContext.getContext();
	  this.duration = options.duration;
	  this.frequency = options.frequency;
	};
	
	Drum.prototype.generateEnvelope = function(gainValue = 1){
	  let envelope = this.context.createGain();
	  envelope.gain.setValueAtTime(gainValue, this.currentTime());
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
	
	Drum.prototype.play = function(delay=0){ //delay enables scheduling multiple notes at once
	  this.attack(delay);
	  this.release(delay);
	};
	
	Drum.prototype.currentTime = function(){
	  return this.context.currentTime;
	};
	
	Drum.prototype.attack = function(){
	  //implemented by subclasses
	};
	
	Drum.prototype.release = function(){
	  //implemented by subclasses
	};
	
	module.exports = Drum;


/***/ },
/* 3 */
/***/ function(module, exports) {

	const WebAudioContext = (function () {
	  var context ;
	  
	  function createContext() {
	    const context = new AudioContext();
	    return context;
	  }
	  
	  return {
	    getContext: function() {
	      if (!context) {
	        context = createContext();
	      }
	      return context;
	    }
	  };
	})();
	
	module.exports = WebAudioContext;


/***/ },
/* 4 */
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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(2);
	const Util = __webpack_require__(4);
	
	const Snare = function(options = {}){
	  options.duration = 0.3;
	  options.frequency = 200;
	  Drum.call(this, options);
	  
	};
	
	Util.inherits(Snare, Drum);
	
	Snare.prototype.attack = function(time) {
	
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
	  this.oscillatorEnvelope = this.generateEnvelope(0.7);//felt, not heard
	  this.hitDuration = 0.1; //cut off the hit early for snappiness
	  
	  //construct audio graph for hit
	  this.oscillator.connect(this.oscillatorEnvelope);
	  this.oscillatorEnvelope.connect(this.context.destination);
	  
	  this.noise.start(time);
	  this.oscillator.start(time);
	};
	
	Snare.prototype.release = function(time) {
	  this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.hitDuration);
	  
	  this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.stop(time + this.duration);
	  this.noise.stop(time + this.duration);
	};
	
	module.exports = Snare;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(7);
	const Util = __webpack_require__(4);
	
	const HiHat = function(options = {}){
	  options.frequency = 100;
	  options.duration = 0.15;
	  Cymbal.call(this, options);
	};
	
	Util.inherits(HiHat, Cymbal);
	
	
	
	module.exports = HiHat;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(2);
	const Util = __webpack_require__(4);
	
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
	  this.envelope.gain.exponentialRampToValueAtTime(1, time + 0.02);
	  this.envelope.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  this.oscillators.forEach((oscillator) => {
	    oscillator.stop(time + this.duration);
	  });
	};
	
	module.exports = Cymbal;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(7);
	const Util = __webpack_require__(4);
	
	const Ride = function(options = {}){
	  options.frequency = 500;
	  options.duration = 0.5;
	  Cymbal.call(this, options);
	};
	
	Util.inherits(Ride, Cymbal);
	
	module.exports = Ride;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	const Kick = __webpack_require__(1);
	const Snare = __webpack_require__(5);
	const HiHat = __webpack_require__(6);
	const Ride = __webpack_require__(8);
	const Patterns = __webpack_require__(10);
	const WebAudioContext = __webpack_require__(3);
	
	const Sequencer = function(){
	  
	  this.audioContext = WebAudioContext.getContext();
	  
	  this.kick = new Kick();
	  this.snare = new Snare();
	  this.hiHat = new HiHat();
	  this.ride = new Ride();
	  
	  this.tempo = 90;
	  this.nextNoteTime = 0;
	  this.currentSixteenthNote = 0;
	  let schedulingRange = 0.1; //webaudio clock, in seconds
	  this.scheduledNotes = [];
	  this.lookahead = 25; //js clock, in milliseconds
	  
	  // this.pattern = Patterns.goingHome;
	  this.pattern = Patterns.heartless;
	  
	  // this.playQueue = []; // will come in handy when it comes to visualizationss
	  
	  const INSTRUMENTS = {
	    "kick": this.kick,
	    "snare": this.snare,
	    "hiHat": this.hiHat,
	    "ride": this.ride
	  };
	  
	  const nextNote = () => {
	    let beatLength = 60.0 / this.tempo;
	    
	    this.nextNoteTime += 0.25 * beatLength;
	    this.currentSixteenthNote += 1;
	    if (this.currentSixteenthNote == 16){
	      this.currentSixteenthNote = 0;
	    }
	  };
	  
	  const scheduleNoteEvents = ( beatNumber, time ) => {
	    let hits = this.pattern[beatNumber];
	    hits.forEach( (hit) => {
	      let instrument = INSTRUMENTS[hit];
	      instrument.play(time);
	    });
	    setTimeout( () => {
	      this.scheduledNotes.splice(0, 1);
	    }, time - this.audioContext.currentTime );
	  };
	  
	  this.scheduler = function() {
	    while (this.nextNoteTime < this.audioContext.currentTime + schedulingRange){
	      if (this.scheduledNotes.indexOf(this.currentSixteenthNote) < 0 ){
	        scheduleNoteEvents( this.currentSixteenthNote, this.nextNoteTime );
	        this.scheduledNotes.push(this.currentSixteenthNote);
	        nextNote();
	        
	      }
	    }
	  };
	    
	};
	
	Sequencer.prototype.sequence = function(){
	  this.nextNoteTime = this.audioContext.currentTime;
	  window.setInterval( () => {
	    this.scheduler();
	  }, this.lookahead);
	};
	
	
	module.exports = Sequencer;


/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = {
	  goingHome: [ //array of events per 16th-note;
	    ["kick", "hiHat"], //instruments to play on first sixteenth note
	    ["hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["snare", "hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["kick", "hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["snare", "hiHat"],
	    ["hiHat"],
	    ["hiHat"],
	    ["hiHat"]
	  ],
	  heartless: [
	    ["kick", "ride"],
	    ["ride"],
	    ["kick", "ride"],
	    ["ride"],
	    ["snare", "ride"],
	    ["snare", "ride"],
	    ["ride"],
	    ["snare", "ride"],
	    ["kick", "ride"],
	    ["ride"],
	    ["kick", "ride"],
	    ["ride"],
	    ["snare", "ride"],
	    ["ride"],
	    ["ride"],
	    ["ride"]
	  ]
	};


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map