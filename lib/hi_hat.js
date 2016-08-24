const Cymbal = require('./cymbal');
const Util = require('./util');

const HiHat = function(options = {}){
  options.name = "hiHat";
  
  options.frequency = 50;
  options.duration = 0.2;
  
  options.colors = {
    saturated: {
      r: 34,
      g: 0,
      b: 0
    },
    clean: {
      r: 255,
      g: 0,
      b: 0
    },
    unsaturated: {
      r: 188,
      g: 74,
      b: 74
    }
  };
  
  Cymbal.call(this, options);
};

Util.inherits(HiHat, Cymbal);



module.exports = HiHat;
