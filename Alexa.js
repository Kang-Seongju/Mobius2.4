'use strict';

// --------------- Helpers that build all of the responses -----------------------

var http = require('http');
//var host = '223.194.33.104';
var host = '128.134.65.118';

function buildSpeechletResponse(title, output, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Hello, Tell me control command';
    const shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));
}

function dontKnowMean(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Not sure';
    const speechOutput = "Sorry, I don't know what are you saying.";
    const shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));
}

function turnOnDevice(intent, session, callback) {
    const cardTitle = 'Target Device Control';
    const targetDeviceSlot = intent.slots.Device;
    console.log('targetDeviceSlot');
    console.log(targetDeviceSlot);
    console.log(intent);
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    if (targetDeviceSlot) {
        const targetDevice = targetDeviceSlot.value;
        console.log('targetDevice: ' + targetDevice);
        sessionAttributes = targetDevice;

        var target = '';
        var path = '';
        switch(targetDevice){
            case 'hue lamp':
                path = 'Hue-Lamp/Brightness';
                target = 'Hue Lamp';
                break;            
            // case 'hue lamp 1':
            //     path = 'Hue-Lamp1/Brightness';
            //     target = 'Hue Lamp 1';
            //     break;
            // case 'hue lamp 2':
            //     path = 'Hue-Lamp2/Brightness';
            //     target = 'Hue Lamp 2';
            //     break;
            case 'a.j. lamp':
            case 'a. j. lamp':
            case 'a T. lamp':
            case '80 lamp':
                path = 'AJ-Lamp/Brightness';
                target = 'AJ-Lamp';
                break;
            case 'a.j. plug':
            case 'a. j. plug':
            case 'a T. plug':
            case '80 plug':
                path = 'AJ-Plug/Power';
                target = 'AJ-Plug';
                break;
        }

        var options = {
            "method": "POST",
            "hostname": host,
            "port": "7579",
            "path": "/Mobius/kwu-hub/" + path,
            "headers": {
                "Accept": "application/xml",
                "X-M2M-RI": "12345",
                "X-M2M-Origin": "Amazon_echo",
                "Content-Type": "application/vnd.onem2m-res+xml; ty=4",
            }
        };

        var req = http.request(options, function (res) {
            if(res.statusCode == 201 || res.statusCode == 409)
                speechOutput = "OK. Controls the " + target;
            else
                speechOutput = "Fail to control the device. Please try again.";

            // generateCin(speechOutput, function(response){
            //     callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
            // });
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    

        });

        var requestBody = 
            "<m2m:cin\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
                "<con>" + "on" + "</con>\n" +
            "</m2m:cin>";            
        req.write(requestBody);
        req.end();
    } 
}

function turnOffDevice(intent, session, callback) {
    const cardTitle = 'Target Device Control';
    const targetDeviceSlot = intent.slots.Device;
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    if (targetDeviceSlot) {
        const targetDevice = targetDeviceSlot.value;
        sessionAttributes = targetDevice;

        var target = '';
        var path = '';
        switch(targetDevice){
            case 'hue lamp':
                path = 'Hue-Lamp/Brightness';
                target = 'Hue Lamp';
                break;            
            // case 'hue lamp 1':
            //     path = 'Hue-Lamp1/Brightness';
            //     target = 'Hue Lamp 1';
            //     break;
            // case 'hue lamp 2':
            //     path = 'Hue-Lamp2/Brightness';
            //     target = 'Hue Lamp 2';
            //     break;
            case 'a.j. lamp':
            case 'a. j. lamp':
            case 'a T. lamp':
            case '80 lamp':
                path = 'AJ-Lamp/Brightness';
                target = 'AJ-Lamp';
                break;
            case 'a.j. plug':
            case 'a. j. plug':
            case 'a T. plug':
            case '80 plug':
                path = 'AJ-Plug/Power';
                target = 'AJ-Plug';
                break;
        }

        var options = {
            "method": "POST",
            "hostname": host,
            "port": "7579",
            "path": "/Mobius/kwu-hub/" + path,
            "headers": {
                "Accept": "application/xml",
                "X-M2M-RI": "12345",
                "X-M2M-Origin": "Amazon_echo",
                "Content-Type": "application/vnd.onem2m-res+xml; ty=4",
            }
        };

         var req = http.request(options, function (res) {
            if(res.statusCode == 201 || res.statusCode == 409)
                speechOutput = "OK. Controls the " + target;
            else
                speechOutput = "Fail to control the device. Please try again.";

            // generateCin(speechOutput, function(response){
            //     callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
            // });
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
        });

        var requestBody = 
            "<m2m:cin\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
                "<con>" + "off" + "</con>\n" +
            "</m2m:cin>";            
        req.write(requestBody);
        req.end();

    } 
}

