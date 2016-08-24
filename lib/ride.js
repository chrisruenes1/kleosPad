const Cymbal = require('./cymbal');
const Util = require('./util');

const Ride = function(options = {}){
  options.name = "ride";
  
  options.frequency = 500;
  options.duration = 0.4;
  
  options.colors = {
    clean: "rgb(204, 178, 183)",
    saturated: "rgb(110, 2, 21, 1)",
    unsaturated: "rgb(255, 192, 203, 1)"
  };
    
  
  Cymbal.call(this, options);
};

Util.inherits(Ride, Cymbal);

module.exports = Ride;
