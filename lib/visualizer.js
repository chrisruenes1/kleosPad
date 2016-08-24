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
  this.canvas.addEventListener('mouseout', turnOffDragging.bind(this));
  
  this.mouseImageArcsArgs = []; //a queue of positions to allow for a visual tail
  
  this.dragging = false;
  
  this.ctx = canvas.getContext('2d');
  draw.call(this);
};

const draw = function(){
  this.canvas.width = window.innerWidth * 0.85;
  this.canvas.height = window.innerHeight * 0.85;
  
  let pattern = this.sequencer.pattern;
  let patternLength = pattern.length;
  
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  let maxRadialWidth = (((this.canvas.width - (this.canvas.width / 10) ) / patternLength) / 2);
  let maxRadialHeight = ((this.canvas.height - (this.canvas.height / 10))/12);
  this.radius = maxRadialWidth < maxRadialHeight ? maxRadialWidth : maxRadialHeight; //chose whichever constraint is smaller
  let padding = 0.4 * this.radius;
  let verticalCenter = (this.canvas.height - ( ( (this.radius * 2) + (padding * 2) ) * 4) )/ 2;
  
  pattern.forEach( (drums, idx) => {
    let beatNum = idx + 1;
    
    drums.forEach( (drum) => {
      let x = ( (this.canvas.width - (padding * 2) ) / patternLength) * beatNum + padding - this.radius ;
      let y = (((2 * this.radius) + padding) * DRUM_STAFF[drum.name] ) + verticalCenter;
      drum.setPos([x,y]);
      
      this.canvas.style.background = "black";
      this.ctx.fillStyle = drum.playing ? drum.color : "black";
      this.ctx.strokeStyle = "black";
      this.ctx.beginPath();
      this.ctx.arc(
        drum.pos[0],
        drum.pos[1],
        this.radius,
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
  if (!this.sequencer.paused){
    this.sequencer.callScheduler();
  }
  
  requestAnimFrame(draw.bind(this));
};

const setDragImage = function(e){
  e.preventDefault();
  if (this.dragging && !this.sequencer.paused){
    this.mouseImageArcsArgs.unshift([
      e.pageX,
      e.pageY,
      this.radius,
      0,
      2*Math.PI,
      false
    ]);
    if (this.mouseImageArcsArgs.length >= 6){
      this.mouseImageArcsArgs.pop();
    }
    //scale to a percent of total screen size
    let xScaled = (e.pageX * 100)/this.canvas.width;
    let yScaled = (e.pageY * 100)/this.canvas.height;
    this.sequencer.updateFilters(xScaled, yScaled);
    
  }
  else {
    this.mouseImageArcsArgs = [];
    this.sequencer.resetFilters();
  }
};

const turnOffDragging = function(e){
  this.dragging = false;
};

const turnOnDragging = function(e){
  this.dragging = true;
};


module.exports = Visualizer;
