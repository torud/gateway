var expect = require('chai').expect,
  request = require('request'),
  status = require('http-status'),
  util = require('util'),
  WebSocketClient = require('websocket').client;
var token = 'fRfLNLe9aBix0mHyeCdI0PSzNeLpPPgu';

describe('Motor:', function () {
  var req;
  var port = 8484;
  var rootUrl = 'https://146.136.39.87:' + port;


  before(function () {
    // prepare the request
    req = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token
      },
      rejectUnauthorized: false // accept unauthorisized ca-certificates
    });
  });

  after(function () {

  });


  it('returns the thing', function (done) {
    req.get(rootUrl, function (err, res, thing) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(thing).to.be.a('object');
      expect(thing).to.have.keys(['id', 'name', 'description', 'tags', 'customFields']);
      done();
    });
  });


  it('returns the model', function (done) {
    req.get(rootUrl + '/model', function (err, res, model) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(model).to.be.a('object');
      expect(model.links).to.have.keys(['product', 'properties', 'actions', 'type', 'help', 'ui']);
      expect(model.links.properties.resources).to.have.keys('motor');
      expect(model.links.properties.resources.motor.values).to.have.keys(['maxSpeed',
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
        'sequenceVersion'
      ]);
      expect(model.links.actions.resources).to.have.keys('sendCommand');
      done();
    });
  });


  it('returns the properties', function (done) {
    req.get(rootUrl + '/properties', function (err, res, props) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(props).to.be.a('array');
      expect(props).to.be.of.length(1);

      done();
    });
  });


  it('returns the actions', function (done) {
    req.get(rootUrl + '/actions', function (err, res, actions) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(actions).to.be.a('array');
      expect(actions[0].id).to.equal('sendCommand');
      expect(actions[0].name).to.equal('send command');

      done();
    });
  });

  it('returns the motor property of the NanoPi', function (done) {
    req.get(rootUrl + '/properties/motor', function (err, res, motor) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(motor).to.be.a('array');
      //console.log(motor);
      expect(motor[0].isOnline).to.be.a('boolean');
      // other properties
      expect(motor[0].timestamp).to.not.be.an('undefined');

      done();
    });
  });

  it('creates a sys:2 sendCommand action', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: { "sys": 2 }
      },
      function (err, res, ledStates) {

        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.NO_CONTENT);

        expect(res.headers.location).to.contain(uri);
        expect(res.headers.location).to.have.length.above(uri.length);

        done();
      });
  });


  it('retrieves a specific sendCommand action', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      { body: { "sys": 2 } },
      function (err, res, ledStates) {
        req.get(rootUrl + res.headers.location, function (err, res, action) {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          //console.log(action);
          // check the sensor value
          expect(action).to.be.a('object');
          expect(action.status).to.be.a('string');
          expect(action.timestamp).to.be.a('string');
          expect(action.status).to.equal('completed');

          done();
        });
      });
  });


  it('creates a sendCommand action and ensure it is in the right place in the list', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      { body: { "sys": 2 } },
      function (err, res, ledStates) {
        var id = res.headers.location.split('/').pop();
        req.get(rootUrl + uri, function (err, res, actions) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(actions).to.be.an('array');
          expect(actions[0].id).to.equal(id);
          done();
        });
      });
  });


  it('returns the sendCommand actions', function (done) {
    req.get(rootUrl + '/actions/sendCommand', function (err, res, commands) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);

      expect(commands).to.be.a('array');
      expect(commands[0].status).to.be.a('string');
      expect(commands[0].status).to.equal('completed');

      done();
    });
  });


  it('ensures a "set maxSpeed" command changes the maxSpeed property', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      { body: { "par": { "cmd": 1, "id": 0, "val": 2500 } } },
      function (err, res, ledStates) {
        req.get(rootUrl + '/properties/motor', function (err, res, properties) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          // check the maxSpeed value
          expect(properties).to.be.a('array');
          expect(properties).to.have.length.above(0);
          expect(properties.pop()['maxSpeed']).to.be.a('number');
          expect(properties.pop()['maxSpeed']).to.equal(2500);

          done();
        });
      });
  });


  // // JSONLD
  // it('returns the root page in JSON-LD', function (done) {
  //   req.get(rootUrl, {
  //     json: false, headers: {
  //       'Accept': 'application/ld+json'
  //     }
  //   }, function (err, res, jsonld) {
  //     expect(err).to.be.null;
  //     expect(res.statusCode).to.equal(status.OK);
  //     expect(jsonld).to.be.a('string');
  //     expect(jsonld).to.contain('@context');
  //     expect(jsonld).to.contain('@id');

  //     done();
  //   });
  // });

  // HTML views
  it('returns the properties page', function (done) {
    req.get(rootUrl + '/properties', {
      json: false, headers: {
        'Accept': 'text/html'
      }
    }, function (err, res, html) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(html).to.be.a('string');
      expect(html).to.have.string('<!DOCTYPE html>');
      expect(html).to.have.string('motor');

      done();
    });
  });

  it('returns the homepage of the gateway', function (done) {
    req.get(rootUrl, {
      json: false, headers: {
        'Accept': 'text/html'
      }
    }, function (err, res, html) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(html).to.be.a('string');
      expect(html).to.have.string('<!DOCTYPE html>');

      done();
    });
  });

  it('checks that access is unauthorized with an invalid token in the headers', function (done) {
    req.get(rootUrl + '/properties', {
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': '123'
      }
    }, function (err, res, stuff) {
      expect(res.statusCode).to.equal(status.FORBIDDEN);

      done();
    });
  });

  it('checks that access is authorized with token in query params', function (done) {
    req.get(rootUrl + '/properties?token=' + token, {
      json: true, headers: {
        'Accept': 'application/json'
      }
    }, function (err, res, stuff) {
      expect(res.statusCode).to.equal(status.OK);

      done();
    });
  });

  // WebSockets
  it('sends a set-property command and waits to receive a motor property update via WebSocket', function (done) {
    this.timeout(5000);
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {
      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        { body: { "par": { "cmd": 1, "id": 0, "val": 2500 } } },
        function (err, res, something) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);

          expect(res.maxSpeed).to.be.a('number');
          expect(res.maxSpeed).to.be.above(0);
          expect(res.isOnline).to.be.a('boolean');
          expect(res.timestamp).to.be.a('string');
          connection.close();
          done();
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/properties/motor?token=' + token);
  });


  it('sends 2 set-property command and waits to receive two motor propterty updates via WebSocket', function (done) {
    this.timeout(5000);

    var i = 0;
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {

      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        { body: { "par": { "cmd": 1, "id": 0, "val": 2500 } } },
        function (err, res, something) {
        });

      req.post(rootUrl + uri,
        { body: { "par": { "cmd": 1, "id": 0, "val": 2500 } } },
        function (err, res, something) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);

          expect(res.maxSpeed).to.be.a('number');
          expect(res.maxSpeed).to.be.above(0);
          expect(res.timestamp).to.be.a('string');
          i++;
          if (i > 1) {
            connection.close();
            done();
          }
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/properties/motor?token=' + token);
  });


  it('sends an action and waits to receive it via WebSocket', function (done) {
    this.timeout(10000);
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });
    client.on('connect', function (connection) {

      var maxSpeedVal = 2502;
      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        { body: { "par": { "cmd": 1, "id": 0, "val": maxSpeedVal } } },
        function (err, res, ledStates) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);
          // res =
          //   {
          //     "par": { "cmd": 1, "id": 0, "val": 2502 },
          //     "id": "86122840-33ba-11e7-9749-2760042d1d53",
          //     "timestamp": "2017-05-08T06:49:46.436Z",
          //     "status": "completed"
          //   }

          expect(res.par.val).to.be.a('number');
          expect(res.par.val).to.be.equal(maxSpeedVal);
          expect(res.par.cmd).to.be.equal(1);
          expect(res.par.id).to.be.equal(0);
          expect(res.status).to.be.equal('completed');
          expect(res.id).to.be.a('string');
          expect(res.timestamp).to.be.a('string');
          connection.close();
          done();
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/actions/sendCommand?token=' + token);
  });

});