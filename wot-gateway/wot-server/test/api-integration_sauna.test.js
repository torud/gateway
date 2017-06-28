var expect = require('chai').expect,
  request = require('request'),
  status = require('http-status'),
  util = require('util'),
  WebSocketClient = require('websocket').client;
var token = 'fRfLNLe9aBix0mHyeCdI0PSzNeLpPPgu';

describe('Sauna:', function () {
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
      rejectUnauthorized: false // accept unauthorized ca-certificates
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
      expect(model.links.properties.resources).to.have.keys('sauna');
      expect(model.links.properties.resources.sauna.values).to.have.keys(['targetTemp',
        'targetHum',
        'currTemp',
        'currHum',
        'duration',
        'light',
        'clock',
        'relais',
        'state',
        'error',
        'inUse',
        'bathOn',
        'libVersion',
        'puVersion',
        'bridgeVersion',
        'isOnline',
        'lastResponse'
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

  it('returns the sauna property of the NanoPi', function (done) {
    req.get(rootUrl + '/properties/sauna', function (err, res, sauna) {

      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(sauna).to.be.a('array');
      expect(sauna[0].isOnline).to.be.a('boolean');
      // other properties
      expect(sauna[0].timestamp).to.not.be.an('undefined');

      done();
    });
  });

  it('creates a "read target temperature" sendCommand action', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: { "par": { "rw": 0, "id": 0 } }
      },
      function (err, res, body) {

        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.NO_CONTENT);

        expect(res.headers.location).to.contain(uri);
        expect(res.headers.location).to.have.length.above(uri.length);

        done();
      });
  });

  it('creates a "read target temperature" sendCommand action as a string', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: '{ "par": { "rw": 0, "id": 0 } }'
      },
      function (err, res, body) {

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
      {
        body: { "par": { "rw": 0, "id": 1 } }
      },
      function (err, res, body) {
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
      {
        body: { "par": { "rw": 0, "id": 0 } }
      },
      function (err, res, body) {
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


  it('ensures a "set targetTemp" command changes the targetTemp property', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: { "par": { "rw": 1, "id": 0, "val": 42 } }
      },
      function (err, res, body) {
        req.get(rootUrl + '/properties/sauna', function (err, res, properties) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          // check the targetTemp value
          expect(properties).to.be.a('array');
          expect(properties).to.have.length.above(0);
          expect(properties.pop()['targetTemp']).to.be.a('number');
          expect(properties.pop()['targetTemp']).to.equal(42);

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
      expect(html).to.have.string('sauna');

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
  it('sends a set-property command and waits to receive a sauna property update via WebSocket', function (done) {
    this.timeout(5000);
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {
      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        {
          body: { "par": { "rw": 1, "id": 1, "val": 80 } }
        },
        function (err, res, something) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);

          expect(res.targetHum).to.be.a('number');
          expect(res.targetHum).to.be.above(0);
          expect(res.isOnline).to.be.a('boolean');
          expect(res.timestamp).to.be.a('string');
          connection.close();
          done();
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/properties/sauna?token=' + token);
  });

  it('sends a set-property command and connects to the properties via WebSocket, but with a wrong token', function (done) {
    this.timeout(5000);
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {
      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        {
          body: { "par": { "rw": 1, "id": 1, "val": 50 } }
        },
        function (err, res, something) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);

          expect(res.error).to.not.be.an('undefined');
          expect(res.error).to.be.a('string');
          expect(res.error).to.equal('Invalid access token.');
          connection.close();
          done();
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/properties/sauna?token=1234');
  });


  it('sends 2 set-property command and waits to receive two sauna propterty updates via WebSocket', function (done) {
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
        {
          body: { "par": { "rw": 1, "id": 1, "val": 80 } }
        },
        function (err, res, something) {
        });

      req.post(rootUrl + uri,
        {
          body: { "par": { "rw": 1, "id": 1, "val": 80 } }
        },
        function (err, res, something) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);

          expect(res.targetHum).to.be.a('number');
          expect(res.targetHum).to.be.above(0);
          expect(res.timestamp).to.be.a('string');
          i++;
          if (i > 1) {
            connection.close();
            done();
          }
        }
      });
    });
    client.connect('wss://146.136.39.87:' + port + '/properties/sauna?token=' + token);
  });


  it('sends an action and waits to receive it via WebSocket', function (done) {
    this.timeout(10000);
    var client = new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });
    client.on('connect', function (connection) {

      var duration = 900;
      // Post Action...
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        {
          body: { "par": { "rw": 1, "id": 4, "val": duration } }
        },
        function (err, res, body) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);
          // old version:
          // res =
          //   {
          //     "par": { "rw": 1, "id": 4, "val": 900 },
          //     "id": "85ae8ff0-4f4f-11e7-9798-1db0f184713d",
          //     "timestamp": "2017-06-12T11:14:22.191Z",
          //     "status": "completed"
          //   }

          // newer version:
          // res =
          //   {
          //     "command":
          //     {
          //       "par": { "rw": 1, "id": 4, "val": 900 }
          //     },
          //     "id": "47a6f430-5b4e-11e7-a8b8-035e5d1680fc",
          //     "status": "completed",
          //     "timestamp": "2017-06-27T17:35:42.579Z"
          //   }

          expect(res.command.par.val).to.be.a('number');
          expect(res.command.par.val).to.be.equal(duration);
          expect(res.command.par.rw).to.be.equal(1);
          expect(res.command.par.id).to.be.equal(4);
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


  // Wrong/Bad Commands
  it('sends a wrong spelled command which gets sent anyway', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: { "cmd": { "rwasdf": 1, "id": 666, "väl": 402 } }
      },
      function (err, res, body) {
        req.get(rootUrl + res.headers.location, function (err, res, action) {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(action).to.be.a('object');
          expect(action.command).to.be.a('object');
          expect(action.command.cmd.väl).to.be.a('number');
          expect(action.command.cmd.väl).to.be.equal(402);
          expect(action.status).to.be.a('string');
          expect(action.timestamp).to.be.a('string');
          expect(action.status).to.equal('completed');

          done();
        });
      });
  });


});