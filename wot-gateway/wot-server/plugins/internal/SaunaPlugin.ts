var SerialPort = require('serialport');
var CorePlugin = require('./../corePlugin').CorePlugin,
    util = require('util'),
    utils = require('./../../utils/utils.js');

// default serial port over which the communication with the sauna runs
var port = new SerialPort('/dev/ttyS1', {
    baudRate: 115200,
    parser: SerialPort.parsers.readline('\n')
});

var answerArray = [];
var commands = [];
var sequenzArray = [];
var initialCommands = [{ "par": { "rw": 0, "id": 0 } },
{ "par": { "rw": 0, "id": 1 } },
{ "par": { "rw": 0, "id": 2 } },
{ "par": { "rw": 0, "id": 3 } },
{ "par": { "rw": 0, "id": 4 } },
{ "par": { "rw": 0, "id": 5 } },
{ "par": { "rw": 0, "id": 6 } },
{ "par": { "rw": 0, "id": 7 } },
{ "par": { "rw": 0, "id": 8 } },
{ "par": { "rw": 0, "id": 9 } },
{ "par": { "rw": 0, "id": 10 } },
{ "par": { "rw": 0, "id": 11 } },
{ "par": { "rw": 0, "id": 12 } },
{ "par": { "rw": 0, "id": 13 } },
{ "par": { "rw": 0, "id": 14 } }];
var properties = {};
var model;
// timer to check if the sauna sends an answer within a specified time
var timer;
// time in ms after which the sauna has to respond,
// otherwise properties.isOnline will be set to false
var timeoutTime = 5000;

/**
 * Creates the Sauna plugin and registers the method to be called at certain events
 */
var SaunaPlugin = exports.SaunaPlugin = function (params) {
    // this, params, propertyId, doStop, doSimulate, actionsIds, doAction
    CorePlugin.call(this, params, 'sauna', stop, null, ['sendCommand'], sendCommand);
    // model = links.properties.resources.sauna;
    model = this.model;
} // SaunaPlugin

util.inherits(SaunaPlugin, CorePlugin);

/**
 * Opens the serial port and initializes the property values
 */
SaunaPlugin.prototype.connectHardware = function () {
    port.on('open', function () {
        console.log('Serial Port opened');
        sauna_initPropertyValues();
        // Polling infos
        interval = setInterval(function () {
            if (properties.isOnline && properties.isOnline == true) sendCommand(initialCommands);
        }, 2000); // setInterval
    }); // port on open
} // connectHardware

/**
 * Initializes the properties defined in the model
 * and sends the initial commands to the sauna
 */
function sauna_initPropertyValues() {
    /**
     * Ausgabe von console.log(Object.keys(model.values));:
     * [    "targetTemp",
            "targetHum",
            "currTemp",
            "currHum",
            "duration",
            "light",
            "clock",
            "relais",
            "state",
            "error",
            "inUse",
            "bathOn",
            "libVersion",
            "puVersion",
            "bridgeVersion",
            "isOnline",
            "lastResponse" ]
     */
    var propertyNames = Object.keys(model.values);
    propertyNames.forEach(function (propertyName) {
        properties[propertyName] = 'unknown';
    });
    addValue(properties);
    if (initialCommands && initialCommands != {}) {
        sendCommand(initialCommands);
    }
} // sauan_initPropertyValues


/**
 * Sends a command to the sauna
 * @param value body of the HTTP-Request (located in array
 *              /model.links.actions.resources.sendCommand.data),
 *              or a string of commands sent from here (e.g. the initial commands)
 */
function sendCommand(value) {
    var action;
    if (value.command) {
        action = value.command;
    } else {
        // value has no command property if the method has been called from here whithin
        action = value;
    }
    if (typeof action !== 'string') {
        // the command is a JSON-Object
        if (action.par && action.par.rw == 1) {
            // setting a property for configuration, add to the property ressource
            switch (action.par.id) {
                case 0: properties.targetTemp = action.par.val; break;
                case 1: properties.targetHum = action.par.val; break;
                case 4: properties.duration = action.par.val; break;
                case 5: properties.light = action.par.val; break;
                case 6: properties.clock = action.par.val; break;
                case 7: properties.relais = action.par.val; break;
                case 2: case 3: case 8: case 9: case 10: case 11: case 12: case 13: case 14:
                    console.log('Parameter-ID: ' + action.par.id + ' is not meant to be written');
                    break;
                default: properties[action.par.id] = action.par.val;
                    console.log('Unknown Parameter-ID: ' + action.par.id);
                    break;
            }
            addValue(properties);
        } else if (action.cmd && action.cmd.id == 0) {
            console.log('start sauna command')
            if (action.cmd.temp) properties.targetTemp = action.cmd.temp;
            if (action.cmd.hum) properties.targetHum = action.cmd.hum;
            if (action.cmd.dur) properties.duration = action.cmd.dur;
            addValue(properties);
        }
        if (action.constructor === Array) {
            // action is an array of commands
            action.forEach(function (element) {
                sequenzArray.push(JSON.stringify(element));
            });
        } else {
            // action is a single command
            sequenzArray.push(JSON.stringify(action));
        }
    } else {
        // the command is a string
        var stringAction = action.trim().replace(/ /g, '');
        sequenzArray.push(stringAction);
    }
    commands = commands.concat(sequenzArray);
    sequenzArray = [];
    console.log('Commands to send: ' + commands);
    sauna_processAnswer();
    // Update the status of the value object
    value.status = 'completed';
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
    // console.log('Properties updated!');
    return Object.assign(data, { "timestamp": utils.isoTimestamp() });
}

