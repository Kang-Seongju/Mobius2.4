var Token = "eyJhbGciOiJIUzI1NiJ9.eyJncmFudGVlIjoic2VvbmdqdWsxQGdhbWlsLmNvbSIsImlhdCI6MTQ5OTM5MTE1OCwidmFsaWRpdHkiOi0xLCJqdGkiOiI4NDIwMGFhNy1iOWM2LTQzOTYtYmJlZS05MTViODQyYThlZTciLCJwZXJtaXNzaW9ucyI6WyJ1c2VyOnJlYWQiLCJkZXZpY2U6cmVhZCJdLCJxdW90YSI6MjAwLCJyYXRlTGltaXQiOjV9.9rVn7Ogh1aWxvMjEJuSc4-kWM_Cww85__0GAKLVpFYM";
var https = require('https');

exports.login = function (userid, callback){
  
   var options = {
     "method": "GET",
     "hostname": "api.foobot.io",
     "port": null,
     "path": "/v2/owner/" + userid + "/device/",
     "headers": {
       "content-type": "application/json;charset=UTF-8",
       "x-api-key-token": Token
     }
   };

   var req = https.request(options, function (res) {
    var responseCode = '';
    if(res.statusCode == 200)
      responseCode = "YES";
    else
      responseCode = "NO";
     var chunks = [];

     res.on("data", function (chunk) {
       chunks.push(chunk);
     });

     res.on("end", function () {
         var body = Buffer.concat(chunks);
         var list = body.toString().split(",");
         var list2 = list[0].split(":");
         var list3 = list2[1].split("\"");
         var UUID = list3[1];
         callback(responseCode + "//" + UUID);
        });
   });
   req.end();
}

exports.getData = function(uuid, callback){
   var options = {
     "method": "GET",
     "hostname": "api.foobot.io",
     "port": null,
     "path": "/v2/device/" + uuid + "/datapoint/0/last/0/",
     "headers": {
       "content-type": "application/json;charset=UTF-8",
       "x-api-key-token": Token
     }
   };

   var req = https.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
         chunks.push(chunk);
      });

      res.on("end", function () {
          var body = Buffer.concat(chunks);
          var jsonObject = JSON.parse(body);
          var units = jsonObject.units;
          var dataPoints = jsonObject.datapoints;

          var result = dataPoints[0][1]+units[1]+'/' + dataPoints[0][2]+units[2]+'/' + dataPoints[0][3]+units[3]+'/' + 
                       dataPoints[0][4]+units[4]+'/' + dataPoints[0][5]+units[5]+'/' + dataPoints[0][6]+units[6];
          callback(result);
      });
   });

   req.end();
}