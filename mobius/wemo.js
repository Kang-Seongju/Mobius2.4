var WeMo = require('wemo')
var http_ = require("http");
var qs = require("querystring");

var WeMo = new require('wemo')
var wemoSwitch = new WeMo('192.168.86.216', 49153);
// devicelist.forEach(function(item, index) {
//     makecnt(item);
// });
exports.login = function (){
  makecnt('WeMo-Switch');
  makefuc('WeMo-Switch');
}

var sta = ['off','on'];
exports.control = function (status){
  console.log(status);
  if(status == 'on' || status =='On' || status =='ON' || status == 'oN'){
    status = 1;
  }
  else{
    status = 0;
  }
  wemoSwitch.setBinaryState(status, function(err, result) { // switch on
    if (err) console.error(err);
    wemoSwitch.getBinaryState(function(err, result) {
        if (err) console.error(err);
    });
  }); 
}
function makecnt(devicename){

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

    var req = http_.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        makefuc(devicename);
      });
    });
    req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:cnt xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\""+devicename+"\">\n    <lbl>light</lbl>\n</m2m:cnt>");
    req.end();
}
function makefuc(devicename){
    options = {
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
    req = http_.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
      });
    });
    req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:cnt xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\"Power\">\n    <lbl>Power</lbl>\n</m2m:cnt>");
    req.end();
  
}