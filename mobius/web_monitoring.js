var http = require("http");
var qs = require("querystring");

exports.send = function (target, value, callback){
  
  var options = {
    "method": "POST",
    "hostname": myCse,
    "port": 80,
    "path": "/",
    "headers": {
      "accept-language": "en-us",
      "content-type": "application/x-www-form-urlencoded"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);

    });
  });

  req.on('error', function (e) {
    // console.log('Monitoring server is not opened');
  });

  req.write(qs.stringify({ target: target, value: value }));
  req.end();
  
}
