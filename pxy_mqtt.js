/**
 * Copyright (c) 2018, KETI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file
 * @copyright KETI Korea 2018, KETI
 * @author Il Yeup Ahn [iyahn@keti.re.kr]
 */

var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var mqtt = require('mqtt');
var util = require('util');
var xml2js = require('xml2js');
var js2xmlparser = require('js2xmlparser');
var url = require('url');
var xmlbuilder = require('xmlbuilder');
var moment = require('moment');
var ip = require("ip");
var cbor = require('cbor');

var responder = require('./mobius/responder');

//var resp_mqtt_client_arr = [];
//var req_mqtt_client_arr = [];
var resp_mqtt_rqi_arr = [];

var http_response_q = {};

global.NOPRINT = 'true';


var _this = this;

var mqtt_state = 'init';
//var custom = new process.EventEmitter();
var events = require('events');
//var mqtt_custom = new events.EventEmitter();

// ������ �����մϴ�.
var mqtt_app = express();


var usemqttcbhost = 'localhost'; // pxymqtt to mobius



//require('./mobius/ts_agent');

//var cache_limit = 64;
var cache_ttl = 3; // count
var cache_keep = 10; // sec
var message_cache = {};


var pxymqtt_client = null;

/* gwkim 181205 start */
var nest = require('./mobius/nest');
var foobot = require('./mobius/foobot');
var foobotFlag = false;
var nestFlag = false;
var wemo = require('./mobius/wemo');
var lockitron = require('./mobius/lockitron');

var nestInfo = {
    nest_userid: '',
    nest_curl: '',
    nest_token: '',
    nest_deviceId: '',
    nest_sche_ver: '',
}

var aeId = "";
var health_check_flag = "isAlive";
var isAlive = 'false';

global.isConnected = false;
var ifttt_ = require('./mobius/if_this_then_that');
var ifttt_dist_flag = "INIT";
var ifttt_smartThings_motion_flag = "INIT";
/* gwkim 181205 end */

/* gwkim 181207 start */
var intp = require('./mobius/interoperability_test');
/* gwkim 181207 end */

//mqtt_custom.on('mqtt_watchdog', function() {
exports.mqtt_watchdog = function() {
    if(mqtt_state === 'init') {
        if(usesecure === 'disable') {
            http.globalAgent.maxSockets = 1000000;
            http.createServer(mqtt_app).listen({port: usepxymqttport, agent: false}, function () {
                NOPRINT==='true'?NOPRINT='true':console.log('pxymqtt server (' + ip.address() + ') running at ' + usepxymqttport + ' port');

                mqtt_state = 'connect';
            });
        }
        else {
            var options = {
                key: fs.readFileSync('server-key.pem'),
                cert: fs.readFileSync('server-crt.pem'),
                ca: fs.readFileSync('ca-crt.pem')
            };
            https.globalAgent.maxSockets = 1000000;
            https.createServer(options, mqtt_app).listen({port: usepxymqttport, agent: false}, function () {
                console.log('pxymqtt server (' + ip.address() + ') running at ' + usepxymqttport + ' port');

                mqtt_state = 'connect';
            });
        }
    }
    else if(mqtt_state === 'connect') {
        http_retrieve_CSEBase(function(rsc, res_body) {
            if (rsc == '2000') {
                var jsonObj = JSON.parse(res_body);
                if(jsonObj.hasOwnProperty('m2m:cb')) {
                    usecseid = jsonObj['m2m:cb'].csi;

                    mqtt_state = 'connecting';
                }
                else {
                    console.log('CSEBase tag is none');
                }
            }
            else {
                console.log('Target CSE(' + usemqttcbhost + ') is not ready');
            }
        });
    }
    else if(mqtt_state === 'connecting') {
        if(pxymqtt_client == null) {
            if(usesecure === 'disable') {
                pxymqtt_client = mqtt.connect('mqtt://' + usemqttbroker + ':' + usemqttport);
            }
            else {
                var connectOptions = {
                    host: usemqttbroker,
                    port: usemqttport,
                    protocol: "mqtts",
                    keepalive: 10,
       //             clientId: serverUID,
                    protocolId: "MQTT",
                    protocolVersion: 4,
                    clean: true,
                    reconnectPeriod: 2000,
                    connectTimeout: 2000,
                    key: fs.readFileSync("./server-key.pem"),
                    cert: fs.readFileSync("./server-crt.pem"),
                    rejectUnauthorized: false
                };
                pxymqtt_client = mqtt.connect(connectOptions);
            }

              pxymqtt_client.on('connect', function () {
                req_sub(pxymqtt_client);
                reg_req_sub(pxymqtt_client);
                ctrl_req_sub(pxymqtt_client);
                nest_req_sub(pxymqtt_client);
                foobot_req_sub(pxymqtt_client);
                ifttt_sub(pxymqtt_client);
                testing_sub(pxymqtt_client);
                //resp_sub(pxymqtt_client);
                //ping_sub(pxymqtt_client);
                // setInterval(health_check, 3000, pxymqtt_client);

                fs.readFile('./mobius/foobot_info.txt', 'utf8', function(err, data) {
                    if(err)
                        console.log('[Foobot info is empty]');
                    else{
                        updateFoobotStatus(data);
                        setInterval(updateFoobotStatus, 900000, data);
                        // setInterval(updateFoobotStatus, 5000, data);
                        foobotFlag = true;
                    }
                });
                /* gwkim 181205 end */

                mqtt_state = 'ready';
                
                require('./mobius/ts_agent');
            });

            pxymqtt_client.on('message', mqtt_message_handler);
        }
    }
};

