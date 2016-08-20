const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Patterns = require('./patterns');
const WebAudioContext = require('./web_audio_context');

const Sequencer = function(){
  
  const INSTRUMENTS = {
    "kick": Kick,
    "snare": Snare,
    "hiHat": HiHat,
    "ride": Ride
  };
  
  this.audioContext = WebAudioContext.getContext();
  
  this.tempo = 120;
  this.nextNoteTime = 0;
  this.currentSixteenthNote = 0;
  let schedulingRange = 0.15; //webaudio clock, in seconds
  this.scheduledNotes = [];
  this.lookahead = 15.0; //js clock, in milliseconds
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
  this.filterNodes = {};
  
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
    let filters = [];
    for (let key in this.filterNodes){
      filters.push(this.filterNodes[key]);
    }
    hits.forEach( (hit) => {
      // let instrument = INSTRUMENTS[hit];
      hit.play(time, filters);
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

const updateLeftVertFilter = function(yScaled){
  //update bandpass
  let freq = 50 + ((19950/100) * yScaled); //aim for freq range of 50-20000
  
  if (this.filterNodes.biquad){
    this.filterNodes.biquad.node.frequency.value = freq;
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
    this.filterNodes.biquad = filter;
  }
};

const updateRightVertFilter = function(yScaled){
  
   
  
};

const updateBottomHorizFilter = function(xScaled){
  //update distortion
  if (this.filterNodes.distortion){
    this.filterNodes.distortion.node.curve = generateDistortionCurve(xScaled);
  }
  else {
    let distortionNode = this.audioContext.createWaveShaper();
    distortionNode.curve = generateDistortionCurve(xScaled);
    distortionNode.oversample = "4x";
    let filter = {
      node: distortionNode,
      splitAudioGraph: true
    };
    this.filterNodes.distortion = filter;
  }
};

const updateTopHorizFilter = function(xScaled){
  //only update every 50ms to avoid whacky space sounds
  let delayTime = (xScaled/200).toPrecision(1); //0-1 seconds delay

  if (this.filterNodes.echo){
    this.filterNodes.echo.node.delayTime.value = delayTime;
  }
  else {
    let echoNode = this.audioContext.createDelay();
    echoNode.delayTime.value = delayTime;
    let filter = {
      node: echoNode,
      splitAudioGraph: true
    };
    this.filterNodes.echo = filter;
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
  this.filterNodes = [];
};


module.exports = Sequencer;
