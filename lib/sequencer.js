const Kick = require('./kick');
const Snare = require('./snare');
const HiHat = require('./hi_hat');
const Ride = require('./ride');
const Patterns = require('./patterns');
const WebAudioContext = require('./web_audio_context');

const Sequencer = function(options ={}){
  
  this.audioContext = WebAudioContext.getContext();
  
  this.kick = new Kick();
  this.snare = new Snare();
  this.hiHat = new HiHat();
  this.ride = new Ride();
  
  this.tempo = 75;
  this.nextNoteTime = 0;
  this.currentSixteenthNote = 0;
  let schedulingRange = 0.1; //webaudio clock, in seconds
  this.scheduledNotes = [];
  this.lookahead = 25; //js clock, in milliseconds
  const INSTRUMENTS = {
    "kick": Kick,
    "snare": Snare,
    "hiHat": HiHat,
    "ride": Ride
  };
  
  this.patternName = options.patternName;
  if (!this.patternName){
    this.patternName = "heartless";
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

Sequencer.prototype.sequence = function(){
  this.nextNoteTime = this.audioContext.currentTime;
  window.setInterval( () => {
    this.scheduler();
  }, this.lookahead);
};


module.exports = Sequencer;