var mqtt_tid = require('shortid').generate();
wdt.set_wdt(mqtt_tid, 2, _this.mqtt_watchdog);

/* gwkim 181207 start */
function testing_sub() {
    pxymqtt_client.subscribe('/oneM2M/test_req');
    console.log('subscribe interoperability test topic as ' + '/oneM2M/test_req');    
}
/* gwkim 181207 end */

/* gwkim 181205 start */
function ifttt_sub() {
    pxymqtt_client.subscribe('/oneM2M/req/Mobius/ifttt-sub/xml');
    console.log('subscribe ifttt_topic as ' + '/oneM2M/req/Mobius/ifttt-sub/xml');
}

function ctrl_req_sub() {
    var ctrl_req_topic = util.format('/oneM2M/ctrl_req/+/%s/#', usecseid.replace('/', ':'));
    pxymqtt_client.subscribe(ctrl_req_topic);

    ctrl_req_topic = util.format('/oneM2M/ctrl_req/+/%s/#', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(ctrl_req_topic);

    console.log('subscribe ctrl_req_topic as ' + ctrl_req_topic);
}

function nest_req_sub() {
    var nest_req_topic = util.format('/oneM2M/nest_req/+/%s/#', usecseid.replace('/', ':'));
    pxymqtt_client.subscribe(nest_req_topic);

    nest_req_topic = util.format('/oneM2M/nest_req/+/%s/#', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(nest_req_topic);

    console.log('subscribe nest_req_topic as ' + nest_req_topic);
}

function foobot_req_sub() {
    var foobot_req_topic = util.format('/oneM2M/foobot_req/+/%s/#', usecseid.replace('/', ':'));
    pxymqtt_client.subscribe(foobot_req_topic);

    foobot_req_topic = util.format('/oneM2M/foobot_req/+/%s/#', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(foobot_req_topic);

    console.log('subscribe foobot_req_topic as ' + foobot_req_topic);
}

function ping_sub() {
    var ping_topic = util.format('/oneM2M/ping_resp/+/%s/#', usecseid.replace('/', ':'));
    pxymqtt_client.subscribe(ping_topic);
                                                            
    ping_topic = util.format('/oneM2M/ping_resp/+/%s/#', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(ping_topic);

    console.log('subscribe ping_topic as ' + ping_topic);
}

var count = 0;
function health_check(mqtt_client) {
    fs.readFile('./mobius/health_check.txt', 'utf8', function(err, data) {
        var info = data.split('/');
        aeId = info[1];
        if(health_check_flag != 'OK') {
            if(isAlive === 'true') {
                fs.open('./mobius/health_check.txt', 'w', function(err, fd) {
                    fs.writeFile(fd, 'false/' + aeId, 'utf8', function(err) {
                        if(err) throw err;
                    });
                });
            }
            isAlive = 'false';
            //console.log('------------------[ Hub is \'NOT\' connected ]: [' + count++ + ']------------------');
            // count+=1;
        }
        else{
            if(isAlive === 'false'){
                console.log('------------------[ Hub is connected ]------------------')
                fs.open('./mobius/health_check.txt', 'w', function(err, fd) {
                    fs.writeFile(fd, 'true/' + aeId, 'utf8', function(err) {
                        if(err) throw err;
                    });
                });
            }
            isAlive = 'true';
        }
        health_check_flag = "isAlive?"
        var topic = '/oneM2M/ping/' + aeId + '/Mobius/xml';
        mqtt_client.publish(topic, health_check_flag);
    });
}

function updateFoobotStatus(uuid){
    foobot.getData(uuid, function(result) {
        var options = {
            "method": "POST",
            "hostname": usemqttbroker,
            "port": "7579",
            "path": "/Mobius/kwu-hub/Foobot/Status",
            "headers": {
                "Accept": "application/xml",
                "X-M2M-RI": "12345",
                "X-M2M-Origin": "Mobius",
                "Content-Type": "application/vnd.onem2m-res+xml; ty=4",
            }
        };

         var req = http.request(options, function (res) {
            if(res.statusCode == 201 || res.statusCode == 409)
                console.log('Update Foobot Stauts Success');
            else
                console.log('Update Foobot Status Fail');
        });

        var requestBody = 
            "<m2m:cin\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
                "<con>" + result + "</con>\n" +
            "</m2m:cin>";            
        req.write(requestBody);
        req.end();
    });
}
/* gwkim 181205 end */

function resp_sub() {
    // var resp_topic = util.format('/oneM2M/resp/%s/#', usecseid.replace('/', ':'));
    // pxymqtt_client.subscribe(resp_topic);

    var resp_topic = util.format('/oneM2M/resp/%s/#', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(resp_topic);

    console.log('subscribe resp_topic as ' + resp_topic);
}

function req_sub() {
    var req_topic = util.format('/oneM2M/req/+/%s/+', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(req_topic);
    console.log('subscribe req_topic as ' + req_topic);

    req_topic = util.format('/oneM2M/req/+/%s/+', usecsebase);
    pxymqtt_client.subscribe(req_topic);
    console.log('subscribe req_topic as ' + req_topic);
}

function reg_req_sub() {
    var reg_req_topic = util.format('/oneM2M/reg_req/+/%s/+', usecseid.replace('/', ''));
    pxymqtt_client.subscribe(reg_req_topic);
    console.log('subscribe reg_req_topic as ' + reg_req_topic);

    reg_req_topic = util.format('/oneM2M/reg_req/+/%s/+', usecsebase);
    pxymqtt_client.subscribe(reg_req_topic);
    console.log('subscribe reg_req_topic as ' + reg_req_topic);
}

function mqtt_message_handler(topic, message) {
    var topic_arr = topic.split("/");
    if(topic_arr[5] != null) {
        var bodytype = (topic_arr[5] == 'xml') ? topic_arr[5] : ((topic_arr[5] == 'json') ? topic_arr[5] : ((topic_arr[5] == 'cbor') ? topic_arr[5] : 'json'));
    }
    else {
        bodytype = defaultbodytype;
        topic_arr[5] = defaultbodytype;
    }

    if((topic_arr[1] == 'oneM2M' && topic_arr[2] == 'resp' && ((topic_arr[3].replace(':', '/') == usecseid) || (topic_arr[3] == usecseid.replace('/', ''))))) {
        make_json_obj(bodytype, message.toString(), function(rsc, jsonObj) {
            if(rsc == '1') {
                if(jsonObj['m2m:rsp'] == null) {
                    jsonObj['m2m:rsp'] = jsonObj;
                }

                if (jsonObj['m2m:rsp'] != null) {
                    for (var i = 0; i < resp_mqtt_rqi_arr.length; i++) {
                        if (resp_mqtt_rqi_arr[i] == jsonObj['m2m:rsp'].rqi) {
                            NOPRINT==='true'?NOPRINT='true':console.log('----> ' + jsonObj['m2m:rsp'].rsc);

                            http_response_q[resp_mqtt_rqi_arr[i]].setHeader('X-M2M-RSC', jsonObj['m2m:rsp'].rsc);
                            http_response_q[resp_mqtt_rqi_arr[i]].setHeader('X-M2M-RI', resp_mqtt_rqi_arr[i]);

                            var status_code = '404';
                            if(jsonObj['m2m:rsp'].rsc == '4105') {
                                status_code = '409';
                            }
                            else if(jsonObj['m2m:rsp'].rsc == '2000') {
                                status_code = '200';
                            }
                            else if(jsonObj['m2m:rsp'].rsc == '2001') {
                                status_code = '201';
                            }
                            else if(jsonObj['m2m:rsp'].rsc == '4000') {
                                status_code = '400';
                            }
                            else if(jsonObj['m2m:rsp'].rsc == '5000') {
                                status_code = '500';
                            }
                            else {

                            }

                            http_response_q[resp_mqtt_rqi_arr[i]].status(status_code).end(JSON.stringify(jsonObj['m2m:rsp'].pc));

                            delete http_response_q[resp_mqtt_rqi_arr[i]];
                            resp_mqtt_rqi_arr.splice(i, 1);

                            break;
                        }
                    }
                }
            }
            else {
                var resp_topic = '/oneM2M/resp/';
                if (topic_arr[2] === 'reg_req') {
                    resp_topic = '/oneM2M/reg_resp/';
                }
                resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);
                mqtt_response(resp_topic, 4000, '', '', '', '', 'to parsing error', bodytype);
            }
        });
    }
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'req' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')) || (topic_arr[4] == usecsebase))) {
        NOPRINT==='true'?NOPRINT='true':console.log('----> [response_mqtt] - ' + topic);
        NOPRINT==='true'?NOPRINT='true':console.log(message.toString());

         /* gwkim 181205 start */
        aeId = topic_arr[3];
        //console.log("aeId: [" + topic_arr[3] + "]");
        if(isAlive === 'false'){
            var resp_topic = '/oneM2M/ctrl_resp';
            pxymqtt_client.publish(resp_topic, 'Hub is not connected or no response'); 
        }
        /* gwkim 181205 end */

        make_json_obj(bodytype, message.toString(), function(rsc, result) {
            if(rsc == '1') {
                if(result && result['m2m:rqp'] == null) {
                    result['m2m:rqp'] = result;
                }

                var cache_key = result['m2m:rqp'].op.toString() + result['m2m:rqp'].to.toString() + result['m2m:rqp'].rqi.toString();

                if(message_cache.hasOwnProperty(cache_key)) {
                    if(message_cache[cache_key].to == result['m2m:rqp'].to) { // duplicated message
                        //console.log("duplicated message");
                        var resp_topic = '/oneM2M/resp/';
                        if (topic_arr[2] === 'reg_req') {
                            resp_topic = '/oneM2M/reg_resp/';
                        }

                        var resp_topic_rel1 = resp_topic + (topic_arr[3] + '/' + topic_arr[4]);
                        resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);

                        if(message_cache[cache_key].hasOwnProperty('rsp')) {
                            message_cache[cache_key].ttl = cache_ttl;
                            pxymqtt_client.publish(resp_topic_rel1, message_cache[cache_key].rsp);
                            pxymqtt_client.publish(resp_topic, message_cache[cache_key].rsp);
                        }
                    }
                }
                else {
                    // if(Object.keys(message_cache).length >= cache_limit) {
                    //     delete message_cache[Object.keys(message_cache)[0]];
                    // }

                    message_cache[cache_key] = {};
                    message_cache[cache_key].to = result['m2m:rqp'].to;
                    message_cache[cache_key].ttl = cache_ttl;
                    message_cache[cache_key].rsp = '';

                    mqtt_message_action(topic_arr, bodytype, result);
                }
            }
            else {
                resp_topic = '/oneM2M/resp/';
                if (topic_arr[2] === 'reg_req') {
                    resp_topic = '/oneM2M/reg_resp/';
                }
                resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);
                mqtt_response(resp_topic, 4000, '', '', '', '', 'to parsing error', bodytype);
            }
        });
    }
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'reg_req' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')))) {
        make_json_obj(bodytype, message.toString(), function(rsc, result) {
            if(result['m2m:rqp'] == null) {
                result['m2m:rqp'] = result;
            }
            if(rsc == '1') {
                mqtt_message_action(topic_arr, bodytype, result);
            }
            else {
                var resp_topic = '/oneM2M/resp/';
                if (topic_arr[2] === 'reg_req') {
                    resp_topic = '/oneM2M/reg_resp/';
                }
                resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);
                mqtt_response(resp_topic, 4000, '', '', '', '', 'to parsing error', bodytype);
            }
        });
    }
    /* gwkim 181205 start */
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'ctrl_req' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')))) {
        var resp_topic = '/oneM2M/ctrl_resp';
        console.log('here7');
        pxymqtt_client.publish(resp_topic, message.toString());  
    }
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'ping_resp' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')))) {
        health_check_flag = "OK";
    }
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'nest_req' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')))) {
        console.log('-------------------NEST--------');
        var resp_topic = '/oneM2M/nest_resp';
        console.log('here8');
        var msgList = message.toString().split('//');

        switch(msgList[0]){
            case 'login':
                var nestID = msgList[1];
                var nestPW = msgList[2];
                nest.login(nestID, nestPW, function(response){
                    console.log('=============[Nest Login Success: ' + response + ']=============');
                    pxymqtt_client.publish(resp_topic, response);  
                    nest.getNestInfo(function(data){
                        console.log('=============[Get Nest Information Success]=============');
                        fs.open('./mobius/nest_info.txt', 'w', function(err, fd) {
                            var buf = data.nest_userid + '/' + data.nest_curl + '/' + data.nest_token + '/' + data.nest_deviceId + '/' + data.nest_sche_ver;
                            fs.writeFile(fd, buf, 'utf8', function(err) {
                                if(err) throw err;
                            });
                        });

                    });
                });
                break;
        }
    }
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'foobot_req' && ((topic_arr[4].replace(':', '/') == usecseid) || (topic_arr[4] == usecseid.replace('/', '')))) {
        var resp_topic = '/oneM2M/foobot_resp';
        var msgList = message.toString().split('//');

        switch(msgList[0]){
            case 'login':
                var foobotID = msgList[1];
                foobot.login(foobotID, function(response){
                    responseList = response.split('//');
                    var foobotInfo = responseList[1];
                    if(responseList[0] === 'YES'){
                        pxymqtt_client.publish(resp_topic, "login//YES");
                        fs.open('./mobius/foobot_info.txt', 'w', function(err, fd) {
                            var buf = foobotInfo;
                            fs.writeFile(fd, buf, 'utf8', function(err) {
                                if(err) throw err;
                            });
                        });
                        updateFoobotStatus(foobotInfo);
                        
                        if(!foobotFlag)
                           // setInterval(updateFoobotStatus, 5000, foobotInfo); 
                            setInterval(updateFoobotStatus, 600000, foobotInfo); // every 10mins update foobot status
                        
                    }
                    else
                        pxymqtt_client.publish(resp_topic, "login//NO");  
                });
                break;
        }
    }
    else if(topic == '/oneM2M/req/Mobius/ifttt-sub/xml'){
        fs.readFile('./mobius/health_check.txt', 'utf8', function(err, data) {
            var info = data.split('/');
            var isAlive = info[0];
            var aeId = info[1];
            if(isAlive === 'true'){
                ifttt_.ifThis('/Mobius/kwu-hub/Sensor-Ultrasonic/Status', function(err, result_Obj){ // Sensor scenario
                    if(result_Obj[0] != undefined){ 
                        var valueList = result_Obj[0].con.split('cm');
                        var distance = Number(valueList[0]);

                        if(ifttt_dist_flag != 'ON' && distance < 10){ // If this
                            // ifttt_.thenThat(aeId, '/Mobius/kwu-hub/Hue-Lamp/Brightness', 'on'); // then that
                            ifttt_.thenThat(aeId, '/Mobius/kwu-hub/AJ-Lamp/Brightness', 'on');
                            ifttt_dist_flag = 'ON';
                        }
                        else if(ifttt_dist_flag != 'OFF' && distance >= 10){
                            // ifttt_.thenThat(aeId, '/Mobius/kwu-hub/Hue-Lamp/Brightness', 'off');
                            ifttt_.thenThat(aeId, '/Mobius/kwu-hub/AJ-Lamp/Brightness', 'off');
                            ifttt_dist_flag = 'OFF';   
                        }
                    }
                });
            }

            ifttt_.ifThis('/Mobius/kwu-hub/SmartThings/DoorStatus', function(err, result_Obj){ // SmartThings scenario
                    if(result_Obj[0] != undefined){ 
                        if(ifttt_smartThings_motion_flag != 'OPEN' && result_Obj[0].con == 'open'){ // If this
                            ifttt_.thenThat(aeId, '/Mobius/kwu-hub/Hue-Lamp/Brightness', 'on'); // then that
                            ifttt_smartThings_motion_flag = 'OPEN';
                        }
                        else if(ifttt_smartThings_motion_flag != 'CLOSE' && result_Obj[0].con == 'close'){
                            ifttt_.thenThat(aeId, '/Mobius/kwu-hub/Hue-Lamp/Brightness', 'off');
                            ifttt_smartThings_motion_flag = 'CLOSE';   
                        }
                    }
            });
        });
    }        
    /* gwkim 181205 end */

    /* gwkim 181207 start */
    else if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'test_req') {
        var msg = message.toString();
        if(msg == 'ae-test'){
            intp.ae_test(function(res){
                console.log(res);
                tcpSocket(res);
            });
        }
        else if(msg == 'cnt-test'){
            intp.cnt_test(function(res){
                console.log(res);
                tcpSocket(res);
            });
        }
        else
            console.log('[Unknown Test Suite error]');
    }
    /* gwkim 181207 end */

    else {
        NOPRINT==='true'?NOPRINT='true':console.log('topic(' + topic + ') is not supported');
    }
}

