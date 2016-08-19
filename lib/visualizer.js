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
  this.ctx = canvas.getContext('2d');
  draw.call(this);
};

const draw = function(){
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
      this.ctx.fillStyle = drum.playing ? drum.color : "white";
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
  requestAnimFrame(draw.bind(this));
};

module.exports = Visualizer;
