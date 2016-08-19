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
  
  this.mouseImageArcsArgs = []; //a queue of positions to allow for a visual tail
  
  this.dragging = false;
  
  this.ctx = canvas.getContext('2d');
  draw.call(this);
};

const draw = function(){
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
      this.canvas.style.background = 'black';
      this.ctx.fillStyle = drum.playing ? drum.color : "black";
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
  
  if (this.mouseImageArcsArgs.length > 0){
    this.mouseImageArcsArgs.forEach( (args, idx) => {
      
      let alpha = 1.0 - (Math.pow(2, idx) * 0.05) ;
      let rbValue = 128 - (Math.pow(2, idx) * 5);
      this.ctx.fillStyle = `rgba(${rbValue}, 0, ${rbValue}, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(...args);
      this.ctx.fill();
      
    });
  }
  
  requestAnimFrame(draw.bind(this));
};

const setDragImage = function(e){
  e.preventDefault();
  if (this.dragging){
    this.mouseImageArcsArgs.unshift([
      e.clientX,
      e.clientY,
      25,
      0,
      2*Math.PI,
      false
    ]);
    if (this.mouseImageArcsArgs.length >= 6){
      this.mouseImageArcsArgs.pop();
    }
  }
  else {
    this.mouseImageArcsArgs = [];
  }
};

const turnOffDragging = function(e){
  this.dragging = false;
};

const turnOnDragging = function(e){
  this.dragging = true;
};


module.exports = Visualizer;
