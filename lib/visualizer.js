let Util = require('./util');
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
  this.distortionRenders = {};
  this.waveIndex = 0;
  this.shouldRenderWaves = false;
  this.waveFadeCountdown = 3;
  
  
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
  this.padding = 0.4 * this.radius;
  let verticalCenter = (this.canvas.height - ( ( (this.radius * 2) + (this.padding * 2) ) * 4) )/ 2;
  
  if (this.xScaled > 70 ) {
    this.shouldRenderWaves = true;
    this.waveFadeCountdown = 3;
  }
  
  pattern.forEach( (drums, idx) => {
    let beatNum = idx + 1;
    
    drums.forEach( (drum) => {
      let x = ( (this.canvas.width - (this.padding * 2) ) / patternLength) * beatNum + this.padding - this.radius ;
      let y = (((2 * this.radius) + this.padding) * DRUM_STAFF[drum.name] ) + verticalCenter;
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
      
      //DISTORTION
      
      //randomly generate *spark* data using Bezier Paths
      
      // if (this.sequencer.filters.distortion && drum.playing && this.xScaled > 20){ //
      //   //pick a random number, with the range decreasing as the distortion increases
      //   //a zero selected will cause a path to be drawn
      //   let max = Math.ceil( ((this.canvas.width - this.cursorX) / 1000 ) * 50) + 2; //targeting ~2 - 52 max
      //   let min = 1;
      //   let picked = Math.floor(Math.random() * (max - min) + min); //rand between 1 and max
      //
      //   if (picked === 1) { //more or less arbitrary, but since min will always be an option
      //
      //     let q1minX = drum.pos[0] + this.radius;
      //     let q1maxX = q1minX + 5;
      //     let q1minY = drum.pos[1] - this.radius;
      //     let q1maxY = q1minY - 5;
      //
      //     let q2minX = drum.pos[0] - this.radius;
      //     let q2maxX = q2minX - 5;
      //     let q2minY = drum.pos[1] + this.radius;
      //     let q2maxY = q2minY + 5;
      //
      //     let q3minX = drum.pos[0] - this.radius;
      //     let q3maxX = q3minX - 5;
      //     let q3minY = drum.pos[1] - this.radius;
      //     let q3maxY = q3minY - 5;
      //
      //     let q4minX = drum.pos[0] + this.radius;
      //     let q4maxX = q4minX + 5;
      //     let q4minY = drum.pos[1] + this.radius;
      //     let q4maxY = q4minY + 5;
      //
      //
      //     let usableArea = {
      //       1:{
      //         minX: q1minX,
      //         maxX: q1maxX,
      //         minY: q1minY,
      //         maxY: q1maxY
      //       },
      //       2: {
      //         minX: q2minX,
      //         maxX: q2maxX,
      //         minY: q2minY,
      //         maxY: q2maxY
      //       },
      //       3: {
      //         minX: q3minX,
      //         maxX: q3maxX,
      //         minY: q3minY,
      //         maxY: q3maxY
      //       },
      //       4: {
      //         minX: q4minX,
      //         maxX: q4maxX,
      //         minY: q4minY,
      //         maxY: q4maxY
      //       }
      //     };
      //
      //     generateRandomBezierPath.bind(this)(usableArea);
      //
      //   }
      // }
      //
      //let's try to make some weird wavy thing for the distortion
      
      let renderRadius = drum.playing ? this.radius : this.radius * 0.85;
      //
      // if (this.sequencer.paused && drum.playing){
      //   console.log(beatNum + drum.name);
      //
      // }
      
      
      this.ctx.fillStyle = drum.playing ? playColor : fadeColor;
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
  
  
  if (this.sequencer.filters.distortion && (this.shouldRenderWaves || this.waveFadeCountdown > 0)){
  
    let newWave = false;
  
    for (let i = 0; i < 4; i++){
      if (!this.distortionRenders[i]){
        this.distortionRenders[i] = [];
      }
  
      if (this.distortionRenders[i][this.waveIndex] &&
        this.distortionRenders[i][this.waveIndex].startTime +
        this.distortionRenders[i][this.waveIndex].duration <= this.sequencer.currentTime() ){
          if (this.xScaled > 70){
            this.waveIndex ++;
            newWave = true;
            
          }
          else {
            this.shouldRenderWaves = false;
            this.waveFadeCountdown--;
            this.waveIndex++;
            newWave = true;
          }
          
        }
  
        let currentWave = this.distortionRenders[i][this.waveIndex];
        let nextWave = this.distortionRenders[i][this.waveIndex + 1];
  
        if (!currentWave){
          currentWave = generateWave.bind(this)(this.sequencer.currentTime());
          renderWave.bind(this)(currentWave);
          this.distortionRenders[i].push(currentWave);
        }
        else if (newWave){
          renderWave.bind(this)(currentWave);
        }
        else {
          if (!nextWave){
            nextWave = generateWave.bind(this)(currentWave.startTime + currentWave.duration);
            this.distortionRenders[i].push(nextWave);
          }
  
          //now we have everything we need
          let basePoints = currentWave.points;
          let baseControlPoints = currentWave.controlPoints;
  
          let nextPoints = nextWave.points;
          let nextControlPoints = nextWave.controlPoints;
          let numSegments = 20;
          let currentSegment = Math.ceil( ( numSegments * (this.sequencer.currentTime() - currentWave.startTime) ) / (currentWave.duration));
          let percentDone = currentSegment / numSegments;
          let transitionPoints = basePoints.map( (point, i) => {
            let nextPoint = nextPoints[i];
            let dx = (nextPoint[0] - point[0]) * (currentSegment / numSegments);
            let dy = (nextPoint[1] - point[1]) * (currentSegment / numSegments);
            let x = (point[0] + dx);
            let y = (point[1] + dy);
            return [x, y];
  
          });
          let transitionControlPoints = {};
  
          for (let key in baseControlPoints){
            transitionControlPoints[key] = [];
            let pointsForIndex = baseControlPoints[key];
            let nextPointsForIndex = nextControlPoints[key];
  
            for (let i = 0; i < pointsForIndex.length; i++){
              let controlPoint = pointsForIndex[i];
              let nextControlPoint = nextPointsForIndex[i];
              let dx = (controlPoint[0] - nextControlPoint[0]) * (currentSegment / numSegments);
              let dy = (controlPoint[1] - nextControlPoint[1]) * (currentSegment / numSegments);
              let x = controlPoint[0] + dx;
              let y = controlPoint[1] + dy;
              transitionControlPoints[key].push([x,y]);
            }
          }
          let transitionWave = Object.assign({}, currentWave);
          transitionWave.points = transitionPoints;
          transitionWave.controlPoints = transitionControlPoints;
          
          //this does wacky things
          currentWave.points = transitionPoints;
          
          renderWave.bind(this)(transitionWave);
        }
    }
  
  
  }
  
    
    
    
    
  }

  this.sequencer.callScheduler();
  requestAnimFrame(draw.bind(this));
};
  

const setDragImage = function(e){
  e.preventDefault();
  let coords = Util.getCursorPositionInCanvas.bind(this)(this.canvas, e);
  this.cursorX = coords.x;
  this.cursorY = coords.y;
  if (this.dragging && !this.sequencer.paused){
    this.mouseImageArcsArgs.unshift([
      coords.x,
      coords.y,
      this.radius,
      0,
      2*Math.PI,
      false
    ]);
    if (this.mouseImageArcsArgs.length >= 6){
      this.mouseImageArcsArgs.pop();
    }
    this.xScaled = (coords.x * 100)/this.canvas.width;
    this.yScaled = (coords.y * 100)/this.canvas.height;
    this.sequencer.updateFilters(this.xScaled, this.yScaled);
    
  }
  else {
    this.mouseImageArcsArgs = [];
    this.waveFadeCountdown = 0;
    this.sequencer.resetFilters();
  }
};

const turnOffDragging = function(e){
  this.dragging = false;
};

const turnOnDragging = function(e){
  this.dragging = true;
};

const generateRandomBezierPath = function(usableStartArea){
  
  let quadrant = Math.floor(Math.random() * (5 - 1) + 1);
  
  let startX = Math.floor(Math.random() * (usableStartArea[quadrant].maxX - usableStartArea[quadrant].minX) + usableStartArea[quadrant].minX);
  let startY = Math.floor(Math.random() * (usableStartArea[quadrant].maxY - usableStartArea[quadrant].minY) + usableStartArea[quadrant].minY);
  
  //5X5 range
  
  let newMaxX = startX + 15;
  let newMinX = startX - 15;
  let newMaxY = startY + 15;
  let newMinY = startY - 15;
  
  let cp1x = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
  let cp1y = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);
  let cp2x = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
  let cp2y = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);
  let endX = Math.floor(Math.random() * (newMaxX - newMinX) + newMinX);
  let endY = Math.floor(Math.random() * (newMaxY - newMinY) + newMinY);

  this.ctx.beginPath();
  this.ctx.moveTo(startX, startY);
  this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  this.ctx.strokeStyle = `rgba(81, 144, 200, 0.5)`;
  this.ctx.stroke();
  
};

