const Cymbal = require('./cymbal');
const Util = require('./util');

const HiHat = function(options = {}){
  options.name = "hiHat";
  
  options.frequency = 50;
  options.duration = 0.2;
  
  options.colors = {
    clean: "rgb(0, 0, 255)",
    saturated: "rgb(2, 2, 87)",
    unsaturated: "rgb(174, 174, 241)"
  };
  
  Cymbal.call(this, options);
};

Util.inherits(HiHat, Cymbal);



module.exports = HiHat;
