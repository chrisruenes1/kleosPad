const Cymbal = require('./cymbal');
const Util = require('./util');

const HiHat = function(options = {}){
  options.frequency = 50;
  options.duration = 0.3;
  Cymbal.call(this, options);
};

Util.inherits(HiHat, Cymbal);



module.exports = HiHat;
