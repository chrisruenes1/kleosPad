const Cymbal = require('./cymbal');
const Util = require('./util');

const HiHat = function(options = {}){
  options.name = "hiHat";
  
  options.frequency = 50;
  options.duration = 0.2;
  
  options.color = "red";
  
  Cymbal.call(this, options);
};

Util.inherits(HiHat, Cymbal);



module.exports = HiHat;
