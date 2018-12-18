var http = require("http");

exports.ae_test = function(callback){

  var options = {
  "method": "POST",
  "hostname": targetCse,
  "port": "7579",
  "path": "/Mobius?rcn=3",
  "headers": {
    "accept": "application/xml",
    "x-m2m-ri": "12345",
    "x-m2m-origin": "S",
    "content-type": "application/vnd.onem2m-res+xml; ty=2",
    "cache-control": "no-cache",
    "postman-token": "7594cd93-47cb-d52b-c412-9e31ff8f9091"
    }
  };

  var req = http.request(options, function (res) {    
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      if(res.statusCode == 201){
        delete_resource("/Mobius/ae-test", function(ret){
          callback(ret);
        });
      }
    });
  });

  req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:ae mlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\"ae-test\">\n    <api>0.2.481.2.0001.001.000111</api>\n    <lbl>key1 key2</lbl>\n    <rr>true</rr>\n</m2m:ae>");
  req.end();
}

exports.cnt_test = function(callback){
  var options = {
  "method": "POST",
  "hostname": targetCse,
  "port": "7579",
  "path": "/Mobius/kwu-hub",
  "headers": {
    "accept": "application/json",
    "x-m2m-ri": "12345",
    "x-m2m-origin": "SOrigin",
    "content-type": "application/vnd.onem2m-res+xml; ty=3",
    "cache-control": "no-cache",
    "postman-token": "7e5c29e1-fd2a-951c-0f39-bfe62320cb89"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      if(res.statusCode == 201){
        delete_resource("/Mobius/kwu-hub/cnt-test", function(ret){
          callback(ret);
        });
      }
    });
  });

  req.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<m2m:cnt xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn=\"cnt-test\">\n    <lbl>ss</lbl>\n</m2m:cnt>");
  req.end();
}

function delete_resource(resourcePath, callback){
  var options = {
  "method": "DELETE",
  "hostname": targetCse,
  "port": "7579",
  "path": resourcePath,
  "headers": {
    "accept": "application/xml",
    "locale": "ko",
    "x-m2m-ri": "12345",
    "x-m2m-origin": "Superman",
    "cache-control": "no-cache",
    "postman-token": "849b414d-4c8e-06ab-91ea-ce2513bfeccd"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
    callback(body.toString());
  });
});

req.end();
}