function changeColorDevice(intent, session, callback) {
    const cardTitle = 'Lamp Color Change';
    const targetDeviceSlot = intent.slots.Device;
    const targetColor = intent.slots.Color.value;
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    if (targetDeviceSlot) {
        const targetDevice = targetDeviceSlot.value;
        sessionAttributes = targetDevice;

        var target = '';
        var path = '';
        switch(targetDevice){
            case 'hue lamp':
                path = 'Hue-Lamp/Color';
                target = 'Hue Lamp';
                break;
            // case 'hue lamp 1':
            //     path = 'Hue-Lamp1/Color';
            //     target = 'Hue Lamp 1';
            //     break;
            // case 'hue lamp 2':
            //     path = 'Hue-Lamp2/Color';
            //     target = 'Hue Lamp 2';
            //     break;
            case 'a.j. lamp':
            case 'a. j. lamp':
            case 'a T. lamp':
            case '80 lamp':
                path = 'AJ-Lamp/Color';
                target = 'AJ-Lamp';
                break;
        }

        var color = '';
        switch(targetColor){
            case 'red':
                if(path === 'AJ-Lamp/Color')
                    color = '30';
                else
                    color = '4500'
                break;
            case 'blue':
                if(path === 'AJ-Lamp/Color')
                    color = '4500';
                else
                    color = '45000'
                break;
            default:
                color = '30';
        }

        var options = {
            "method": "POST",
            "hostname": host,
            "port": "7579",
            "path": "/Mobius/kwu-hub/" + path,
            "headers": {
                "Accept": "application/xml",
                "X-M2M-RI": "12345",
                "X-M2M-Origin": "Amazon_echo",
                "Content-Type": "application/vnd.onem2m-res+xml; ty=4",
            }
        };

         var req = http.request(options, function (res) {
            if(res.statusCode == 201 || res.statusCode == 409)
                speechOutput = "OK " + target + " color change to " + targetColor;
            else
                speechOutput = "Fail to control the device. Please try again.";

            // generateCin(speechOutput, function(response){
            //     callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
            // });
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
        });

        var requestBody = 
            "<m2m:cin\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
                "<con>" + color + "</con>\n" +
            "</m2m:cin>";            
        req.write(requestBody);
        req.end();

    } 
}

function getDeviceInformation(intent, session, callback) {


    const cardTitle = 'Get Device List';
    let sessionAttributes = {};
    let shouldEndSession = true;
    let speechOutput = 'The device currently connected to the middleware is ';
    var options = {
        "method": "GET",
        "hostname": host,
        "port": "7579",
        "path": "/Mobius?fu=1&amp;ty=3",
        "headers": {
            "Accept": "application/xml",
            "X-M2M-RI": "12345",
            "X-M2M-Origin": "Amazon_echo",
        }
    };

    sessionAttributes = cardTitle;
    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks).toString();  
            var list = body.split("Mobius/");
            list.forEach(function(item, index) {
                var deviceList = list[index].split("/");
                if(deviceList.length < 3 && deviceList[0] === 'kwu-hub'){
                    if(deviceList[1].indexOf('rtvt') <= -1){
                        speechOutput += deviceList[1];
                        speechOutput += ", ";
                    }
                }
                if(index == list.length-1){
                    // generateCin(speechOutput, function(response){
                    //     callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
                    // });
                    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
                }
            });
        });
    });

    req.end();  
}

