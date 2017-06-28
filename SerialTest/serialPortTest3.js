var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 9600
});
var answer = '';
var first = true;
var i = 0;
var config = [];
port.on('open', function () {
    var config1 = '{"par":{"cmd":1,"id":0,"val":2500}}\n';
    var config2 = '{"par":{"cmd":1,"id":1,"val":10000}}\n';
    var config3 = '{"par":{"cmd":1,"id":2,"val":10000}}\n';
    var config4 = '{"par":{"cmd":1,"id":3,"val":152000}}\n';
    var config5 = '{"par":{"cmd":1,"id":4,"val":162}}\n';
    var config6 = '{"par":{"cmd":1,"id":5,"val":389}}\n';
    var config7 = '{"par":{"cmd":1,"id":6,"val":45000}}\n';
    var sequenz = '{"rom":{"frm":[1,1],"val":"{g:[900,0],r:[0,30,0,0],wt:3000,g:[5000,0]}"}}\n';
    var sys1 = '{"sys":1}\n';
    config = [config1, config2, config3, config4, config5, config6, config7, sequenz, sys1];
    processAnswer();
}); // port on open
function processAnswer() {
    if (!first) {
        console.log('Answer received: ' + answer);
        answer = '';
    }
    first = false;
    if (i < config.length) {
        var command = config[i];
        i++;
        //console.log("Sending command: " + command);
        port.write(command, function (err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('Command sent: ' + command);
        });
        //console.log("Waiting for answer from command: " + command);
    }
}
port.on('data', function (data) {
    var response = data.toString();
    //console.log('Data received: ' + response);
    answer += response;
    if (answer.includes('}}')) {
        processAnswer();
    }
});
// open errors will be emitted as an error event 
port.on('error', function (err) {
    console.log('Error: ', err.message);
});
