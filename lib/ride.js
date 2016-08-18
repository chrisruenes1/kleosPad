const Cymbal = require('./cymbal');
const Util = require('./util');

const Ride = function(options = {}){
  options.frequency = 500;
  options.duration = 0.5;
  Cymbal.call(this, options);
};

Util.inherits(Ride, Cymbal);

module.exports = Ride;
