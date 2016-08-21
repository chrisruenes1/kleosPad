const Util = {
  inherits: function(Child, Parent){
    const Surrogate = function(){};
    Surrogate.prototype = Parent.prototype;
    Child.prototype = new Surrogate();
    Child.prototype.constructor = Child;
  }
};



module.exports = Util;
