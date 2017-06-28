// only configuration file for a Web Thing: just fill out whats needed and run node wot.js

// ----------- model: what properties and actions does the Web Thing have? -----------
var WoTModel = {
    "id": "https://146.136.39.87:8484",
    "name": "WoT-Gateway KannMotion",
    "description": "A Web of Things Gateway for configurating a motor via KannMotion from Adlos AG.",
    "tags": [
        "KannMotion",
        "NanoPi",
        "WoT"
    ],
    "customFields": {
        "hostname": "146.136.39.87",
        "port": 9090,
        "secure": true,
        "generateNewAPIToken": false,
        "dataArraySize": 30
    },
    "links": {
        "product": {
            "link": "http://wiki.friendlyarm.com/wiki/index.php/NanoPi_NEO",
            "title": "Product this Web Thing is based on"
        },
        "properties": {
            "link": "/properties",
            "title": "List of Properties",
            "resources": {
                "motor": {
                    "name": "KannMotion",
                    "description": "electric step motor, controlled via KannMotion",
                    "values": {
                        "maxSpeed": {
                            "name": "maximum speed",
                            "description": "the maximum speed allowed by the motor",
                            "unit": "1/s",
                            "customFields": {}
                        },
                        "maxAccel": {
                            "name": "maximum acceleration",
                            "description": "the maximum acceleration allowed by the motor",
                            "unit": "1/s^2",
                            "customFields": {}
                        },
                        "maxDecel": {
                            "name": "maximum deceleration",
                            "description": "the maximum deceleration allowed by the motor",
                            "unit": "1/s^2",
                            "customFields": {}
                        },
                        "intersectionSpeed": {
                            "name": "intersection speed",
                            "description": "the intersection speed of the motor",
                            "unit": "stp/s",
                            "customFields": {}
                        },
                        "startGradient": {
                            "name": "start gradient",
                            "description": "the start gradient of the motor",
                            "unit": "% stp/s",
                            "customFields": {}
                        },
                        "endGradient": {
                            "name": "end gradient",
                            "description": "the end gradient of the motor",
                            "unit": "% stp/s",
                            "customFields": {}
                        },
                        "pwm": {
                            "name": "pulse-width modulation ratio",
                            "description": "the pulse-width modulation ratio of the motor",
                            "unit": "%",
                            "customFields": {}
                        },
                        "lastResponse": {
                            "name": "last response",
                            "description": "the last response received from the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "lastACK": {
                            "name": "last ACK",
                            "description": "the last ACK/NACK received from the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "isOnline": {
                            "name": "is online",
                            "description": "indicates whether the KannMotion control is online, i.e. turned on",
                            "unit": "boolean",
                            "customFields": {}
                        },
                        "position": {
                            "name": "position",
                            "description": "the last known position of the rotor",
                            "unit": "-",
                            "customFields": {}
                        },
                        "errorNumber": {
                            "name": "error number",
                            "description": "the most recent error number of the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "errorCounter": {
                            "name": "error counter",
                            "description": "the error counter of the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "prodVersion": {
                            "name": "product version",
                            "description": "the product version number of the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "fwVersion": {
                            "name": "firmware version",
                            "description": "the firmware version number of the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        },
                        "sequenceVersion": {
                            "name": "sequence version",
                            "description": "the current sequence version number of the KannMotion control",
                            "unit": "-",
                            "customFields": {}
                        }
                    },
                    "tags": [
                        "motor",
                        "step",
                        "electric"
                    ]
                }
            }
        },
        "actions": {
            "link": "/actions",
            "title": "Actions of this Web Thing",
            "resources": {
                "sendCommand": {
                    "name": "send command",
                    "description": "send a command to the KannMotion control of the motor",
                    "values": {
                        "par": {
                            "type": {
                                "cmd": {
                                    "type": "number",
                                    "required": true
                                },
                                "id": {
                                    "type": "number",
                                    "required": false
                                },
                                "val": {
                                    "type": "number",
                                    "required": false
                                }
                            },
                            "required": false
                        },
                        "sys": {
                            "type": "number",
                            "required": false
                        },
                        "rom": {
                            "type": {
                                "frm": {
                                    "type": "array",
                                    "required": true
                                },
                                "val": {
                                    "type": "string",
                                    "required": true
                                }
                            },
                            "required": false
                        },
                        "cmd": {
                            "type": "number",
                            "required": false
                        }
                    }
                }
            }
        },
        "type": {
            "link": "http://model.webofthings.io/",
            "title": "Instance type of the Pi"
        },
        "help": {
            "link": "http://adlos.com/",
            "title": "Documentation"
        },
        "ui": {
            "link": "/",
            "title": "User Interface"
        }
    }
} // model

exports.WoTModel = WoTModel;

// ----------- plugin: connects to the Thing and communicates with it -----------

var SerialPort = require('serialport');
var CorePlugin = require('./../plugins/corePlugin').CorePlugin,
    util = require('util'),
    utils = require('./../utils/utils.js');

// serial port over which the communication with the KannMotion control runs
var port = new SerialPort('/dev/ttyS2', {
    baudRate: 9600,
    parser: SerialPort.parsers.readline('\n')
});

var answerArray = [];
var commands = [];
var sequenzArray = [];
var initialCommands = '{"sys":2}\n{"par":{"cmd":2}}';
var properties = {};
var model: JSON;
// variable to indicate whether a timeout has occurred
var timer;
// time in ms after which the motor has to respond,
// otherwise properties.isOnline will be set to false
var timeoutTime = 5000;

/**
 * Creates the KannMotion plugin and registers the method to be called at certain events
 */
var DevicePlugin = exports.DevicePlugin = function (params: JSON) {
    // this, params, propertyId, doStop, doSimulate, actionsIds, doAction
    CorePlugin.call(this, params, 'motor', stop, null, ['sendCommand'], sendCommand);
    // model = links.properties.resources.motor;
    model = this.model;
};

util.inherits(DevicePlugin, CorePlugin);

/**
 * Opens the serial port and initializes the property values
 */
DevicePlugin.prototype.connectHardware = function () {
    port.on('open', function () {
        console.log('Serial Port opened');
        initPropertyValues();
        // Polling infos
        // interval = setInterval(function () {
        //     sendCommand(initialCommands);
        // }, 5000); // setInterval
    }); // port on open
} // connectHardware

/**
 * Initializes the properties defined in the model
 * and sends the initial commands to the KannMotion control
 */
function initPropertyValues() {
    /**
     * Ausgabe von console.log(Object.keys(model.values));:
     * [ 'maxSpeed',
        'maxAccel',
        'maxDecel',
        'intersectionSpeed',
        'startGradient',
        'endGradient',
        'pwm',
        'lastResponse',
        'lastACK',
        'isOnline',
        'position',
        'errorNumber',
        'errorCounter',
        'prodVersion',
        'fwVersion',
        'sequenceVersion' ]
     */
    var propertyNames = Object.keys(model.values);
    propertyNames.forEach(function (propertyName) {
        properties[propertyName] = 'unknown';
    });
    addValue(properties);
    sendCommand(initialCommands);
} // initPropertyValues


/**
 * Sends a command to the KannMotion control
 * @param value body of the HTTP-Request (located in array
 *              /model.links.actions.resources.sendCommand.data),
 *              or a string of commands sent from here (e.g. the initial commands)
 */
function sendCommand(value) {
    var action = value;
    if (typeof action !== 'string') {
        // the command is a JSON-Object (i.e. it came from a HTTP-Request)
        // save id, status and timestamp to add it later again to the action object
        var id = action.id;
        var status = action.status;
        var timestamp = action.timestamp;
        // delete id, status and timestamp in order to have only the desired command
        delete action.id;
        delete action.status;
        delete action.timestamp;
        if (action.par && action.par.cmd == 1) {
            // setting a property for configuration, add to the property ressource
            switch (action.par.id) {
                case 0: properties.maxSpeed = action.par.val; break;
                case 1: properties.maxAccel = action.par.val; break;
                case 2: properties.maxDecel = action.par.val; break;
                case 3: properties.intersectionSpeed = action.par.val; break;
                case 4: properties.startGradient = action.par.val; break;
                case 5: properties.endGradient = action.par.val; break;
                case 6: properties.pwm = action.par.val; break;
                default: properties[action.par.id] = action.par.val;
                    console.log('Unknown Parameter-ID: ' + action.par.id);
                    break;
            }
            addValue(properties);
        }
        if (action.constructor === Array) {
            // action is an array of commands
            action.forEach(function (element) {
                sequenzArray.push(JSON.stringify(element));
            });
        } else {
            // action is a single command
            var stringSequenz = JSON.stringify(action);
            sequenzArray = stringSequenz.split('\n');       // this may be redundant
        }
    } else {
        // the command is a string (i.e. it came from here within)
        var stringSequenz = action;
        sequenzArray = stringSequenz.split('\n');
    }
    commands = commands.concat(sequenzArray);
    sequenzArray = [];
    console.log('Commands to send: ' + commands);
    processAnswer();
    // Update the status of the actions object
    status = 'completed';
    // add the id, timestamp and status again to the action object
    // (so the created actions ressource can be retrieved via GET /actions/sendCommand/{id})
    action.id = id;
    action.timestamp = timestamp;
    action.status = status;
} // sendCommand


/**
 * Adds a timestamp to the data from the parameter
 * @param data  
 * 
 * Wenn beim Plugin addValue() aufgerufen wird, wird im Core-Plugin addValue() aufgerufen
 * (sofern nicht hier drin schon selbst implementiert),
 * welches dann wieder die Methode createValue im Plugin selbst aufruft
 * data: das, was bei addValue() hinzugefügt wird
 */
function createValue(data) {
    console.log('Properties updated!');
    return Object.assign(data, { "timestamp": utils.isoTimestamp() });
}

/**
 * Adds a value to the model.data array (i.e. links.properties.resources.motor.data array)
 * @param data  the data to add the model.data array
 */
function addValue(data) {
    utils.cappedPush(model.data, createValue(data));
}


/**
 * Sets the isOnline-property to true if an answer from the
 * KannMotion control is received within the specified time
 * (i.e. the parameter error is false)
 * @param error indicates whether there has been a timeout
 */
function timeoutHandler(error) {
    if (error) {
        console.log('Oh boy, there has been a timeout!');
        if (properties.isOnline != false) {
            properties.isOnline = false;
            addValue(properties);
        }
        commands = [];
    } else {
        //console.log('Oh boy, the timeout has been cleared!');
        if (properties.isOnline != true) {
            properties.isOnline = true;
            addValue(properties);
        }
    }
} // timeoutHandler

/**
 * Parses the answerArray, which contains the answers received from the KannMotion control.
 * Sends the next command in the commands array if there is still something to send.
 */
function processAnswer() {
    // Antwort des Motors auslesen und dem Model hinzufügen:
    // gesamtes answerArray abarbeiten und Antworten jeweils entfernen
    while (answerArray.length > 0) {
        var answer: string = answerArray.shift();
        properties.lastResponse = answer;
        console.log('Answer received: ' + answer);
        try {
            var antwort = JSON.parse(answer.trim());
            if (antwort.info) {
                /** Variante 1: Antwort auf sys:2-Befehl
                 * {"info":[
                 * {"id":"Position","val":"2855"},
                 * {"id":"Error Number","val":"0x00000000"},
                 * {"id":"Error Counter","val":"0"},
                 * {"id":"Prod. Version","val":"24.1"},
                 * {"id":"FW Version","val":"0.3"},
                 * {"id":"Seq. Version","val":"0.0"}
                 * ]}
                 */
                antwort.info.forEach(function (element, index) {
                    switch (element.id) {
                        case 'Position': properties.position = element.val; break;
                        case 'Error Number': properties.errorNumber = element.val; break;
                        case 'Error Counter': properties.errorCounter = element.val; break;
                        case 'Prod. Version': properties.prodVersion = element.val; break;
                        case 'FW Version': properties.fwVersion = element.val; break;
                        case 'Seq. Version': properties.sequenceVersion = element.val; break;
                        default: properties[element.id] = element.val;
                            console.log('Unknown info-Parameter: ' + element.id);
                            break;
                    }
                    if (index == antwort.info.lenght - 1) {
                        // Properties wurden aktualisiert, können dem Model hinzugefügt werden
                        addValue(properties);
                    }
                }) // forEach element in antwort.info
            } // antwort.info
            if (antwort.com && antwort.com.id == 'state') {
                /** Variante 2: Antwort ist ein ACK oder NACK
                 * {"com":{"id":"state","val":"ACK"}}
                 */
                properties.lastACK = antwort.com.val;  // ACK or NACK
                addValue(properties);
            } // antwort.com
            if (antwort.par) {
                /** Variante 3: Antwort auf cmd:2-Befehl
                 * {"par":{"id":0,"cmd":0,"val":2500}}
                 * {"par":{"id":1,"cmd":0,"val":10000}}
                 * {"par":{"id":2,"cmd":0,"val":10000}}
                 * {"par":{"id":3,"cmd":0,"val":152000}}
                 * {"par":{"id":4,"cmd":0,"val":162}}
                 * {"par":{"id":5,"cmd":0,"val":389}}
                 * {"par":{"id":6,"cmd":0,"val":45000}}
                 * {"par":{"id":7,"cmd":0,"val":0}}
                 * {"com":{"id":"state","val":"ACK"}}
                 */
                switch (antwort.par.id) {
                    case 0: properties.maxSpeed = antwort.par.val; break;
                    case 1: properties.maxAccel = antwort.par.val; break;
                    case 2: properties.maxDecel = antwort.par.val; break;
                    case 3: properties.intersectionSpeed = antwort.par.val; break;
                    case 4: properties.startGradient = antwort.par.val; break;
                    case 5: properties.endGradient = antwort.par.val; break;
                    case 6: properties.pwm = antwort.par.val; break;
                    default: console.log('Answer with unknown par id: ' + JSON.stringify(antwort.par.id));
                        break;
                }
                addValue(properties);
            } // antwort.par
        } catch (e) {
            // Could not parse answer from motor, i.e. it wasn't a JSON object (happens after sys:1 command)
            console.log('Failed to parse answer from motor!');
            console.log(e);
        }
    } // while answerArray.length > 0

    if (commands.length >= 1) {
        var command = commands.shift() + '\n';
        port.write(command, function (err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('Command sent: ' + command);
            // Clear the scheduled timeout handler (needed if many requests arrive in a short period)
            clearTimeout(timer);
            // Setup the timeout handler
            timer = setTimeout(function () {
                // This function will be called after <timeoutTime> milliseconds (approximately)
                // Clear the local timer variable, indicating the timeout has been triggered.
                timer = null;
                // Execute the callback with an error argument (i.e. set the isOnline property to false)
                timeoutHandler(true);
            }, timeoutTime);
        }); // port.write
    } // if
} // processAnswer

port.on('data', function (data) {
    // Run the callback only if the timeout handler has not yet fired
    if (timer) {
        // Clear the scheduled timeout handler
        clearTimeout(timer);
        // Run the callback (i.e. set the isOnline property to true)
        timeoutHandler(false);
    }
    if (data.startsWith('{') || data.startsWith('SEQUENCE')) {
        answerArray.push(data.toString());
        processAnswer();
    }
}); // port on data

// open errors will be emitted as an error event 
port.on('error', function (err) {
    console.log('Error: ', err.message);
    timeoutHandler(false);
});

/**
 * Closes the serial port
 */
function stop() {
    port.close();
}