const generateWave = function(startTime){
  
  let wavePoints = generateWavePoints.bind(this)();
  let controlPoints = {};
  for (let i = 0; i < wavePoints.length - 1; i++){
    let points = generateControlPointsForPoints.bind(this)(wavePoints[i], wavePoints[i+1]);
    controlPoints[i] = points;
  }
  let duration = (this.sequencer.tempo / 4) / 60; //change over the course of a half note
  
  let lightBlue = {
    r: 8,
    g: 40,
    b: 59
  };
  
  let darkBlue = {
    r: 4,
    g: 20,
    b: 40
  };
  
  let r = Math.floor(darkBlue.r + ((lightBlue.r - darkBlue.r) * ((this.xScaled - 70) / 30)));
  let g = Math.floor(darkBlue.g + ((lightBlue.g - darkBlue.g) * ((this.xScaled - 70) / 30)));
  let b = Math.floor(darkBlue.b + ((lightBlue.b - darkBlue.b) * ((this.xScaled - 70) / 30)));
  
  let waveColor = `rgb(${r}, ${g}, ${b})`;
  
  let newWave = {
    points: wavePoints,
    controlPoints: controlPoints,
    startTime: startTime,
    duration: duration,
    color: waveColor
  };
  
  return newWave;
};

const generateWavePoints = function(){
  //build a wave object
  let points = [];
  let drumArea = this.canvas.width - ( 2 * this.padding );
  
  let minY = (this.canvas.height/2) - ( (this.canvas.height/2) * ((this.xScaled - 70) / 30) );
  let maxY = (this.canvas.height/2) + ( (this.canvas.height/2) * ((this.xScaled - 70) / 30) );
  
  for ( let i = 0; i < 4; i++ ){
    let minX = this.padding + ( ( drumArea / 4 ) * i );
    let maxX = this.padding + ( ( drumArea /4 ) * ( i + 1 ) );
    let x = Util.randomInt(minX, maxX);
    let y = Util.randomInt(minY, maxY);
    points.push([x,y]);
  }
  
  return points;
};

