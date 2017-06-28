var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 9600
});

port.on('open', function () {
    var config1 = '{"par":{"cmd":1,"id":0,"val":2500}}.\n';
    var config2 = '{"par":{"cmd":1,"id":1,"val":10000}}.\n';
    var config3 = '{"par":{"cmd":1,"id":2,"val":10000}}.\n';
    var config4 = '{"par":{"cmd":1,"id":3,"val":152000}}.\n';
    var config5 = '{"par":{"cmd":1,"id":4,"val":162}}.\n';
    var config6 = '{"par":{"cmd":1,"id":5,"val":389}}.\n';
    var config7 = '{"par":{"cmd":1,"id":6,"val":45000}}.\n';

    var sequenz = '{"rom":{"frm":[1,1],"val":"{g:[900,0],r:[0,30,0,0],wt:3000,g:[5000,0]}"}}.\n';
    sequenz += '{"sys":1}.\n';

    var config = config1 + config2 + config3 + config4 + config5 + config6 + config7;

    port.write(config, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('message written: ' + config);
    });

    port.write(sequenz, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('message written: ' + sequenz);
    });
});

port.on('data', function (data) {
    console.log('Data received: ' + data);
});

// open errors will be emitted as an error event 
port.on('error', function (err) {
    console.log('Error: ', err.message);
})
