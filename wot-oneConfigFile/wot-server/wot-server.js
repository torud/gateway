var restApp = require('./servers/http'),
  wsServer = require('./servers/websockets'),
  fs = require('fs');
var ip = require('ip');
var config = require('./resources/config');

var DevicePlugin;

var createServer = function (port, secure) {
  if (process.env.PORT) port = process.env.PORT;
  else if (port === undefined) port = config.WoTModel.customFields.port;
  if (secure === undefined) secure = config.WoTModel.customFields.secure;

  initPlugins(); //#A

  if (secure) {
    var https = require('https'); //#B
    var path = require('path');

    var keyFilePath = path.join(__dirname, 'resources', 'privateKey.pem');
    var key_file = fs.readFileSync(keyFilePath, 'utf8');

    var caFilePath = path.join(__dirname, 'resources', 'caCert.pem');
    var cert_file = fs.readFileSync(caFilePath, 'utf8');

    var passphrase = 'WoT-Gateway';

    var tlsConfig = {
      key: key_file,
      cert: cert_file,
      passphrase: passphrase
    };

    return server = https.createServer(tlsConfig, restApp) //#F
      .listen(port, function () {
        wsServer.listen(server, secure); //#G
        console.log('Secure WoT server started on adress %s on port %s', ip.address(), port);
      })
  } else { // not secure
    var http = require('http');
    return server = http.createServer(restApp)
      .listen(process.env.PORT || port, function () {
        wsServer.listen(server, secure);
        console.log('InsecureWoT server started on adress %s on port %s', ip.address(), port);
      })
  }
};

function initPlugins() {
  DevicePlugin = require('./resources/config').DevicePlugin;
  DevicePlugin = new DevicePlugin();
  DevicePlugin.start();
}

module.exports = createServer;

process.on('SIGINT', function () {
  DevicePlugin.stop();
  console.log('Bye, bye!');
  process.exit();
});

//#A Start the internal hardware plugins
//#B If in secure mode, import the HTTPS module
//#C The actual certificate file of the server
//#D The private key of the server generated earlier
//#E The password of the private key
//#F Create an HTTPS server using the config object
//#G By passing it the server you create, the WebSocket library will automatically detect and enable TLS support

// für Watchdog-Testzwecke (upstart oder systemd)
// setTimeout(function () {  
//   console.log('Throwing error now.');
//   throw new Error('User generated fault.');
// }, 1000);