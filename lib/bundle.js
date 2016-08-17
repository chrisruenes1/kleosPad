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

	const Drum = __webpack_require__(1);
	
	let drum = new Drum({
	  frequency:50,
	  duration: 0.5 //seconds
	});
	
	// window.setInterval(() => {
	//   drum.play();
	// }, 400);


/***/ },
/* 1 */
/***/ function(module, exports) {

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


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map