function tcpSocket(data){
    console.log('tcpSocket function call');
    var net = require('net'); 
    var path = '';
    var prefix = '';
    var client = net.connect({port:8891, host:'223.194.33.61'}, function(){
        client.write(data);
    });        
    var str = ''; 
    client.on('data', function(data){
        console.log(data.toString());
        client.end();
    })       

    client.on('error', function(err){
        console.log('TCP Server connection error.');
        console.log(err);
    })
}

function cache_ttl_manager() {
    for(var idx in message_cache) {
        if(message_cache.hasOwnProperty(idx)) {
            message_cache[idx].ttl--;
            if(message_cache[idx].ttl <= 0) {
                delete message_cache[idx];
            }
        }
    }
}

var cache_tid = require('shortid').generate();
wdt.set_wdt(cache_tid, cache_keep, cache_ttl_manager);

function mqtt_message_action(topic_arr, bodytype, jsonObj) {
    if (jsonObj['m2m:rqp'] != null) {
        var op = (jsonObj['m2m:rqp'].op == null) ? '' : jsonObj['m2m:rqp'].op;
        var to = (jsonObj['m2m:rqp'].to == null) ? '' : jsonObj['m2m:rqp'].to;

        to = to.replace(usespid + usecseid + '/', '/');
        to = to.replace(usecseid + '/', '/');

        if(to.charAt(0) != '/') {
            to = '/' + to;
        }

        var fr = (jsonObj['m2m:rqp'].fr == null) ? '' : jsonObj['m2m:rqp'].fr;
        if(fr == '') {
            fr = topic_arr[3];
        }
        var rqi = (jsonObj['m2m:rqp'].rqi == null) ? '' : jsonObj['m2m:rqp'].rqi;
        var ty = (jsonObj['m2m:rqp'].ty == null) ? '' : jsonObj['m2m:rqp'].ty.toString();
        var pc = (jsonObj['m2m:rqp'].pc == null) ? '' : jsonObj['m2m:rqp'].pc;

        if(jsonObj['m2m:rqp'].hasOwnProperty('fc')) {
            var query_count = 0;
            for(var fc_idx in jsonObj['m2m:rqp'].fc) {
                if(jsonObj['m2m:rqp'].fc.hasOwnProperty(fc_idx)) {
                    if(query_count == 0) {
                        to += '?';
                    }
                    else {
                        to += '&';
                    }
                    to += fc_idx;
                    to += '=';
                    to += jsonObj['m2m:rqp'].fc[fc_idx].toString();
                }
            }
        }

        try {
            var resp_topic = '/oneM2M/resp/';
            if (topic_arr[2] == 'reg_req') {
                resp_topic = '/oneM2M/reg_resp/';
            }
            /* gwkim 181205 start */
            else if(topic_arr[2] == 'ctrl_req'){
                resp_topic = '/oneM2M/ctrl_resp/';   
            }
            /* gwkim 181205 end */
            var resp_topic_rel1 = resp_topic + (topic_arr[3] + '/' + topic_arr[4]);
            resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);

            //if (to.split('/')[1].split('?')[0] == usecsebase) {
                mqtt_binding(op, to, fr, rqi, ty, pc, bodytype, function (res, res_body) {
                    if (res_body == '') {
                        res_body = '{}';
                    }
                    mqtt_response(resp_topic_rel1, res.headers['x-m2m-rsc'], op, to, usecseid, rqi, JSON.parse(res_body), bodytype);
                    mqtt_response(resp_topic, res.headers['x-m2m-rsc'], op, to, usecseid, rqi, JSON.parse(res_body), bodytype);
                });
            //}
            ////else {
            //    mqtt_response(resp_topic, 4004, fr, usecseid, rqi, 'this is not MN-CSE, csebase do not exist', bodytype);
            ////}
        }
        catch (e) {
            console.error(e);
            resp_topic = '/oneM2M/resp/';
            if (topic_arr[2] == 'reg_req') {
                resp_topic = '/oneM2M/reg_resp/';
            }
            resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);
            mqtt_response(resp_topic, 5000, op, fr, usecseid, rqi, 'to parsing error', bodytype);
        }
    }
    else {
        NOPRINT==='true'?NOPRINT='true':console.log('mqtt message tag is not different : m2m:rqp');

        resp_topic = '/oneM2M/resp/';
        if (topic_arr[2] == 'reg_req') {
            resp_topic = '/oneM2M/reg_resp/';
        }
        resp_topic += (topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5]);
        mqtt_response(resp_topic, 4000, "", "", usecseid, "", '\"m2m:dbg\":\"mqtt message tag is different : m2m:rqp\"', bodytype);
    }
}

