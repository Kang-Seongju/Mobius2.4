var mqtt = require('mqtt');
var qs = require("querystring");

exports.semantic_monitoring = function (csehost,cseport,element,target, value, callback){
	console.log("Semantic monitoring run");
	var client  = mqtt.connect('mqtt://'+csehost+':'+cseport);
	var str ='';
	if(element == "cnt"){ // 새로운 cnt를 생성
		str = element+"&"+target+"/"+value+"&"+value;
		// cnt&/Mobius/kwu-hub/switch&switch
	}
	else if(element =="cin"){
		var list = target.split("/");
		str = element+"&/"+list[1]+"/"+list[2]+"/"+list[3]+"&"+list[4]+"&"+value;

		// cin&/Mobius/kwu-hub/Foobot&Status&value
	}
	else if(element == "delete"){
		str = element+"&"+target;
	}
	client.on('connect', function () {
		client.publish('/oneM2M/sub/Semantic/Mobius/Json', str);
	  	console.log(str);
	  	client.end();
	})
	client.on('error',function(){
		client.end();
	})
}