function generateCin(con, callback){
    var options = {
        "method": "POST",
        "hostname": host,
        "port": "7579",
        "path": "/Mobius/kwu-hub/Amazon-echo/Voice-value",
        "headers": {
            "Accept": "application/xml",
            "X-M2M-RI": "12345",
            "X-M2M-Origin": "Amazon_echo",
            "Content-Type": "application/vnd.onem2m-res+xml; ty=4",
        }
    };

    var req = http.request(options, function (res) {
        if(res.statusCode == 201 || res.statusCode == 409)
            console.log('Insert cin success');
        else
            console.log('Insert cin fail');
        callback('OK');
    });

    var requestCinBody = 
        "<m2m:cin\n" +
            "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
            "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
            "<con>" + con + "</con>\n" +
        "</m2m:cin>";         
    req.write(requestCinBody);
    req.end();
}

function registerHierarchyCnt(callback){
    console.log('registerHierarchyCnt function run');
    var options = {
        "method": "POST",
        "hostname": host,
        "port": "7579",
        "path": "/Mobius/kwu-hub/Amazon-echo",
        "headers": {
            "Accept": "application/xml",
            "X-M2M-RI": "12345",
            "X-M2M-Origin": "Amazon_echo",
            "Content-Type": "application/vnd.onem2m-res+xml; ty=3",
        }
    };

    var req = http.request(options, function (res) {
        if(res.statusCode == 201 || res.statusCode == 409)
            callback("YES");
        else
            callback("NO");
    });

    var requestBody = 
        "<m2m:cnt\n" +
            "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
            "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn = \"" + 'Voice-value' + "\">\n" +
            "<lbl>Amazon-echo</lbl>\n" +
            "<mni>5</mni>\n" +
        "</m2m:cnt>";            
    req.write(requestBody);
    req.end();
}

function registerDevice(intent, session, callback) {


    const cardTitle = 'Register device to List';
    let sessionAttributes = {};
    let shouldEndSession = true;
    let speechOutput = 'Successfully Amazon echo device is registered to mobius';

    sessionAttributes = cardTitle;
    var options = {
            "method": "POST",
            "hostname": host,
            "port": "7579",
            "path": "/Mobius/kwu-hub",
            "headers": {
                "Accept": "application/xml",
                "X-M2M-RI": "12345",
                "X-M2M-Origin": "Amazon_echo",
                "Content-Type": "application/vnd.onem2m-res+xml; ty=3",
            }
        };

        console.log('registerDevice');
         var req = http.request(options, function (res) {
            console.log('res.statusCode: ' + res.statusCode);
            if(res.statusCode == 201){
                console.log('OK');
                registerHierarchyCnt(function(response) {
                    if(response === 'YES')
                        speechOutput = 'Successfully Amazon echo device is registered to mobius';
                    else
                        speechOutput = "Sorry, Fail to register the device";
                });
            }
            else if(res.statusCode == 409){
                speechOutput = "The device is already registered";
                console.log('already registered');
            }
            else{
                speechOutput = "Sorry, Fail to register the device";
                console.log('register fail');
            }
            // generateCin(speechOutput, function(response){
            //     callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
            // });
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, shouldEndSession));    
        });

        var requestBody = 
            "<m2m:cnt\n" +
                "xmlns:m2m=\"http://www.onem2m.org/xml/protocols\"\n" +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" rn = \"" + 'Amazon-echo' + "\">\n" +
                "<lbl>Amazon-echo</lbl>\n" +
                "<mni>5</mni>\n" +
            "</m2m:cnt>";           
        req.write(requestBody);
        req.end();
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'DeviceInformationIntent') {
        getDeviceInformation(intent, session, callback);
    }else if(intentName === 'DeviceRegisterIntent') {
        registerDevice(intent, session, callback);
    }
    else if (intentName === 'TurnOnDeviceIntent') {
        turnOnDevice(intent, session, callback);
    }else if (intentName === 'TurnOffDeviceIntent') {
        turnOffDevice(intent, session, callback);
    }else if (intentName === 'ChangeColorIntent') {
        changeColorDevice(intent, session, callback);
    }else if (intentName === 'SorryIntent') {
        dontKnowMean(callback);
    }else
        throw new Error('Invalid intent');
   
    // else if (intentName === 'AMAZON.HelpIntent') {
    //     getWelcomeResponse(callback);
    // } 
    // else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
    //     handleSessionEndRequest(callback);
    // } 
    // else {
    //     dontKnowMean(callback);
    //     //throw new Error('Invalid intent');
    // }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
