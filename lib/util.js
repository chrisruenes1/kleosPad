const Util = {
  inherits: function(Child, Parent){
    const Surrogate = function(){};
    Surrogate.prototype = Parent.prototype;
    Child.prototype = new Surrogate();
    Child.prototype.constructor = Child;
  },
  randomInt: function(min, max){
    return Math.floor(Math.random() * (max - min) + min);
  }
};



module.exports = Util;
