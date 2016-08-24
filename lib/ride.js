const Cymbal = require('./cymbal');
const Util = require('./util');

const Ride = function(options = {}){
  options.name = "ride";
  
  options.frequency = 500;
  options.duration = 0.2;
  
  options.colors = {
    clean: {
      r: 196,
      g: 85,
      b: 105
    },
    saturated: {
      r: 110,
      g: 2,
      b: 21
    },
    unsaturated: {
      r: 255,
      b: 192,
      g: 203
    }
  };
    
  
  Cymbal.call(this, options);
};

Util.inherits(Ride, Cymbal);

module.exports = Ride;