function mqtt_binding(op, to, fr, rqi, ty, pc, bodytype, callback) {
    var content_type = 'application/vnd.onem2m-res+json';

    switch (op.toString()) {
        case '1':
            op = 'post';
            content_type += ('; ty=' + ty);
            break;
        case '2':
            op = 'get';
            break;
        case '3':
            op = 'put';
            break;
        case '4':
            op = 'delete';
            break;
    }

    var reqBodyString = '';
    if( op == 'post' || op == 'put') {
        reqBodyString = JSON.stringify(pc);
    }

    var bodyStr = '';

    var options = {
        hostname: usemqttcbhost,
        port: usecsebaseport,
        path: to,
        method: op,
        headers: {
            'X-M2M-RI': rqi,
            'Accept': 'application/json',
            'X-M2M-Origin': fr,
            'Content-Type': content_type,
            'binding': 'M'
        }
    };

    if(usesecure == 'disable') {
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                bodyStr += chunk;
            });

            res.on('end', function () {
                callback(res, bodyStr);
            });
        });
    }
    else {
        options.ca = fs.readFileSync('ca-crt.pem');

        req = https.request(options, function (res) {
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                bodyStr += chunk;
            });

            res.on('end', function () {
                callback(res, bodyStr);
            });
        });
    }

    req.on('error', function (e) {
        //console.log('[pxymqtt-mqtt_binding] problem with request: ' + e.message);
    });

    // write data to request body

    //console.log(options);
    //console.log(reqBodyString);

    req.write(reqBodyString);
    req.end();
}

