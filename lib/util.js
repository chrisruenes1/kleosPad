const Util = {
  inherits: function(Child, Parent){
    const Surrogate = function(){};
    Surrogate.prototype = Parent.prototype;
    Child.prototype = new Surrogate();
    Child.prototype.constructor = Child;
  },
  randomInt: function(min, max){
    return Math.floor(Math.random() * (max - min) + min);
  },
  getCursorPositionInCanvas(canvas, event){ //thanks to patriques http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return {x: x, y: y};
  },
  getSelectedDrumInCanvas(drumPositions, canvas, event){
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    return drumPositions.find( (drumPos) => {
      if (Math.pow(x - drumPos.pos[0], 2) + Math.pow(y - drumPos.pos[1], 2) <= Math.pow(drumPos.rad, 2)) {
        return true;
      }
      else {
        return false;
      }
    });
  }
};

module.exports = Util;
