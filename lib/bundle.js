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
	const Visualizer = __webpack_require__(12);
	
	document.addEventListener("DOMContentLoaded", () => {
	  //register general jquery listeners
	  $("#instructions-modal-overlay").click(function(e) {
	    $(this).addClass("hidden");
	  });
	  $("#directions").click(function(e) {
	    $("#instructions-modal-overlay").removeClass("hidden");
	  });
	  $(".exit").click(function(e){
	    $("#instructions-modal-overlay").removeClass("hidden");
	  });
	  
	  //set up document
	  let canvas = document.getElementById("pad");
	  let sequencer = new Sequencer();
	  let visualizer = new Visualizer(sequencer, canvas);
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
	const APIUtil = __webpack_require__(11);
	
	const Sequencer = function(){
	  $( () => {
	    $('#play').click( (e) => {
	      e.preventDefault();
	      togglePaused.bind(this)();
	    });
	    $('#tempo').on("input change", (e) => {
	      let tempo = e.target.value <= 400 && e.target.value >= 20 ?
	      e.target.value :
	        e.target.value > 400 ?
	        400 :
	        20;
	      $('#current-tempo').html(`&#9833 = ${tempo}`);
	      this.tempo = tempo;
	    });
	    $("#pattern-one").data("name", "goingHome");
	    $("#pattern-two").data("name", "heartless");
	    $("#pattern-three").data("name", "bass");
	    
	    let that = this;
	    $("#pattern-list").click( function(e) {
	      e.preventDefault();
	      setPattern.bind(that)($(e.target).data("name"));
	    });
	    
	    // $("#pattern-one").click( (e) => {
	    //   e.preventDefault();
	    //   setPattern.bind(this)("goingHome");
	    // });
	    // $("#pattern-two").click( (e) => {
	    //   e.preventDefault();
	    //   setPattern.bind(this)("heartless");
	    // });
	    // $("#pattern-three").click( (e) => {
	    //   e.preventDefault();
	    //   setPattern.bind(this)("bass");
	    // });
	  });
	  
	  this.audioContext = WebAudioContext.getContext();
	  this.nextNoteTime = 0;
	  this.paused = true;
	  this.tempo = 200;
	  this.currentSixteenthNote = 0;
	  let schedulingRange = 1.5; //webaudio clock, in seconds
	  this.scheduledNotes = [];
	  this.lookahead = 75.0; //js clock, in milliseconds
	  let defaultPattern = "goingHome";
	  this.pattern = Patterns.goingHome.map( (hits) => {
	    let drumObjects = hits.map( (drumName) => {
	      let DrumClass = INSTRUMENTS[drumName];
	      return new DrumClass();
	    });
	    return drumObjects;
	  });
	  
	  //initialize filters
	  this.filters = {};
	  
	  const nextNote = () => {
	    let beatLength = 60.0 / this.tempo;
	    
	    this.nextNoteTime += 0.25 * beatLength;
	    this.currentSixteenthNote += 1;
	    if (this.currentSixteenthNote == 16){
	      this.currentSixteenthNote = 0;
	    }
	  };
	  
	  const scheduleNoteEvents = ( beatNumber, time ) => {
	    if (time > this.currentTime() && !this.paused){
	      let hits = this.pattern[beatNumber];
	      let filters = [];
	      for (let key in this.filters){
	        filters.push(this.filters[key]);
	      }
	      hits.forEach( (hit) => {
	        hit.play(time, filters);
	      });
	    }
	  };
	  
	  this.scheduler = function() {
	    while (this.nextNoteTime < this.currentTime() + schedulingRange){
	      scheduleNoteEvents( this.currentSixteenthNote, this.nextNoteTime );
	      nextNote();
	    }
	  };
	  //make async calls and kick off playback
	  APIUtil.fetchImpulseResponseAudio(saveAudioAndPlay.bind(this));
	};
	
	Sequencer.prototype.currentTime = function(){ //visualizer needs access to this for render logic
	   //will not yet exist at time of definition
	   if (this.audioContext){
	     return this.audioContext.currentTime;
	   }
	   return 0; //reasonable default
	};
	
	Sequencer.prototype.callScheduler = function(){ //called by visualizer to link scheduling notes to requestAnimFrame
	  this.scheduler();
	};
	
	Sequencer.prototype.updateFilters = function(xScaled, yScaled){ //scaled to %
	  //update the filters based on the position of a mouseclick in the visualizer
	  let previousFilters = Object.assign({}, this.filters);
	
	  updateLeftVertFilter.call(this, yScaled);
	  updateRightVertFilter.call(this, yScaled);
	  updateTopHorizFilter.call(this, xScaled);
	  updateBottomHorizFilter.call(this, xScaled);
	};
	  
	const togglePaused = function(){
	  this.paused = !this.paused;
	  let text = this.paused ? "PLAY" : "PAUSE";
	  
	  if (this.paused){
	    this.pausedSixteenthNote = this.currentSixteenthNote;
	  }
	  else {
	    this.currentSixteenthNote = this.pausedSixteenthNote || 0;
	  }
	  
	  $("#play").html(text);
	};
	
	const INSTRUMENTS = {
	  "kick": Kick,
	  "snare": Snare,
	  "hiHat": HiHat,
	  "ride": Ride
	};
	
	const saveAudioAndPlay = function(audio){
	  this.impulseResponseAudio = audio;
	  this.scheduler();
	};
	
	const updateLeftVertFilter = function(yScaled){
	  //update bandpass
	  let freq = 50 + ((15950/100) * yScaled); //aim for freq range of 50-20000
	  
	  if (this.filters.biquad){
	    this.filters.biquad.node.frequency.value = freq;
	  }
	  else {
	    //set it up if it has not yet been added
	    let biquadNode = this.audioContext.createBiquadFilter();
	    biquadNode.type = "bandpass";
	    biquadNode.frequency.value = freq;
	    let filter = {
	      node: biquadNode,
	      splitAudioGraph: false //bool that determines whether filter should be on adjacent audio channel
	    };
	    this.filters.biquad = filter;
	  }
	};
	
	const updateRightVertFilter = function(yScaled){
	  let gain = yScaled / 50;
	  if (this.filters.reverb){
	    this.filters.reverb.gain = gain;
	  }
	  else {
	    let reverbNode = this.audioContext.createConvolver();
	  
	      reverbNode.buffer = this.impulseResponseAudio;
	      let filter = {
	        node: reverbNode,
	        splitAudioGraph: true,
	        gain: gain
	      };
	      this.filters.reverb = filter;
	  }
	};
	
	const updateBottomHorizFilter = function(xScaled){
	  //update distortion
	  if (this.filters.distortion){
	    this.filters.distortion.node.curve = generateDistortionCurve(xScaled);
	  }
	  else {
	    let distortionNode = this.audioContext.createWaveShaper();
	    distortionNode.curve = generateDistortionCurve(xScaled);
	    distortionNode.oversample = "4x";
	    let filter = {
	      node: distortionNode,
	      splitAudioGraph: true
	    };
	    this.filters.distortion = filter;
	  }
	};
	
	const updateTopHorizFilter = function(xScaled){
	  let delayTime = (xScaled/200).toPrecision(1); //0-0.5 seconds delay, made discreet to avoid weird spacey sounds
	
	  if (this.filters.echo){
	    this.filters.echo.node.delayTime.value = delayTime;
	  }
	  else {
	    let echoNode = this.audioContext.createDelay();
	    echoNode.delayTime.value = delayTime;
	    let filter = {
	      node: echoNode,
	      splitAudioGraph: true
	    };
	    this.filters.echo = filter;
	  }
	};
	
	const generateDistortionCurve = function(amount){
	  var k = typeof amount === 'number' ? amount : 50,
	  n_samples = 44100,
	  curve = new Float32Array(n_samples),
	  deg = Math.PI / 180,
	  i = 0,
	  x;
	  for (i ; i < n_samples; ++i ) {
	    x = i * 2 / n_samples - 1;
	    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
	  }
	  return curve;
	};
	
	Sequencer.prototype.resetFilters = function(){
	  //called in visualizer mouseup
	  if (Object.keys(this.filters).length > 0){
	    let timeout = window.setTimeout( () => {
	      for (let key in this.filters){
	        this.filters[key].node.disconnect();
	      }
	      this.filters = {};
	    }, 100);
	  }
	};
	
	const setPattern = function(patternName){
	  this.pattern = Patterns[patternName].map( (hits) => {
	    let drumObjects = hits.map( (drumName) => {
	      let DrumClass = INSTRUMENTS[drumName];
	      return new DrumClass();
	    });
	    return drumObjects;
	  });
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
	  
	  options.colors = {
	    clean: {
	      r: 0,
	      g: 0,
	      b: 255
	    },
	    saturated: {
	      r: 2,
	      g: 2,
	      b: 60
	    },
	    unsaturated: {
	      r: 111,
	      g: 111,
	      b: 219
	    }
	  };
	  
	  Drum.call(this, options);
	};
	
	Util.inherits(Kick, Drum);
	
	Kick.prototype.attack = function(startTime, filterNodes){
	  this.onTime = this.currentTime(); //called by visualizer
	  this.playing = true;
	  this.oscillator= this.generateOscillator();
	  this.envelope = this.generateEnvelope();
	  
	  this.buildAudioGraph(filterNodes, this.oscillator, this.envelope);
	  
	  let when = startTime > this.currentTime() ?
	  startTime - this.currentTime() :
	  0;
	  
	  this.oscillator.start(when);
	  
	};
	
	Kick.prototype.release = function(){
	  let time = this.currentTime();
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.frequency.exponentialRampToValueAtTime(0.01, time + this.duration);
	  
	  this.oscillator.stop(time + this.duration);
	  this.oscillator.onended = () => {
	    this.playing = false;
	    this.onTime = null;
	    this.envelope.disconnect();
	    this.silentEnvelope.disconnect();
	  };
	  
	};
	
	
	
	module.exports = Kick;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	const WebAudioContext = __webpack_require__(4);
	
	const Drum = function(options){
	  this.name = options.name;
	  
	  this.audioContext = WebAudioContext.getContext();
	  
	  this.duration = options.duration;
	  this.frequency = options.frequency;
	  
	  this.colors = options.colors;
	  this.pos = null;
	  this.playing = false;
	};
	
	Drum.prototype.generateEnvelope = function(gainValue = 0.5){
	  let envelope = this.audioContext.createGain();
	  envelope.gain.setValueAtTime(gainValue, this.currentTime());
	  return envelope;
	};
	
	Drum.prototype.generateBiquadFilter = function(options){
	  let filter = this.audioContext.createBiquadFilter();
	  filter.type = options.type;
	  filter.frequency.value = options.cutoffFreq;
	  return filter;
	};
	
	Drum.prototype.generateOscillator = function(frequency = this.frequency){
	  let oscillator = this.audioContext.createOscillator();
	  oscillator.frequency.value = frequency;
	  return oscillator;
	};
	
	Drum.prototype.generateNoise = function(){
	  let bufferSize = this.audioContext.sampleRate;
	  let buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
	  let output = buffer.getChannelData(0);
	  
	  for (let i = 0; i < bufferSize; i++) {
	    output[i] = Math.random() * 2 - 1;
	  }
	  
	  let noise = this.audioContext.createBufferSource();
	  noise.buffer = buffer;
	    
	  return noise;
	};
	
	Drum.prototype.buildAudioGraph = function(filters, ...synthesisNodes){
	  //separate the filters first
	  let sequentialFilterNodes = [];
	  let adjacentFilterNodes = [];
	  
	  filters.forEach( (filter) => {
	    if (filter.splitAudioGraph){
	      adjacentFilterNodes.push(filter.node);
	    }
	    else {
	      sequentialFilterNodes.push(filter.node);
	    }
	  });
	  
	  this.lastProcessedNode = null;
	  
	  //first we need a muted version of the synthesis to go to the output. If the nodes connecting to the output
	  //are disconnected between start and stop of note, the severed graph will not be able to end the note
	  
	  this.silentEnvelope = this.generateEnvelope(0);
	  this.silentEnvelope.connect(this.audioContext.destination);
	  let last = synthesisNodes.length - 1;
	  synthesisNodes[last].connect(this.silentEnvelope);
	  
	  //next, add the sequential filters
	  let graphNodes = synthesisNodes.concat(sequentialFilterNodes); //connect synthesis and sequential filter nodes
	  
	  graphNodes.forEach( (node, idx, arr) => {
	    if (idx === arr.length - 1){
	      node.connect(this.audioContext.destination);
	      this.lastProcessedNode = node;
	    }
	    else {
	      node.connect(arr[idx + 1]);
	    }
	  });
	  //split processed signal at any adjacent filter, creating multiple simultaneous signals
	  adjacentFilterNodes.forEach( (node) => {
	    this.lastProcessedNode.connect(node);
	    node.connect(this.audioContext.destination);
	  });
	};
	
	Drum.prototype.play = function(time, filterNodes){
	    this.attack(time, filterNodes);
	    this.release();
	  
	};
	
	Drum.prototype.currentTime = function(){
	  return this.audioContext.currentTime;
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
	  let context ;
	  // 
	  // let hidden, visibilityChange;
	  // if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
	  //   hidden = "hidden";
	  //   visibilityChange = "visibilitychange";
	  // } else if (typeof document.mozHidden !== "undefined") {
	  //   hidden = "mozHidden";
	  //   visibilityChange = "mozvisibilitychange";
	  // } else if (typeof document.msHidden !== "undefined") {
	  //   hidden = "msHidden";
	  //   visibilityChange = "msvisibilitychange";
	  // } else if (typeof document.webkitHidden !== "undefined") {
	  //   hidden = "webkitHidden";
	  //   visibilityChange = "webkitvisibilitychange";
	  // }
	  
	  function createContext() {
	    const context = new AudioContext();
	    // window.addEventListener(visibilityChange, () =>{
	    //   if (document[hidden]){
	    //     context.close();
	    //   }
	    // });
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
	  },
	  randomInt: function(min, max){
	    return Math.floor(Math.random() * (max - min) + min);
	  },
	  getCursorPositionInCanvas(canvas, event){ //thanks to patriques http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
	    var rect = canvas.getBoundingClientRect();
	    var x = event.clientX - rect.left;
	    var y = event.clientY - rect.top;
	    return {x: x, y: y};
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
	    this.oscillatorEnvelope.disconnect();
	    this.noiseEnvelope.disconnect();
	    this.silentEnvelope.disconnect();
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
	  
	  options.colors = {
	    saturated: {
	      r: 34,
	      g: 0,
	      b: 0
	    },
	    clean: {
	      r: 255,
	      g: 0,
	      b: 0
	    },
	    unsaturated: {
	      r: 188,
	      g: 74,
	      b: 74
	    }
	  };
	  
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
	
	Cymbal.prototype.attack = function(startTime, filterNodes){
	  this.playing = true;
	  this.onTime = this.currentTime(); //called by visualizer
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
	
	  // //now generate the oscillators for various overtones of the hit
	  this.oscillators = RATIOS.map((ratio) => {
	    let oscillator = this.generateOscillator(this.frequency * ratio);
	    oscillator.type="square";
	    this.buildAudioGraph(filterNodes, oscillator, bandpass, highpass, this.envelope);
	    let when = startTime > this.currentTime() ?
	    startTime - this.currentTime() :
	    0;
	    
	    oscillator.start(when);
	    return oscillator;
	  });
	};
	
	Cymbal.prototype.release = function(){
	  let time = this.currentTime();
	  this.envelope.gain.exponentialRampToValueAtTime(1, time + 0.02);
	  this.envelope.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
	  this.envelope.gain.exponentialRampToValueAtTime(0.01, time + this.duration);
	  this.oscillators.forEach((oscillator) => {
	    oscillator.stop(time + this.duration);
	    oscillator.onended = () => {
	      this.playing = false;
	      this.onTime = null;
	      this.envelope.disconnect();
	      this.silentEnvelope.disconnect();
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
	  options.duration = 0.2;
	  
	  options.colors = {
	    clean: {
	      r: 196,
	      g: 85,
	      b: 105
	    },
	    saturated: {
	      r: 110,
	      g: 2,
	      b: 21
	    },
	    unsaturated: {
	      r: 255,
	      b: 192,
	      g: 203
	    }
	  };
	    
	  
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
	    ["hiHat", "ride"],
	    ["hiHat"],
	    ["kick", "snare", "hiHat"],
	    ["hiHat"],
	    ["hiHat", "ride"],
	    ["hiHat"],
	    ["kick", "hiHat"],
	    ["hiHat"],
	    ["hiHat", "ride", "snare"],
	    ["hiHat"],
	    ["kick", "snare", "hiHat"],
	    ["hiHat"],
	    ["hiHat", "ride"],
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
	    ["ride", "snare"]
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
	  ],
	  snare: [
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"],
	    ["snare"]
	  ]
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	const WebAudioContext = __webpack_require__(4);
	
	module.exports = {
	  fetchImpulseResponseAudio: function(callback){
	    //asynchronously fetch and read audio file for impulse response
	    
	    let context = WebAudioContext.getContext();
	    let ajaxRequest = new XMLHttpRequest();
	    let crowdBuffer;
	    ajaxRequest.open('GET', 'https://s3.amazonaws.com/kleos-dev/JFKUnderpass.wav');
	    ajaxRequest.responseType = 'arraybuffer';
	    
	    ajaxRequest.onload = () => {
	      var audioData  = ajaxRequest.response;
	      context.decodeAudioData(audioData, (buffer) => {
	        crowdBuffer = buffer;
	        soundSource = context.createBufferSource();
	        soundSource.buffer = crowdBuffer;
	        callback(crowdBuffer);
	      });
	    };
	    ajaxRequest.send();
	  }
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	let Util = __webpack_require__(5);
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
	  this.canvas.addEventListener('mouseout', turnOffDragging.bind(this));
	  
	  this.mouseImageArcsArgs = []; //a queue of positions to allow for a visual tail
	  
	  this.dragging = false;
	  
	  this.reverbRenders = {};
	  this.echoRenders = {};
	  this.distortionRenders = {};
	  this.waveIndex = 0;
	  this.shouldRenderWaves = false;
	  this.waveFadeCountdown = 3;
	  
	  
	  this.ctx = canvas.getContext('2d');
	  draw.call(this);
	  
	};
	
	const draw = function(){
	  this.canvas.width = window.innerWidth * 0.98;
	  this.canvas.height = window.innerHeight - 80;
	  
	  let pattern = this.sequencer.pattern;
	  let patternLength = pattern.length;
	  
	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	  let maxRadialWidth = (((this.canvas.width - (this.canvas.width / 10) ) / patternLength) / 2);
	  let maxRadialHeight = ((this.canvas.height - (this.canvas.height / 10))/12);
	  this.radius = maxRadialWidth < maxRadialHeight ? maxRadialWidth : maxRadialHeight; //chose whichever constraint is smaller
	  this.padding = 0.4 * this.radius;
	  let verticalCenter = (this.canvas.height - ( ( (this.radius * 2) + (this.padding * 2) ) * 4) )/ 2;
	  
	  if (this.xScaled > 70 ) {
	    this.shouldRenderWaves = true;
	    this.waveFadeCountdown = 3;
	  }
	  
	  pattern.forEach( (drums, idx) => {
	    let beatNum = idx + 1;
	    
	    drums.forEach( (drum) => {
	      let x = ( (this.canvas.width - (this.padding * 2) ) / patternLength) * beatNum + this.padding - this.radius ;
	      let y = (((2 * this.radius) + this.padding) * DRUM_STAFF[drum.name] ) + verticalCenter;
	      drum.setPos([x,y]);
	      
	      this.canvas.style.background = "black";
	      
	      //EQ
	      
	      //determine color as function of biquadPos
	      let r = drum.colors.clean.r;
	      let g = drum.colors.clean.g;
	      let b = drum.colors.clean.b;
	      let playColor = `rgb(${r}, ${g}, ${b})`;
	      
	      let decimalLoc = this.yScaled / 100; //turn scaled y into a float btw 0 and 1
	        
	      if (this.sequencer.filters.biquad){
	        r = ( ( (drum.colors.unsaturated.r - drum.colors.saturated.r ) * decimalLoc ) + drum.colors.saturated.r );
	        g = ( ( (drum.colors.unsaturated.g - drum.colors.saturated.g ) * decimalLoc ) + drum.colors.saturated.g );
	        b = ( ( (drum.colors.unsaturated.b - drum.colors.saturated.b ) * decimalLoc ) + drum.colors.saturated.b );
	        playColor = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
	      }
	      
	      //REVERB
	      
	      //determine fade value based on reverb and time passed since play
	      
	      //first, record reverb data
	      if (drum.playing && this.sequencer.filters.reverb){
	        let startTime = drum.onTime + drum.duration;
	        let fadeDuration = (1 - decimalLoc) * 0.8; //maximum fadeout of 800ms for most reverb
	        let endTime = startTime + fadeDuration;
	        
	  
	        if (!this.reverbRenders[idx]){
	          this.reverbRenders[idx] = {};
	        }
	        this.reverbRenders[idx][drum.name] = {
	          start:startTime,
	          end: endTime,
	          r: r,
	          g: g,
	          b: b
	        };
	      }
	      
	      //next, process reverb data
	      let reverbData = this.reverbRenders[idx];
	      let currentTime = this.sequencer.currentTime();
	      let fadeColor;
	      if (reverbData && reverbData[drum.name] && currentTime <= reverbData[drum.name].end && currentTime >= reverbData[drum.name].start){  //second part saves trouble of removing data from object when expired
	        let capturedTime = this.sequencer.currentTime();
	        let fadeMultiplier = ((capturedTime - reverbData[drum.name].start) / (reverbData[drum.name].end - reverbData[drum.name].start));
	        
	        r = Math.abs(r - (Math.abs(reverbData[drum.name].r - 25) * fadeMultiplier));
	        g = Math.abs(g - (Math.abs(reverbData[drum.name].g - 25) * fadeMultiplier));
	        b = Math.abs(b - (Math.abs(reverbData[drum.name].b - 25) * fadeMultiplier));
	        fadeColor = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
	      } else{
	        fadeColor = "rgb(25, 25, 25)";
	      }
	      
	      //DELAY
	      
	      //determine outline based on echo
	      
	      //record first
	      if (drum.playing && this.sequencer.filters.echo){
	        let echoTime = Math.round((this.xScaled/200) * 10)/10;
	        let startTime = drum.onTime;
	        let endTime = startTime + echoTime;
	        if (!this.echoRenders[idx]){
	          this.echoRenders[idx] = {};
	        }
	        this.echoRenders[idx][drum.name] = {
	          start: startTime,
	          end: endTime,
	          r: r,
	          g: g,
	          b: b
	        };
	      }
	      
	      //process
	      
	      //render a bigger circle (just an outline) around radius of current circle
	
	      let echoData = this.echoRenders[idx];
	      
	      if (echoData && echoData[drum.name] && echoData[drum.name].start <= currentTime && echoData[drum.name].end >= currentTime){
	        let outerR = echoData[drum.name].r;
	        let outerG = echoData[drum.name].g;
	        let outerB = echoData[drum.name].b;
	        this.ctx.strokeStyle = `rgb(${Math.floor(outerR)}, ${Math.floor(outerG)}, ${Math.floor(outerB)})`;
	        let delaySegment = (echoData[drum.name].end - echoData[drum.name].start) / 3;
	        let timesExtra = 3 - ((Math.round(((echoData[drum.name].end - currentTime) / delaySegment))));
	        let radius = this.radius + (timesExtra);
	        
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
	      }
	      
	      //DISTORTION
	      
	      //randomly generate *spark* data using Bezier Paths
	      
	      // if (this.sequencer.filters.distortion && drum.playing && this.xScaled > 20){ //
	      //   //pick a random number, with the range decreasing as the distortion increases
	      //   //a zero selected will cause a path to be drawn
	      //   let max = Math.ceil( ((this.canvas.width - this.cursorX) / 1000 ) * 50) + 2; //targeting ~2 - 52 max
	      //   let min = 1;
	      //   let picked = Math.floor(Math.random() * (max - min) + min); //rand between 1 and max
	      //
	      //   if (picked === 1) { //more or less arbitrary, but since min will always be an option
	      //
	      //     let q1minX = drum.pos[0] + this.radius;
	      //     let q1maxX = q1minX + 5;
	      //     let q1minY = drum.pos[1] - this.radius;
	      //     let q1maxY = q1minY - 5;
	      //
	      //     let q2minX = drum.pos[0] - this.radius;
	      //     let q2maxX = q2minX - 5;
	      //     let q2minY = drum.pos[1] + this.radius;
	      //     let q2maxY = q2minY + 5;
	      //
	      //     let q3minX = drum.pos[0] - this.radius;
	      //     let q3maxX = q3minX - 5;
	      //     let q3minY = drum.pos[1] - this.radius;
	      //     let q3maxY = q3minY - 5;
	      //
	      //     let q4minX = drum.pos[0] + this.radius;
	      //     let q4maxX = q4minX + 5;
	      //     let q4minY = drum.pos[1] + this.radius;
	      //     let q4maxY = q4minY + 5;
	      //
	      //
	      //     let usableArea = {
	      //       1:{
	      //         minX: q1minX,
	      //         maxX: q1maxX,
	      //         minY: q1minY,
	      //         maxY: q1maxY
	      //       },
	      //       2: {
	      //         minX: q2minX,
	      //         maxX: q2maxX,
	      //         minY: q2minY,
	      //         maxY: q2maxY
	      //       },
	      //       3: {
	      //         minX: q3minX,
	      //         maxX: q3maxX,
	      //         minY: q3minY,
	      //         maxY: q3maxY
	      //       },
	      //       4: {
	      //         minX: q4minX,
	      //         maxX: q4maxX,
	      //         minY: q4minY,
	      //         maxY: q4maxY
	      //       }
	      //     };
	      //
	      //     generateRandomBezierPath.bind(this)(usableArea);
	      //
	      //   }
	      // }
	      //
	      //let's try to make some weird wavy thing for the distortion
	      
	      let renderRadius = drum.playing ? this.radius : this.radius * 0.85;
	      //
	      // if (this.sequencer.paused && drum.playing){
	      //   console.log(beatNum + drum.name);
	      //
	      // }
	      
	      
	      this.ctx.fillStyle = drum.playing ? playColor : fadeColor;
	      this.ctx.strokeStyle = "black";
	      this.ctx.beginPath();
	      this.ctx.arc(
	        drum.pos[0],
	        drum.pos[1],
	        renderRadius,
	        0,
	        2 * Math.PI,
	        false
	      );
	      this.ctx.stroke();
	      this.ctx.fill();
	    });
	    
	  });
	  
	  if (this.mouseImageArcsArgs.length > 0){
	    this.mouseImageArcsArgs.forEach( (args, idx) => {
	      
	      let alpha = 1.0 - (Math.pow(2, idx) * 0.05) ;
	      let rbValue = 128 - (Math.pow(2, idx) * 5);
	      this.ctx.fillStyle = `rgba(${rbValue}, 0, ${rbValue}, ${alpha})`;
	      this.ctx.beginPath();
	      this.ctx.arc(...args);
	      this.ctx.fill();
	      
	  });
	  
	  
	  if (this.sequencer.filters.distortion && (this.shouldRenderWaves || this.waveFadeCountdown > 0)){
	  
	    let newWave = false;
	  
	    for (let i = 0; i < 4; i++){
	      if (!this.distortionRenders[i]){
	        this.distortionRenders[i] = [];
	      }
	  
	      if (this.distortionRenders[i][this.waveIndex] &&
	        this.distortionRenders[i][this.waveIndex].startTime +
	        this.distortionRenders[i][this.waveIndex].duration <= this.sequencer.currentTime() ){
	          if (this.xScaled > 70){
	            this.waveIndex ++;
	            newWave = true;
	            
	          }
	          else {
	            this.shouldRenderWaves = false;
	            this.waveFadeCountdown--;
	            this.waveIndex++;
	            newWave = true;
	          }
	          
	        }
	  
	        let currentWave = this.distortionRenders[i][this.waveIndex];
	        let nextWave = this.distortionRenders[i][this.waveIndex + 1];
	  
	        if (!currentWave){
	          currentWave = generateWave.bind(this)(this.sequencer.currentTime());
	          renderWave.bind(this)(currentWave);
	          this.distortionRenders[i].push(currentWave);
	        }
	        else if (newWave){
	          renderWave.bind(this)(currentWave);
	        }
	        else {
	          if (!nextWave){
	            nextWave = generateWave.bind(this)(currentWave.startTime + currentWave.duration);
	            this.distortionRenders[i].push(nextWave);
	          }
	  
	          //now we have everything we need
	          let basePoints = currentWave.points;
	          let baseControlPoints = currentWave.controlPoints;
	  
	          let nextPoints = nextWave.points;
	          let nextControlPoints = nextWave.controlPoints;
	          let numSegments = 20;
	          let currentSegment = Math.ceil( ( numSegments * (this.sequencer.currentTime() - currentWave.startTime) ) / (currentWave.duration));
	          let percentDone = currentSegment / numSegments;
	          let transitionPoints = basePoints.map( (point, i) => {
	            let nextPoint = nextPoints[i];
	            let dx = (nextPoint[0] - point[0]) * (currentSegment / numSegments);
	            let dy = (nextPoint[1] - point[1]) * (currentSegment / numSegments);
	            let x = (point[0] + dx);
	            let y = (point[1] + dy);
	            return [x, y];
	  
	          });
	          let transitionControlPoints = {};
	  
	          for (let key in baseControlPoints){
	            transitionControlPoints[key] = [];
	            let pointsForIndex = baseControlPoints[key];
	            let nextPointsForIndex = nextControlPoints[key];
	  
	            for (let i = 0; i < pointsForIndex.length; i++){
	              let controlPoint = pointsForIndex[i];
	              let nextControlPoint = nextPointsForIndex[i];
	              let dx = (controlPoint[0] - nextControlPoint[0]) * (currentSegment / numSegments);
	              let dy = (controlPoint[1] - nextControlPoint[1]) * (currentSegment / numSegments);
	              let x = controlPoint[0] + dx;
	              let y = controlPoint[1] + dy;
	              transitionControlPoints[key].push([x,y]);
	            }
	          }
	          let transitionWave = Object.assign({}, currentWave);
	          transitionWave.points = transitionPoints;
	          transitionWave.controlPoints = transitionControlPoints;
	          
	          //this does wacky things
	          currentWave.points = transitionPoints;
	          
	          renderWave.bind(this)(transitionWave);
	        }
	    }
	  
	  
	  }
	  
	    
	    
	    
	    
	  }
	
	  this.sequencer.callScheduler();
	  requestAnimFrame(draw.bind(this));
	};
	  
	
	const setDragImage = function(e){
	  e.preventDefault();
	  let coords = Util.getCursorPositionInCanvas.bind(this)(this.canvas, e);
	  this.cursorX = coords.x;
	  this.cursorY = coords.y;
	  if (this.dragging && !this.sequencer.paused){
	    this.mouseImageArcsArgs.unshift([
	      coords.x,
	      coords.y,
	      this.radius,
	      0,
	      2*Math.PI,
	      false
	    ]);
	    if (this.mouseImageArcsArgs.length >= 6){
	      this.mouseImageArcsArgs.pop();
	    }
	    this.xScaled = (coords.x * 100)/this.canvas.width;
	    this.yScaled = (coords.y * 100)/this.canvas.height;
	    this.sequencer.updateFilters(this.xScaled, this.yScaled);
	    
	  }
	  else {
	    this.mouseImageArcsArgs = [];
	    this.waveFadeCountdown = 0;
	    this.sequencer.resetFilters();
	  }
	};
	
	const turnOffDragging = function(e){
	  this.dragging = false;
	};
	
	const turnOnDragging = function(e){
	  this.dragging = true;
	};
	
	const generateRandomBezierPath = function(usableStartArea){
	  
	  let quadrant = Math.floor(Math.random() * (5 - 1) + 1);
	  
	  let startX = Math.floor(Math.random() * (usableStartArea[quadrant].maxX - usableStartArea[quadrant].minX) + usableStartArea[quadrant].minX);
	  let startY = Math.floor(Math.random() * (usableStartArea[quadrant].maxY - usableStartArea[quadrant].minY) + usableStartArea[quadrant].minY);
	  
	  //5X5 range
	  
	  let newMaxX = startX + 15;
	  let newMinX = startX - 15;
	  let newMaxY = startY + 15;
	  let newMinY = startY - 15;
	  
	  let cp1x = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
	  let cp1y = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);
	  let cp2x = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
	  let cp2y = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);
	  let endX = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
	  let endY = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);
	
	  this.ctx.beginPath();
	  this.ctx.moveTo(startX, startY);
	  this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
	  this.ctx.strokeStyle = `rgba(81, 144, 200, 0.5)`;
	  this.ctx.stroke();
	  
	};
	
	const generateWave = function(startTime){
	  
	  let wavePoints = generateWavePoints.bind(this)();
	  let controlPoints = {};
	  for (let i = 0; i < wavePoints.length - 1; i++){
	    let points = generateControlPointsForPoints.bind(this)(wavePoints[i], wavePoints[i+1]);
	    controlPoints[i] = points;
	  }
	  let duration = (this.sequencer.tempo / 4) / 60; //change over the course of a half note
	  
	  let lightBlue = {
	    r: 8,
	    g: 40,
	    b: 59
	  };
	  
	  let darkBlue = {
	    r: 4,
	    g: 20,
	    b: 40
	  };
	  
	  let r = Math.floor(darkBlue.r + ((lightBlue.r - darkBlue.r) * ((this.xScaled - 70) / 30)));
	  let g = Math.floor(darkBlue.g + ((lightBlue.g - darkBlue.g) * ((this.xScaled - 70) / 30)));
	  let b = Math.floor(darkBlue.b + ((lightBlue.b - darkBlue.b) * ((this.xScaled - 70) / 30)));
	  
	  let waveColor = `rgb(${r}, ${g}, ${b})`;
	  
	  let newWave = {
	    points: wavePoints,
	    controlPoints: controlPoints,
	    startTime: startTime,
	    duration: duration,
	    color: waveColor
	  };
	  
	  return newWave;
	};
	
	const generateWavePoints = function(){
	  //build a wave object
	  let points = [];
	  let drumArea = this.canvas.width - ( 2 * this.padding );
	  
	  let minY = (this.canvas.height/2) - ( (this.canvas.height/2) * ((this.xScaled - 70) / 30) );
	  let maxY = (this.canvas.height/2) + ( (this.canvas.height/2) * ((this.xScaled - 70) / 30) );
	  
	  for ( let i = 0; i < 4; i++ ){
	    let minX = this.padding + ( ( drumArea / 4 ) * i );
	    let maxX = this.padding + ( ( drumArea /4 ) * ( i + 1 ) );
	    let x = Util.randomInt(minX, maxX);
	    let y = Util.randomInt(minY, maxY);
	    points.push([x,y]);
	  }
	  
	  return points;
	};
	
	const generateControlPointsForPoints = function(startPoint, endPoint){
	  let controlPoints = [];
	  
	  let minY = (this.canvas.height/2) - ( (this.canvas.height/2) * ((this.xScaled - 70) /30) );
	  let maxY = (this.canvas.height/2) + ( (this.canvas.height/2) * ((this.xScaled - 70) /70) );
	  //we need two control points
	  while (controlPoints.length < 2) {
	    
	    let controlPoint;
	    let minX;
	    let maxX;
	    
	    if (controlPoints[0]){
	      minX = controlPoints[0][0] + 5;
	      maxX = endPoint[0] - 5;
	    }
	    else {
	      minX = startPoint[0] + 5;
	      maxX = endPoint[0] - 10;
	    }
	    
	    let x = Util.randomInt(minX, maxX);
	    let y = Util.randomInt(minY, maxY);
	    
	    controlPoints.push([x,y]);
	  }
	  return controlPoints;
	};
	
	const renderWave = function(wave){
	  
	  this.ctx.globalCompositeOperation='destination-over';
	  wave.points.forEach( (point, idx, arr) => {
	    let nextPoint = arr[idx + 1];
	    if (nextPoint){
	      let controlPoints = wave.controlPoints[idx];
	      this.ctx.beginPath();
	      this.ctx.moveTo(point[0], point[1]);
	      this.ctx.bezierCurveTo(controlPoints[0][0], controlPoints[0][1], controlPoints[1][0], controlPoints[1][1], nextPoint[0], nextPoint[1]);
	      this.ctx.strokeStyle = wave.color;
	      this.ctx.stroke();
	    }
	  });
	};
	
	module.exports = Visualizer;


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map