const Cymbal = require('./cymbal');
const Util = require('./util');

const Ride = function(options = {}){
  options.name = "ride";
  
  options.frequency = 500;
  options.duration = 0.4;
  
  options.color = "pink";
  
  Cymbal.call(this, options);
};

Util.inherits(Ride, Cymbal);

module.exports = Ride;
