const Cymbal = require('./cymbal');
const Util = require('./util');

const HiHat = function(options = {}){
  options.frequency = 100;
  options.duration = 0.15;
  Cymbal.call(this, options);
};

Util.inherits(HiHat, Cymbal);



module.exports = HiHat;
