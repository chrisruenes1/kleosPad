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
	
	let kick = new Kick();
	
	window.setInterval(() => {
	  kick.play();
	}, 400);


/***/ },
/* 1 */
/***/ function(module, exports) {

	const Drum = function(options){
	  this.context = new AudioContext();
	  this.duration = options.duration;
	  this.decay = options.decay;
	  this.frequency = options.frequency;
	};
	
	
	Drum.prototype.generateEnvelope = function(){
	  let envelope = this.context.createGain();
	  envelope.gain.setValueAtTime(1, this.context.currentTime);
	  return envelope;
	};
	
	Drum.prototype.generateBiquadFilter = function(options){
	  let filter = this.context.createBiquadFilter();
	  noiseFilter.type = options.type;
	  noiseFilter.frequency.value = options.cutoffFreq;
	  return filter;
	};
	
	Drum.prototype.generateOscillator = function(){
	  let oscillator = this.context.createOscillator();
	  oscillator.frequency = this.frequency;
	  return oscillator;
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
	  
	  this.envelope.connect(this.context.destination);
	  this.oscillator.connect(this.envelope);
	  
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


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map