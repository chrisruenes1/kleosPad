//shim animation frame

window.requestAnimFrame = (function(){
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function( callback ){
    window.setTimeout(callback, 1000/60); //fallback to setTimeout for ~16ms with 60hz framerate
  };
});

const Visualizer = function(sequencer, ctx){
  this.sequencer = sequencer;
  this.ctx = ctx;
};


module.exports = Visualizer;
