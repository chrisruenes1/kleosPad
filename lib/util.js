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
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    return {x: x, y: y};
  }
};



module.exports = Util;
