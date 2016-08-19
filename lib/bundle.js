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

	const Sequencer = __webpack_require__(1);
	const Visualizer = __webpack_require__(11);
	
	
	
	
	document.addEventListener("DOMContentLoaded", () => {
	  let canvas = document.getElementById("pad");
	  let sequencer = new Sequencer();
	  let visualizer = new Visualizer(sequencer, canvas);
	  sequencer.sequence({patternName: "heartless"});
	});


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	const Kick = __webpack_require__(2);
	const Snare = __webpack_require__(6);
	const HiHat = __webpack_require__(7);
	const Ride = __webpack_require__(9);
	const Patterns = __webpack_require__(10);
	const WebAudioContext = __webpack_require__(4);
	
	const Sequencer = function(){
	  
	  this.audioContext = WebAudioContext.getContext();
	  
	  this.tempo = 62;
	  this.nextNoteTime = 0;
	  this.currentSixteenthNote = 0;
	  let schedulingRange = 0.15; //webaudio clock, in seconds
	  this.scheduledNotes = [];
	  this.lookahead = 15.0; //js clock, in milliseconds
	  const INSTRUMENTS = {
	    "kick": Kick,
	    "snare": Snare,
	    "hiHat": HiHat,
	    "ride": Ride
	  };
	  if (!this.patternName){
	    this.patternName = "goingHome";
	  }
	  
	  // this.pattern = Patterns.goingHome;
	  this.pattern = Patterns[this.patternName].map( (hits) => {
	    let drumObjects = hits.map( (drumName) => {
	      let DrumClass = INSTRUMENTS[drumName];
	      return new DrumClass();
	    });
	    return drumObjects;
	  });
	  
	  // this.playQueue = []; // will come in handy when it comes to visualizationss
	  
	  
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
	      // let instrument = INSTRUMENTS[hit];
	      hit.play(time);
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
	
	Sequencer.prototype.sequence = function(options){
	  this.nextNoteTime = this.audioContext.currentTime;
	  this.patternName = options.patternName;
	  window.setInterval( () => {
	    this.scheduler();
	  }, this.lookahead);
	};
	
	
	module.exports = Sequencer;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(3);
	const Util = __webpack_require__(5);
	
	const Kick = function (options = {}){
	  options.name = "kick";
	  
	  options.frequency = 150;
	  options.duration = 0.5;
	  
	  options.color = "blue";
	  
	  Drum.call(this, options);
	};
	
	Util.inherits(Kick, Drum);
	
	Kick.prototype.attack = function(startTime){
	  
	  this.playing = true;
	  this.envelope = this.generateEnvelope();
	  this.oscillator= this.generateOscillator();
	  
	  //construct audio graph
	  this.oscillator.connect(this.envelope);
	  this.envelope.connect(this.context.destination);
	  
	  this.oscillator.start(startTime);
	  
	};
	
	Kick.prototype.release = function(time){
	  
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.stop(time + this.duration);
	  this.oscillator.onended = () => {
	    this.playing = false;
	  };
	};
	
	
	
	module.exports = Kick;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	const WebAudioContext = __webpack_require__(4);
	
	const Drum = function(options){
	  this.name = options.name;
	  
	  this.context = WebAudioContext.getContext();
	  this.duration = options.duration;
	  this.frequency = options.frequency;
	  
	  this.color = options.color;
	  this.pos = null;
	  this.playing = false;
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
	
	Drum.prototype.play = function(time=this.currentTime()){
	  startTime = time - this.currentTime();
	  
	  if (startTime < this.currentTime()){ //in case we navigate away and current time keeps counting but time resets
	    startTime = this.currentTime();
	  }
	  
	  this.attack(startTime);
	  this.release(startTime);
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
	
	//visual aspects
	
	Drum.prototype.setPos = function(pos){
	  this.pos = pos;
	};
	
	
	module.exports = Drum;


/***/ },
/* 4 */
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
/* 5 */
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(3);
	const Util = __webpack_require__(5);
	
	const Snare = function(options = {}){
	  options.name = "snare";
	  
	  options.duration = 0.2;
	  options.frequency = 200;
	  
	  options.color = "green";
	  
	  Drum.call(this, options);
	};
	
	Util.inherits(Snare, Drum);
	
	Snare.prototype.attack = function(time) {
	
	  this.playing = true;
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
	  this.oscillator.onended = () => {
	    this.playing = false;
	  };
	};
	
	module.exports = Snare;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(8);
	const Util = __webpack_require__(5);
	
	const HiHat = function(options = {}){
	  options.name = "hiHat";
	  
	  options.frequency = 50;
	  options.duration = 0.2;
	  
	  options.color = "red";
	  
	  Cymbal.call(this, options);
	};
	
	Util.inherits(HiHat, Cymbal);
	
	
	
	module.exports = HiHat;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	const Drum = __webpack_require__(3);
	const Util = __webpack_require__(5);
	
	const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]; //ratios for metallic overtones
	
	const Cymbal = function(options = {}){
	  this.playing = true;
	  //child classes determine frequency and duration
	  Drum.call(this, options);
	};
	
	Util.inherits(Cymbal, Drum);
	
	Cymbal.prototype.attack = function(time){
	  this.playing = true;
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
	    oscillator.onended = () => {
	      this.playing = false;
	    };
	  });
	};
	
	module.exports = Cymbal;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	const Cymbal = __webpack_require__(8);
	const Util = __webpack_require__(5);
	
	const Ride = function(options = {}){
	  options.name = "ride";
	  
	  options.frequency = 500;
	  options.duration = 0.4;
	  
	  options.color = "pink";
	  
	  Cymbal.call(this, options);
	};
	
	Util.inherits(Ride, Cymbal);
	
	module.exports = Ride;


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
	  ],
	  bass: [
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"],
	    ["kick"]
	  ]
	};


