var http = require("https");
var http_ = require("http");
var qs = require("querystring");
var sche_ver;
var deviceId;
var uid;
var turl;
var curl;
var token;

exports.login = function (userid, userpw, callback){
  
  var options = {
    "method": "POST",
    "hostname": "home.nest.com",
    "port": null,
    "path": "/user/login",
    "headers": {
      "accept-language": "en-us",
      "content-type": "application/x-www-form-urlencoded"
    }
  };

  var req = http.request(options, function (res) {
  var responseCode = '';
    if(res.statusCode == 200)
      responseCode = "login//YES";
    else
      responseCode = "login//NO";
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      var jsonObject = JSON.parse(body);
      nest_transurl = jsonObject.urls.direct_transport_url.split('//');
      nest_czurl = jsonObject.urls.transport_url.split('//');
      var turls = nest_transurl[1].split(':');
      turl = turls[0];
      curl = nest_czurl[1];
      uid = jsonObject.userid;
      token = jsonObject.access_token;

      callback(responseCode);
    });
  });
  req.write(qs.stringify({ username: userid, password: userpw }));
  req.end();
  
}


exports.getNestInfo = function (callback){
  
  var options = {
    "method": "GET",
    "hostname": turl,
    "port": "443",
    "path": "/v2/mobile/user." + uid,
    "headers": {
      "x-nl-user-id": uid,
      "x-nl-protocol-version": "1",
      "authorization": "Basic " + token,
      "accept-language": "en-us",
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      "connection": "keep-alive"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);

      var jsonObject = JSON.parse(body);
      var sche = jsonObject.schedule;
      var deviceId = Object.keys(sche)[0];
      var sche_ver = sche[deviceId].$version;
      console.log('get Nest info success!!');
      console.log('now you can control nest!!');

      var sha = jsonObject.shared;
      var cu_t = sha["09AA01AC45160J4S"].current_temperature
      var ta_t = sha["09AA01AC45160J4S"].target_temperature
      var ta_ty = sha["09AA01AC45160J4S"].target_temperature_type

      updateNestdata("current_temperature",cu_t);
      updateNestdata("target_temperature",ta_t);
      updateNestdata("target_temperature_type",ta_ty);
      var info = {
        nest_userid: uid,
        nest_curl: curl,
        nest_token: token,
        nest_deviceId: deviceId,
        nest_sche_ver: sche_ver,
      }
      console.log(info);
      callback(info);
    });
  });

  req.end();
}
function updateNestdata(type,value){
    var options = {
      "method": "POST",
      "hostname": myCse,
      "port": "7579",
      "path": "/Mobius/kwu-hub/Nest/"+type,
      "headers": {
        "Accept": "application/xml",
        "X-M2M-RI": "12345",
        "X-M2M-Origin": "/0.2.481.1.21160310105204806",
        "Content-Type": "application/vnd.onem2m-res+xml; ty=4"
      }
    };

    var req = http_.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
      });
    });
    var requestBody = 
            "<m2m:cin\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
                "<con>" + value + "</con>\n" +
            "</m2m:cin>";            
    req.write(requestBody);
    req.end();
}
exports.controlNest = function(nestInfo, body, callback){
  var options = {
    "method": "POST",
    "hostname": nestInfo.nest_curl,
    "port": null,
    "path": "/v2/put/shared." + nestInfo.nest_deviceId,
    "headers": {
      "authorization": "Basic " + nestInfo.nest_token,
      "x-nl-user-id": nestInfo.nest_userid,
      "content-type": "application/json",
      "connection": "keep-alive",
      "accept-language": "en-us",
      "x-nl-base-version": nestInfo.nest_sche_ver,
      "content-length": body.length // body length
    }
  };
  // console.log('--------------------------------------');
  // console.log(nestInfo);
  // console.log(body);
  // console.log('--------------------------------------');
  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      // console.log('------------------body--------------------');
      // console.log(body);
      // console.log('------------------body--------------------');
      
      var jsonObject = JSON.parse(body);
      var ctemp = jsonObject.current_temperature;
      var hvac = jsonObject.target_temperature_type;
      var ttemp = jsonObject.target_temperature;
      console.log('control//' + ctemp + '/' + hvac + '/' + ttemp);
      updateNestdata("current_temperature",ctemp);
      callback('control//' + ctemp + '/' + hvac + '/' + ttemp);
    
    });
  });

  req.on('error', function (e) {
    console.log('[Nest] problem with request: ' + e.message);
    console.log(nestInfo);
  });

  req.write(body);
  req.end();
}