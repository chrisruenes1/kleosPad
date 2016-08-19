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
  
  //initialize (essentially unused) filters
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
  //update notch
  let freq = 50 + ((19950/100) * yScaled); //aim for freq range of 50-15000
  
  if (this.filterNodes.biquad){
    this.filterNodes.biquad.frequency.value = freq;
  }
  else {
    //set it up if it has not yet been added
    let biquad = this.audioContext.createBiquadFilter();
    biquad.type = "bandpass";
    biquad.frequency.value = freq;
    this.filterNodes.biquad = biquad;
  }
  
};

Sequencer.prototype.resetFilters = function(){
  //called in visualizer mouseup
  
  this.filterNodes = [];
};


module.exports = Sequencer;
