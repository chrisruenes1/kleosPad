const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Patterns = require('./patterns');
const WebAudioContext = require('./web_audio_context');
const APIUtil = require('./api_util');

const Sequencer = function(){
  
  const INSTRUMENTS = {
    "kick": Kick,
    "snare": Snare,
    "hiHat": HiHat,
    "ride": Ride
  };
  
  $( () => {
    $('#play').click( (e) => {
      e.preventDefault();
      togglePaused.bind(this)();
    });
  });
  
  this.nextNoteTime = 0;
  this.paused = true;
  this.tempo = 200;
  this.currentSixteenthNote = 0;
  let schedulingRange = 1.5; //webaudio clock, in seconds
  this.scheduledNotes = [];
  this.lookahead = 75.0; //js clock, in milliseconds
  if (!this.patternName){
    this.patternName = "goingHome";
  }
  this.pattern = Patterns[this.patternName].map( (hits) => {
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
    if (time > this.currentTime()){
      let hits = this.pattern[beatNumber];
      let filters = [];
      for (let key in this.filters){
        filters.push(this.filters[key]);
      }
      hits.forEach( (hit) => {
        // let instrument = INSTRUMENTS[hit];
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
  APIUtil.fetchImpulseResponseAudio(saveAudio.bind(this));
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
  updateLeftVertFilter.call(this, yScaled);
  updateRightVertFilter.call(this, yScaled);
  updateTopHorizFilter.call(this, xScaled);
  updateBottomHorizFilter.call(this, xScaled);
};
  
const togglePaused = function(){
  if (!this.audioContext){
    this.audioContext = WebAudioContext.getContext();
  }
  this.paused = !this.paused;
  let text = this.paused ? "PLAY" : "PAUSE";
  $("#play").html(text);
  if (!this.paused){
    this.scheduler();
  }
};

const saveAudio = function(audio){
  this.impulseResponseAudio = audio;
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
  this.filters = [];
};


module.exports = Sequencer;