function mqtt_response(resp_topic, rsc, op, to, fr, rqi, inpc, bodytype) {
    var rsp_message = {};
    rsp_message['m2m:rsp'] = {};
    //rsp_message['m2m:rsp'].rsc = rsc;
    rsp_message['m2m:rsp'].rsc = parseInt(rsc); // convert to int
    //rsp_message['m2m:rsp'].to = to;
    //rsp_message['m2m:rsp'].fr = fr;

    rsp_message['m2m:rsp'].rqi = rqi;
    rsp_message['m2m:rsp'].pc = inpc;

    var cache_key = op.toString() + to.toString() + rqi.toString();

    if (bodytype == 'xml') {
        var bodyString = responder.convertXmlMqtt('rsp', rsp_message['m2m:rsp']);

        /*rsp_message['m2m:rsp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        for(var prop in rsp_message['m2m:rsp'].pc) {
            if (rsp_message['m2m:rsp'].pc.hasOwnProperty(prop)) {
                for(var prop2 in rsp_message['m2m:rsp'].pc[prop]) {
                    if (rsp_message['m2m:rsp'].pc[prop].hasOwnProperty(prop2)) {
                        if(prop2 == 'rn') {
                            rsp_message['m2m:rsp'].pc[prop]['@'] = {rn : rsp_message['m2m:rsp'].pc[prop][prop2]};
                            delete rsp_message['m2m:rsp'].pc[prop][prop2];
                        }
                        for(var prop3 in rsp_message['m2m:rsp'].pc[prop][prop2]) {
                            if (rsp_message['m2m:rsp'].pc[prop][prop2].hasOwnProperty(prop3)) {
                                if(prop3 == 'rn') {
                                    rsp_message['m2m:rsp'].pc[prop][prop2]['@'] = {rn : rsp_message['m2m:rsp'].pc[prop][prop2][prop3]};
                                    delete rsp_message['m2m:rsp'].pc[prop][prop2][prop3];
                                }
                            }
                        }
                    }
                }
            }
        }

        var bodyString = js2xmlparser.parse("m2m:rsp", rsp_message['m2m:rsp']);
*/
        if(message_cache.hasOwnProperty(cache_key)) {
            message_cache[cache_key].rsp = bodyString.toString();
        }
        else {
            message_cache[cache_key] = {};
            message_cache[cache_key].rsp = bodyString.toString();
        }

        pxymqtt_client.publish(resp_topic, bodyString.toString());
    }
    else if(bodytype === 'cbor') {
        bodyString = cbor.encode(rsp_message['m2m:rsp']).toString('hex');

        if(message_cache.hasOwnProperty(cache_key)) {
            message_cache[cache_key].rsp = bodyString.toString();
        }
        else {
            message_cache[cache_key] = {};
            message_cache[cache_key].rsp = bodyString.toString();
        }

        pxymqtt_client.publish(resp_topic, bodyString);
    }
    else { // 'json'
        try {
            if(message_cache.hasOwnProperty(cache_key)) {
                message_cache[cache_key].rsp = JSON.stringify(rsp_message['m2m:rsp']);
            }
            else {
                message_cache[cache_key] = {};
                message_cache[cache_key].rsp = JSON.stringify(rsp_message['m2m:rsp']);
            }

            pxymqtt_client.publish(resp_topic, message_cache[cache_key].rsp);
        }
        catch (e) {
            console.log(e.message);
            delete message_cache[cache_key];
            var dbg = {};
            dbg['m2m:dbg'] = '[mqtt_response]' + e.message;
            pxymqtt_client.publish(resp_topic, JSON.stringify(dbg));
        }
    }
}

