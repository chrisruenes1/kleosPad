const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Patterns = require('./patterns');
const WebAudioContext = require('./web_audio_context');
const APIUtil = require('./api_util');

const Sequencer = function(){
  
  this.audioContext = WebAudioContext.getContext();
  this.tempo = 120;
  this.nextNoteTime = 0;
  this.paused = true;
  this.currentSixteenthNote = 0;
  this.schedulingRange = 1.5; //webaudio clock, in seconds
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
  
  
  $( () => {
    $('#play').click( (e) => {
      e.preventDefault();
      togglePaused.bind(this)();
      $(e.currentTarget).toggleClass("navbar-selected");
    });
    
    
    $('#current-tempo').html(`&#9833 = ${this.tempo}`);
    $('#current-tempo').val(this.tempo);
    
    $('#tempo').on("input change", (e) => {
      this.tempo = e.target.value;
      $('#current-tempo').html(`&#9833 = ${this.tempo}`);
    });
    $("#pattern-one").data("name", "goingHome");
    $("#pattern-two").data("name", "heartless");
    $("#pattern-three").data("name", "bass");
    
    $("#pattern-list").click( (e) => {
      e.preventDefault();
      if (e.target !== e.currentTarget) { //we don't want to register clicks on the ul itself
        setPattern.bind(this)($(e.target).data("name"));
        $(e.currentTarget).children().each( function(){
          if (this === e.target.parentElement){
            $(this).addClass("navbar-selected");
          }
          else if ($(this).hasClass("navbar-selected")){
            $(this).removeClass("navbar-selected");
          }
        });
      }
    });
  });
  
  
  //initialize filters
  this.filters = {};
  
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
  scheduler.bind(this)();
};

Sequencer.prototype.updateFilters = function(xScaled, yScaled){ //scaled to %
  //update the filters based on the position of a mouseclick in the visualizer
  let previousFilters = Object.assign({}, this.filters);

  updateLeftVertFilter.call(this, yScaled);
  updateRightVertFilter.call(this, yScaled);
  updateTopHorizFilter.call(this, xScaled);
  updateBottomHorizFilter.call(this, xScaled);
};

const nextNote = function() {
  let beatLength = 60.0 / this.tempo;
  this.nextNoteTime += 0.25 * beatLength;
  this.currentSixteenthNote += 1;
  if (this.currentSixteenthNote == 16){
    this.currentSixteenthNote = 0;
  }
};

const scheduleNoteEvents = function( beatNumber, time ) {
  if (time > this.audioContext.currentTime && !this.paused){
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


const scheduler = function(){

  while (this.nextNoteTime < this.audioContext.currentTime + this.schedulingRange){
    scheduleNoteEvents.bind(this)( this.currentSixteenthNote, this.nextNoteTime );
    nextNote.bind(this)();
  }
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
  scheduler.bind(this)();
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
