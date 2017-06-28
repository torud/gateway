var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyS1', {
  baudRate: 9600
});
 
port.on('open', function() {
  var command = "{\"sys\":2}.\n\r";
  port.write(command, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written: ' + command);
  });
});

port.on('data', function (data) {
  console.log('Data received: ' + data);
});
 
// open errors will be emitted as an error event 
port.on('error', function(err) {
  console.log('Error: ', err.message);
})