/***/ },
/* 11 */
/***/ function(module, exports) {

	//shim animation frame
	
	const DRUM_STAFF = {"kick": 4, "snare": 3, "hiHat": 2, "ride": 1}; //canvas is reversed
	
	window.requestAnimFrame = (function(){
	  return window.requestAnimationFrame ||
	  window.webkitRequestAnimationFrame ||
	  window.mozRequestAnimationFrame ||
	  window.oRequestAnimationFrame ||
	  window.msRequestAnimationFrame ||
	  function( callback ){
	    window.setTimeout(callback, 1000/60); //fallback to setTimeout for ~16ms with 60hz framerate
	  };
	})();
	
	const Visualizer = function(sequencer, canvas){
	  this.sequencer = sequencer;
	  
	  this.canvas = canvas;
	  //combine callbacks for custom 'drag' that does not move the object
	  this.canvas.addEventListener('mousedown', turnOnDragging.bind(this));
	  this.canvas.addEventListener('mouseup', turnOffDragging.bind(this));
	  this.canvas.addEventListener('mousemove', setDragImage.bind(this));
	  
	  this.mouseImageArcArgs = null;
	  
	  this.dragging = false;
	  
	  this.ctx = canvas.getContext('2d');
	  draw.call(this);
	};
	
	const draw = function(){
	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	  let radius = 25;
	  let padding = 5;
	  let pattern = this.sequencer.pattern;
	  let lowerBound = Math.floor(this.canvas.height/3);
	  let patternLength = pattern.length;
	  
	  pattern.forEach( (drums, idx) => {
	    let beatNum = idx + 1;
	    
	    drums.forEach( (drum) => {
	      if (!drum.pos) {
	        let x = (this.canvas.width / patternLength) * beatNum - radius - padding ;
	        let y = lowerBound + (75 * DRUM_STAFF[drum.name] );
	        drum.setPos([x,y]);
	      }
	      this.canvas.style.background = 'black';
	      this.ctx.fillStyle = drum.playing ? drum.color : "black";
	      this.ctx.strokeStyle = "black";
	      this.ctx.beginPath();
	      this.ctx.arc(
	        drum.pos[0],
	        drum.pos[1],
	        radius,
	        0,
	        2 * Math.PI,
	        false
	      );
	      this.ctx.stroke();
	      this.ctx.fill();
	
	    });
	  });
	  
	  if (this.mouseImageArcArgs){
	    this.ctx.fillStyle = "purple";
	    this.ctx.beginPath();
	    this.ctx.arc(...this.mouseImageArcArgs);
	    this.ctx.fill();
	  }
	  
	  requestAnimFrame(draw.bind(this));
	};
	
	const setDragImage = function(e){
	  e.preventDefault();
	  console.log("dragging is " + this.dragging);
	  if (this.dragging){
	    this.mouseImageArcArgs = [
	      e.clientX,
	      e.clientY,
	      25,
	      0,
	      2*Math.PI,
	      false
	    ];
	  }
	  else {
	    this.mouseImageArcArgs = null;
	  }
	};
	
	const turnOffDragging = function(e){
	  this.dragging = false;
	};
	
	const turnOnDragging = function(e){
	  this.dragging = true;
	};
	
	
	module.exports = Visualizer;


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map