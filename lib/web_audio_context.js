const WebAudioContext = (function () {
  let context ;
  // 
  // let hidden, visibilityChange;
  // if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  //   hidden = "hidden";
  //   visibilityChange = "visibilitychange";
  // } else if (typeof document.mozHidden !== "undefined") {
  //   hidden = "mozHidden";
  //   visibilityChange = "mozvisibilitychange";
  // } else if (typeof document.msHidden !== "undefined") {
  //   hidden = "msHidden";
  //   visibilityChange = "msvisibilitychange";
  // } else if (typeof document.webkitHidden !== "undefined") {
  //   hidden = "webkitHidden";
  //   visibilityChange = "webkitvisibilitychange";
  // }
  
  function createContext() {
    const context = new AudioContext();
    // window.addEventListener(visibilityChange, () =>{
    //   if (document[hidden]){
    //     context.close();
    //   }
    // });
    return context;
  }
  
  return {
    getContext: function() {
      if (!context) {
        context = createContext();
      }
      return context;
    }
  };
})();

module.exports = WebAudioContext;
