const WebAudioContext = require('./web_audio_context');

module.exports = {
  fetchImpulseResponseAudio: function(callback){
    //asynchronously fetch and read audio file for impulse response
    
    let context = WebAudioContext.getContext();
    let ajaxRequest = new XMLHttpRequest();
    let crowdBuffer;
    ajaxRequest.open('GET', 'https://s3.amazonaws.com/kleos-dev/JFKUnderpass.wav');
    ajaxRequest.responseType = 'arraybuffer';
    
    ajaxRequest.onload = () => {
      var audioData  = ajaxRequest.response;
      context.decodeAudioData(audioData, (buffer) => {
        crowdBuffer = buffer;
        soundSource = context.createBufferSource();
        soundSource.buffer = crowdBuffer;
        callback(crowdBuffer);
      });
    };
    ajaxRequest.send();
  }
};