/**
 * Adds a value to the model.data array (i.e. links.properties.resources.sauna.data array)
 * @param data  the data to add the model.data array
 */
function addValue(data) {
    // clone the data object, otherwise all model.data-array entries are the same
    var clonedData = JSON.parse(JSON.stringify(data));
    utils.cappedPush(model.data, createValue(data));
}


/**
 * Sets the isOnline-property to true if an answer from the
 * sauna is received within the specified time
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
 * Parses the answerArray, which contains the answers received from the sauna.
 * Sends the next command in the commands array if there is still something to send.
 */
function sauna_processAnswer() {
    // Antwort der Sauna auslesen und dem Model hinzufügen:
    // gesamtes answerArray abarbeiten und Antworten jeweils entfernen
    while (answerArray.length > 0) {
        var answer: string = answerArray.shift();
        properties.lastResponse = answer;
        console.log('Answer received: ' + answer);
        try {
            var antwort = JSON.parse(answer.trim());
            if (antwort.par && antwort.par.id && antwort.par.val) {
                /** Variante 1: Antwort auf ein Property get/set
                 * {"par":{"rw":0,"id":0,"val":42}}
                 */
                switch (antwort.par.id) {
                    case 0: properties.targetTemp = antwort.par.val; break;
                    case 1: properties.targetHum = antwort.par.val; break;
                    case 2: properties.currTemp = antwort.par.val; break;
                    case 3: properties.currHum = antwort.par.val; break;
                    case 4: properties.duration = antwort.par.val; break;
                    case 5: properties.light = antwort.par.val; break;
                    case 6: properties.clock = antwort.par.val; break;
                    case 7: properties.relais = antwort.par.val; break;
                    case 8: properties.state = antwort.par.val; break;
                    case 9: properties.error = antwort.par.val; break;
                    case 10: properties.inUse = antwort.par.val; break;
                    case 11: properties.bathOn = antwort.par.val; break;
                    case 12: properties.libVersion = antwort.par.val; break;
                    case 13: properties.puVersion = antwort.par.val; break;
                    case 14: properties.bridgeVersion = antwort.par.val; break;
                    default: console.log('Answer with unknown par id: ' + JSON.stringify(antwort.par.id));
                        break;
                }
                addValue(properties);
            } // antwort.par
            if (antwort.cmd && antwort.cmd.id) {
                /** Variante 2: Antwort auf ein Kommando (z.B. start, stop)
                 * {"cmd":{"id":0,"temp":80,"hum":30,"dur":15,"state":"ACK"}} oder
                 * {"cmd":{"id":1,"state":"ACK"}} oder
                 * {"cmd":{"id":3,"val":"password","state":"ACK"}}
                 */
                if (antwort.cmd.id == 0) {
                    properties.targetTemp = antwort.cmd.temp;
                    properties.targetHum = antwort.cmd.hum;
                    properties.duration = antwort.cmd.dur;
                    addValue(properties);
                }
            } // antwort.cmd
        } catch (e) {
            // Could not parse answer from sauna, i.e. it wasn't a JSON object
            console.log('Failed to parse answer from the sauna or bridge!');
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
} // sauna_processAnswer

port.on('data', function (data) {
    // Clear the scheduled timeout handler
    clearTimeout(timer);
    // Run the callback (i.e. set the isOnline property to true)
    timeoutHandler(false);
    answerArray.push(data.toString());
    sauna_processAnswer();
}); // port on data

// open errors will be emitted as an error event 
port.on('error', function (err) {
    console.log('Error: ', err.message);
});

/**
 * Closes the serial port
 */
function stop() {
    port.close();
} // stop