// for notification
var onem2mParser = bodyParser.text(
    {
        limit: '1mb',
        type: 'application/onem2m-resource+xml;application/xml;application/json;application/vnd.onem2m-res+xml;application/vnd.onem2m-res+json'
    }
);

mqtt_app.post('/notification', onem2mParser, function(request, response, next) {
    var fullBody = '';
    request.on('data', function(chunk) {
        fullBody += chunk.toString();
    });
    request.on('end', function() {
        request.body = fullBody;

        try {
            var aeid = url.parse(request.headers.nu).pathname.replace('/', '').split('?')[0];
            NOPRINT==='true'?NOPRINT='true':console.log('[pxy_mqtt] - ' + aeid);

            if (aeid == '') {
                NOPRINT==='true'?NOPRINT='true':console.log('aeid of notification url is none');
                return;
            }

            if (mqtt_state == 'ready') {
                var noti_topic = util.format('/oneM2M/req/%s/%s/%s', usecseid.replace('/', ''), aeid, request.headers.bodytype);

                var rqi = request.headers['x-m2m-ri'];
                resp_mqtt_rqi_arr.push(rqi);
                http_response_q[rqi] = response;

                pxymqtt_client.publish(noti_topic, request.body);
                NOPRINT==='true'?NOPRINT='true':console.log('<---- ' + noti_topic);
            }
            else {
                NOPRINT==='true'?NOPRINT='true':console.log('pxymqtt is not ready');
            }
        }
        catch (e) {
            NOPRINT==='true'?NOPRINT='true':console.log(e.message);
            var rsp_Obj = {};
            rsp_Obj['rsp'] = {};
            rsp_Obj['rsp'].dbg = 'notificationUrl does not support : ' + request.headers.nu;
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end(JSON.stringify(rsp_Obj));
        }
    });
});

