const Cymbal = require('./cymbal');
const Util = require('./util');

const Ride = function(options = {}){
  options.frequency = 300;
  options.duration = 0.4;
  Cymbal.call(this, options);
};

Util.inherits(Ride, Cymbal);

module.exports = Ride;