const generateControlPointsForPoints = function(startPoint, endPoint){
  let controlPoints = [];
  
  let minY = (this.canvas.height/2) - ( (this.canvas.height/2) * ((this.xScaled - 70) /30) );
  let maxY = (this.canvas.height/2) + ( (this.canvas.height/2) * ((this.xScaled - 70) /70) );
  //we need two control points
  while (controlPoints.length < 2) {
    
    let controlPoint;
    let minX;
    let maxX;
    
    if (controlPoints[0]){
      minX = controlPoints[0][0] + 5;
      maxX = endPoint[0] - 5;
    }
    else {
      minX = startPoint[0] + 5;
      maxX = endPoint[0] - 10;
    }
    
    let x = Util.randomInt(minX, maxX);
    let y = Util.randomInt(minY, maxY);
    
    controlPoints.push([x,y]);
  }
  return controlPoints;
};

const renderWave = function(wave){
  
  this.ctx.globalCompositeOperation='destination-over';
  wave.points.forEach( (point, idx, arr) => {
    let nextPoint = arr[idx + 1];
    if (nextPoint){
      let controlPoints = wave.controlPoints[idx];
      this.ctx.beginPath();
      this.ctx.moveTo(point[0], point[1]);
      this.ctx.bezierCurveTo(controlPoints[0][0], controlPoints[0][1], controlPoints[1][0], controlPoints[1][1], nextPoint[0], nextPoint[1]);
      this.ctx.strokeStyle = wave.color;
      this.ctx.stroke();
    }
  });
};

module.exports = Visualizer;
