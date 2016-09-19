const WebAudioContext = (function () {
  let context ;
  
  function createContext() {
    const context = new AudioContext();
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
