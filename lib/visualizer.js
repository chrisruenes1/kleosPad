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
  
  this.reverbRenders = {};
  this.echoRenders = {};
  
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
      
      //EQ
      
      //determine color as function of biquadPos
      let r = drum.colors.clean.r;
      let g = drum.colors.clean.g;
      let b = drum.colors.clean.b;
      let playColor = `rgb(${r}, ${g}, ${b})`;
      
      let decimalLoc = this.yScaled / 100; //turn scaled y into a float btw 0 and 1
        
      if (this.sequencer.filters.biquad){
        r = ( ( (drum.colors.unsaturated.r - drum.colors.saturated.r ) * decimalLoc ) + drum.colors.saturated.r );
        g = ( ( (drum.colors.unsaturated.g - drum.colors.saturated.g ) * decimalLoc ) + drum.colors.saturated.g );
        b = ( ( (drum.colors.unsaturated.b - drum.colors.saturated.b ) * decimalLoc ) + drum.colors.saturated.b );
        playColor = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
      }
      
      //REVERB
      
      //determine fade value based on reverb and time passed since play
      
      //first, record reverb data
      if (drum.playing && this.sequencer.filters.reverb){
        let startTime = drum.onTime + drum.duration;
        let fadeDuration = (1 - decimalLoc) * 0.8; //maximum fadeout of 800ms for most reverb
        let endTime = startTime + fadeDuration;
        
  
        if (!this.reverbRenders[idx]){
          this.reverbRenders[idx] = {};
        }
        this.reverbRenders[idx][drum.name] = {
          start:startTime,
          end: endTime,
          r: r,
          g: g,
          b: b
        };
      }
      
      //next, process reverb data
      let reverbData = this.reverbRenders[idx];
      let currentTime = this.sequencer.currentTime();
      let fadeColor;
      if (reverbData && reverbData[drum.name] && currentTime <= reverbData[drum.name].end && currentTime >= reverbData[drum.name].start){  //second part saves trouble of removing data from object when expired
        let capturedTime = this.sequencer.currentTime();
        let fadeMultiplier = ((capturedTime - reverbData[drum.name].start) / (reverbData[drum.name].end - reverbData[drum.name].start));
        
        r = Math.abs(r - (Math.abs(reverbData[drum.name].r - 25) * fadeMultiplier));
        g = Math.abs(g - (Math.abs(reverbData[drum.name].g - 25) * fadeMultiplier));
        b = Math.abs(b - (Math.abs(reverbData[drum.name].b - 25) * fadeMultiplier));
        fadeColor = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
      } else{
        fadeColor = "rgb(25, 25, 25)";
      }
      
      //DELAY
      
      //determine outline based on echo
      
      //record first
      if (drum.playing && this.sequencer.filters.echo){
        let echoTime = Math.round((this.xScaled/200) * 10)/10;
        let startTime = drum.onTime;
        let endTime = startTime + echoTime;
        if (!this.echoRenders[idx]){
          this.echoRenders[idx] = {};
        }
        this.echoRenders[idx][drum.name] = {
          start: startTime,
          end: endTime,
          r: r,
          g: g,
          b: b
        };
      }
      
      //process
      
      //render a bigger circle (just an outline) around radius of current circle

      let echoData = this.echoRenders[idx];
      
      if (echoData && echoData[drum.name] && echoData[drum.name].start <= currentTime && echoData[drum.name].end >= currentTime){
        let outerR = echoData[drum.name].r;
        let outerG = echoData[drum.name].g;
        let outerB = echoData[drum.name].b;
        this.ctx.strokeStyle = `rgb(${Math.floor(outerR)}, ${Math.floor(outerG)}, ${Math.floor(outerB)})`;
        let delaySegment = (echoData[drum.name].end - echoData[drum.name].start) / 3;
        let timesExtra = 3 - ((Math.round(((echoData[drum.name].end - currentTime) / delaySegment))));
        let radius = this.radius + (timesExtra);
        
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
      }
      
      let renderRadius = drum.playing ? this.radius : this.radius * 0.85;
      this.ctx.fillStyle = drum.playing ? playColor : fadeColor; //play color or gray
      this.ctx.strokeStyle = "black";
      this.ctx.beginPath();
      this.ctx.arc(
        drum.pos[0],
        drum.pos[1],
        renderRadius,
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
    this.xScaled = (e.pageX * 100)/this.canvas.width;
    this.yScaled = (e.pageY * 100)/this.canvas.height;
    this.sequencer.updateFilters(this.xScaled, this.yScaled);
    
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
