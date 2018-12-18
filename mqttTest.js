var mqtt = require('mqtt');

var _mqtt_client = mqtt.connect('mqtt://' + '128.134.65.118' + ':' + '1883');

var topic = '/oneM2M/test_req';
var requestBody = "cnt-test";


_mqtt_client.on('connect', function () {
    console.log('connected..');
    _mqtt_client.publish(topic, requestBody)
    _mqtt_client.end();
});

_mqtt_client.on('error', function (error) {
    _mqtt_client.end();
});