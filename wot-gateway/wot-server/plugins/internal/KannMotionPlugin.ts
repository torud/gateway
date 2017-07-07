var SerialPort = require('serialport');
var CorePlugin = require('./../corePlugin').CorePlugin,
    util = require('util'),
    utils = require('./../../utils/utils.js');

// default serial port over which the communication with the KannMotion control runs
var port = new SerialPort('/dev/ttyS1', {
    baudRate: 9600,
    parser: SerialPort.parsers.readline('\n')
});

var myself;
var answerArray = [];
var commands = [];
var sequenzArray = [];
var initialCommands = [{ "sys": 2 }, { "par": { "cmd": 2 } }];
var interval;
var properties = {};
var model: JSON;
// timer to check if motor sends an answer within a specified time
var timer;
// time in ms after which the motor has to respond,
// otherwise properties.isOnline will be set to false
var timeoutTime = 5000;

/**
 * Creates the KannMotion plugin and registers the method to be called at certain events
 */
var KannMotionPlugin = exports.KannMotionPlugin = function (params: JSON) {
    // this, params, propertyId, doStop, doSimulate, actionsIds, doAction
    CorePlugin.call(this, params, 'motor', stop, null, ['sendCommand'], sendCommand);
    // model = links.properties.resources.motor;
    model = this.model;
    myself = this;
} // KannMotionPlugin

util.inherits(KannMotionPlugin, CorePlugin);

/**
 * Opens the serial port and initializes the property values
 */
KannMotionPlugin.prototype.connectHardware = function () {
    port.on('open', function () {
        console.log('Serial Port opened');
        initPropertyValues();
        // Polling infos
        // --> just sending the initialCommands doesn't work very well with the KannMotion control,
        // because the motor stops if a { "par": { "cmd": 2 } } command is sent
        // --> maybe just send a { "sys": 2 } command
        // interval = setInterval(function () {
        //     sendCommand(initialCommands);
        // }, 2000); // setInterval
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
    myself.addValue(properties);
    sendCommand(initialCommands);
} // initPropertyValues


/**
 * Sends a command to the KannMotion control
 * @param value body of the HTTP-Request (located in array
 *              /model.links.actions.resources.sendCommand.data),
 */
function sendCommand(value) {
    // console.log('value = ' + JSON.stringify(value));
    var action;
    if (value.command) {
        action = value.command;
    } else {
        // value has no command property if the method has been called from here whithin
        action = value;
    }
    if (typeof action !== 'string') {
        // the command is a JSON-Object
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
            myself.addValue(properties);
        }
        if (action.constructor === Array) {
            // console.log('Payload is an array');
            // action is an array of commands
            action.forEach(function (element) {
                sequenzArray.push(JSON.stringify(element));
            });
        } else {
            // action is a single command
            sequenzArray.push(JSON.stringify(action));
        }
    } else {
        // console.log('Payload is a string');
        // the command is a string
        var stringAction = action.trim().replace(/ /g, '');
        sequenzArray.push(stringAction);
    }
    commands = commands.concat(sequenzArray);
    sequenzArray = [];
    console.log('Commands to send: ' + commands);
    processAnswer();
    // Update the status of the value object
    value.status = 'completed';
    // console.log('Action after completion:');
    // console.log(JSON.stringify(value));
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
    //console.log('Properties updated!');
    return Object.assign(data, { "timestamp": utils.isoTimestamp() });
} // createValue


/**
 * Adds a value to the model.data array (i.e. links.properties.resources.motor.data array)
 * @param data  the data to add the model.data array
 */
KannMotionPlugin.prototype.addValue = function (data) {
    // clone the data object, otherwise all model.data-array entries are the same
    var clonedData = JSON.parse(JSON.stringify(data));
    utils.cappedPush(model.data, createValue(clonedData));
} // addValue


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
            myself.addValue(properties);
        }
        commands = [];
    } else {
        //console.log('Oh boy, the timeout has been cleared!');
        if (properties.isOnline != true) {
            properties.isOnline = true;
            myself.addValue(properties);
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
        console.log('Answer received: ' + answer);
        try {
            var antwort = JSON.parse(answer.trim());
            if (!antwort.com) {
                // don't shot (N)ACKs in last response, they have a seperate property
                properties.lastResponse = answer;
            }
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
                    if (index == antwort.info.length - 1) {
                        // Properties wurden aktualisiert, können dem Model hinzugefügt werden
                        myself.addValue(properties);
                    }
                }) // forEach element in antwort.info
            } // antwort.info
            if (antwort.com && antwort.com.id == 'state') {
                /** Variante 2: Antwort ist ein ACK oder NACK
                 * {"com":{"id":"state","val":"ACK"}}
                 */
                properties.lastACK = antwort.com.val;  // ACK or NACK
                myself.addValue(properties);
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
                myself.addValue(properties);
            } // antwort.par
        } catch (e) {
            // Could not parse answer from motor, i.e. it wasn't a JSON object (happens after sys:1 command)
            properties.lastResponse = answer;
            myself.addValue(properties);
            console.error('Failed to parse answer from motor!');
            console.error(e);
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
    // Clear the scheduled timeout handler
    clearTimeout(timer);
    // Run the callback (i.e. set the isOnline property to true)
    timeoutHandler(false);
    answerArray.push(data.toString());
    processAnswer();
}); // port on data

// open errors will be emitted as an error event 
port.on('error', function (err) {
    console.log('Error: ', err.message);
}); // port on error

/**
 * Closes the serial port
 */
function stop() {
    port.close();
} // stop