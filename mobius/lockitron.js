var client_id = "9c1bb6f05868c830ce412b76455fa2441bd4599681afc36ea5146f3cc65c6bd9";
var access_token = "ee0140a1ca7807578237e889bc2275e5d81e5c0a8711c4884b61a8d9066224fb";
var Lockitron = require('lockitron'), lockitron = new Lockitron.Lockitron();
var lockitronInfo = {
  devicesName :'Lockitron',
  deviceID : 'af98a95f-06be-4b7a-85d9-f4cf5de6c5c7',
  deviceStatus : ''
}
var http = require('http');
var request = require("request");
exports.login = function(){
  lockitron.on('error', function(err) {
    if(err){
      console.log("Lockitron Connect Fail");
    }
    else{
      var options = {
        "method": "POST",
        "hostname": myCse,
        "port": "7579",
        "path": "/Mobius/kwu-hub",
        "headers": {
          "Accept": "application/xml",
          "X-M2M-RI": "12345",
          "X-M2M-Origin": "SOrigin",
          "Content-Type": "application/vnd.onem2m-res+xml; ty=3"
        }
      };

      var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function () {
          var body = Buffer.concat(chunks);
          makefuc(lockitronInfo.devicesName);
        });
      });
      req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:cnt xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\""+lockitronInfo.devicesName+"\">\n    <lbl>DoorLock</lbl>\n</m2m:cnt>");
      req.end();
    }
  }).setConfig(client_id, access_token);
}
function makefuc(devicename){
    var options = {
      "method": "POST",
      "hostname": myCse,
      "port": "7579",
      "path": "/Mobius/kwu-hub/"+devicename,
      "headers": {
        "Accept": "application/xml",
        "X-M2M-RI": "12345",
        "X-M2M-Origin": "SOrigin",
        "Content-Type": "application/vnd.onem2m-res+xml; ty=3"
      }
    };
    req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
      });
    });
    req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:cnt xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\"Status\">\n<lbl>Status</lbl>\n</m2m:cnt>");
    req.end();
  
}
exports.control = function(lock_status){

  var options = { method: 'POST',
  url: 'https://api.lockitron.com/v1/locks/'+lockitronInfo.deviceID+'/'+lock_status,
  qs: { access_token: 'ee0140a1ca7807578237e889bc2275e5d81e5c0a8711c4884b61a8d9066224fb' }};

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
  });
}