mqtt_app.post('/register_csr', onem2mParser, function(request, response, next) {
    var fullBody = '';
    console.log('MQTT POST');
    request.on('data', function(chunk) {
        fullBody += chunk.toString();
    });
    request.on('end', function() {
        request.body = fullBody;

        var cseid = (request.headers.cseid == null) ? '' : request.headers.cseid;

        if (cseid == '') {
            NOPRINT==='true'?NOPRINT='true':console.log('cseid of register url is none');
            return;
        }

        if (mqtt_state == 'ready') {
            var reg_req_topic = util.format('/oneM2M/reg_req/%s/%s/%s', usecseid.replace('/', ':'), cseid.replace('/', ':'), request.headers.bodytype);

            var rqi = request.headers['x-m2m-ri'];
            resp_mqtt_rqi_arr.push(rqi);
            http_response_q[rqi] = response;

            var pc = JSON.parse(request.body);

            var req_message = {};
            req_message['m2m:rqp'] = {};
            req_message['m2m:rqp'].op = '1'; // post
            req_message['m2m:rqp'].to = request.headers.csebasename; // CSEBase Relative
            req_message['m2m:rqp'].fr = request.headers['x-m2m-origin'];
            req_message['m2m:rqp'].rqi = rqi;
            req_message['m2m:rqp'].ty = '16';

            req_message['m2m:rqp'].pc = pc;

            if (request.headers.bodytype == 'xml') {
                req_message['m2m:rqp']['@'] = {
                    "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                };

                var xmlString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);

                pxymqtt_client.publish(reg_req_topic, xmlString);
                NOPRINT==='true'?NOPRINT='true':console.log('<---- ' + reg_req_topic);
            }
            else { // 'json'
                pxymqtt_client.publish(reg_req_topic, JSON.stringify(req_message['m2m:rqp']));
                NOPRINT==='true'?NOPRINT='true':console.log('<---- ' + reg_req_topic);
            }
        }
        else {
            NOPRINT==='true'?NOPRINT='true':console.log('pxymqtt is not ready');
        }
    });
});

