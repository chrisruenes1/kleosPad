const Sequencer = require('./sequencer');
const Visualizer = require('./visualizer');

document.addEventListener("DOMContentLoaded", () => {
  //register general jquery listeners
  $("#instructions-modal-overlay").click(function(e) {
    $(this).addClass("hidden");
  });
  $("#directions").click(function(e) {
    $("#instructions-modal-overlay").removeClass("hidden");
  });
  $(".exit").click(function(e){
    $("#instructions-modal-overlay").removeClass("hidden");
  });
  
  //set up document
  let canvas = document.getElementById("pad");
  let sequencer = new Sequencer();
  let visualizer = new Visualizer(sequencer, canvas);
});