mqtt_app.get('/get_cb', onem2mParser, function(request, response, next) {
    var fullBody = '';
    request.on('data', function(chunk) {
        fullBody += chunk.toString();
    });
    request.on('end', function() {
        request.body = fullBody;

        var cseid = (request.headers.cseid == null) ? '' : request.headers.cseid;

        if (cseid == '') {
            NOPRINT==='true'?NOPRINT='true':console.log('cseid of register url is none');
            return;
        }

        if (mqtt_state == 'ready') {
            var reg_req_topic = util.format('/oneM2M/reg_req/%s/%s/%s', usecseid.replace('/', ':'), cseid.replace('/', ':'), request.headers.bodytype);

            var rqi = request.headers['x-m2m-ri'];
            resp_mqtt_rqi_arr.push(rqi);
            http_response_q[rqi] = response;

            var pc = '';

            var req_message = {};
            req_message['m2m:rqp'] = {};
            req_message['m2m:rqp'].op = '2'; // get
            req_message['m2m:rqp'].to = request.headers.csebasename; // CSEBase Relative
            req_message['m2m:rqp'].fr = request.headers['x-m2m-origin'];
            req_message['m2m:rqp'].rqi = rqi;
            req_message['m2m:rqp'].ty = '16';

            req_message['m2m:rqp'].pc = pc;

            if (request.headers.bodytype == 'xml') {
                req_message['m2m:rqp']['@'] = {
                    "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                };

                var xmlString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);

                pxymqtt_client.publish(reg_req_topic, xmlString);
                NOPRINT==='true'?NOPRINT='true':console.log('<---- ' + reg_req_topic);
            }
            else { // 'json'
                pxymqtt_client.publish(reg_req_topic, JSON.stringify(req_message['m2m:rqp']));
                NOPRINT==='true'?NOPRINT='true':console.log('<---- ' + reg_req_topic);
            }
        }
        else {
            NOPRINT==='true'?NOPRINT='true':console.log('pxymqtt is not ready');
        }
    });
});


function http_retrieve_CSEBase(callback) {
    var rqi = moment().utc().format('mmssSSS') + randomValueBase64(4);
    var resourceid = '/' + usecsebase;
    var responseBody = '';

    var options = {
        hostname: usemqttcbhost,
        port: usecsebaseport,
        path: resourceid,
        method: 'get',
        headers: {
            'X-M2M-RI': rqi,
            'Accept': 'application/json',
            'X-M2M-Origin': usecseid
        },
        rejectUnauthorized: false
    };

    if(usesecure == 'disable') {
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                responseBody += chunk;
            });

            res.on('end', function () {
                callback(res.headers['x-m2m-rsc'], responseBody);
            });
        });
    }
    else {
        options.ca = fs.readFileSync('ca-crt.pem');

        req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                responseBody += chunk;
            });

            res.on('end', function () {
                callback(res.headers['x-m2m-rsc'], responseBody);
            });
        });
    }

    req.on('error', function (e) {
        if(e.message != 'read ECONNRESET') {
            //console.log('[pxymqtt - http_retrieve_CSEBase] problem with request: ' + e.message);
        }
    });

    // write data to request body
    req.write('');
    req.end();
}

function forward_mqtt(forward_cseid, op, to, fr, rqi, ty, nm, inpc) {
    var forward_message = {};
    forward_message.op = op;
    forward_message.to = to;
    forward_message.fr = fr;
    forward_message.rqi = rqi;
    forward_message.ty = ty;
    forward_message.nm = nm;
    forward_message.pc = inpc;

    forward_message['@'] = {
        "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
    };

    var xmlString = js2xmlparser.parse("m2m:rqp", forward_message);

    var forward_topic = util.format('/oneM2M/req/%s/%s', usecseid.replace('/', ':'), forward_cseid);

    pxymqtt_client.publish(forward_topic, xmlString);
}
