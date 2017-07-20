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
      function (err, res, body) {

        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.NO_CONTENT);

        expect(res.headers.location).to.contain(uri);
        expect(res.headers.location).to.have.length.above(uri.length);

        done();
      });
  });


  it('creates a sys:2 sendCommand action as a string', function (done) {
    this.timeout(4000);
    // wait a little to POST the action, because the action before was also a sys:2 coammand,
    // where the answer from the motor takes a little longer
    setTimeout(function () {
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        {
          body: '{ "sys" : 2 }'
        },
        function (err, res, body) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.NO_CONTENT);

          expect(res.headers.location).to.contain(uri);
          expect(res.headers.location).to.have.length.above(uri.length);
          expect(res.headers.location.uri).to.be.undefined;

          // wait a little to GET the properties
          setTimeout(function () {
            req.get(rootUrl + '/properties', function (err, res, properties) {
              expect(err).to.be.null;
              expect(res.statusCode).to.equal(status.OK);

              expect(properties).to.be.a('array');
              expect(properties).to.be.of.length(1);
              var motorPropterties = properties.pop();
              expect(motorPropterties.values.timestamp).to.be.a('string');
              expect(motorPropterties.values.lastACK).to.be.a('string');
              expect(motorPropterties.values.lastACK).to.equal('ACK');
              expect(motorPropterties.values.lastResponse).to.be.a('string');
              // console.log(motorPropterties);
              var info = JSON.parse(motorPropterties.values.lastResponse);
              info = info.info;
              expect(info).to.be.a('array');
              expect(info).to.have.length(6);
              for (var i = 0; i < info.length; i++) {
                expect(info[i]).to.have.property('id');
                expect(info[i]).to.have.property('val');
              }
              expect(info[0].id).to.equal('Position');
              expect(info[1].id).to.equal('Error Number');
              expect(info[2].id).to.equal('Error Counter');
              expect(info[3].id).to.equal('Prod. Version');
              expect(info[4].id).to.equal('FW Version');
              expect(info[5].id).to.equal('Seq. Version');
              done();
            });
          }, 500);
        });
    }, 1000);
  });

  it('retrieves a specific sendCommand action', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: { "par": { "cmd": 2 } }
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
        body: { "par": { "cmd": 2 } }
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

  it('sends a array of commands', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: [{ "sys": 2 },
        { "par": { "cmd": 0, "id": 1 } },
        { "rom": { "frm": [1, 1], "val": "{r:[0,30,0,0],wt:3000,g:[900,0]}" } },
        { "par": { "cmd": 1, "id": 6, "val": 45000 } }]
      },
      function (err, res, body) {
        var id = res.headers.location.split('/').pop();
        req.get(rootUrl + uri, function (err, res, actions) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(actions).to.be.an('array');
          expect(actions[0].id).to.equal(id);

          req.get(rootUrl + uri + '/' + id, function (err, res, action) {
            expect(err).to.be.null;
            expect(res.statusCode).to.equal(status.OK);
            expect(action).to.be.a('object');
            expect(action.command).to.be.a('array');
            expect(action.command).to.have.length(4);
            expect(action.command[0]).to.be.a('object');
            expect(action.command[0].sys).to.be.a('number');
            expect(action.command[0].sys).to.be.equal(2);
            expect(action.command[1]).to.be.a('object');
            expect(action.command[1].par).to.be.a('object');
            expect(action.command[1].par.cmd).to.equal(0);
            expect(action.status).to.be.a('string');
            expect(action.timestamp).to.be.a('string');
            expect(action.status).to.equal('completed');
            done();
          });
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
      {
        body: { "par": { "cmd": 1, "id": 0, "val": 2508 } }
      },
      function (err, res, body) {
        req.get(rootUrl + '/properties', function (err, res, properties) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          // check the maxSpeed value
          expect(properties).to.be.a('array');
          expect(properties).to.be.of.length(1);
          var motorProperties = properties.pop();
          expect(motorProperties.values['maxSpeed']).to.be.a('number');
          expect(motorProperties.values['maxSpeed']).to.equal(2508);

          done();
        });
      });
  });

  it('ensures a "set maxSpeed" command as a string changes the maxSpeed property', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: '{ "par": { "cmd": 1, "id": 0, "val": 2507 } }'
      },
      function (err, res, body) {
        req.get(rootUrl + '/properties', function (err, res, properties) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          // check the maxSpeed value
          expect(properties).to.be.a('array');
          expect(properties).to.be.of.length(1);
          var motorProperties = properties.pop();
          expect(motorProperties.values['maxSpeed']).to.be.a('number');
          expect(motorProperties.values['maxSpeed']).to.equal(2507);

          done();
        });
      });
  });

  it('sends a array of set-property commands which get set', function (done) {
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: [{ "par": { "cmd": 1, "id": 0, "val": 2500 } },
        { "par": { "cmd": 1, "id": 1, "val": 10000 } },
        { "par": { "cmd": 1, "id": 2, "val": 10000 } },
        { "par": { "cmd": 1, "id": 3, "val": 152000 } },
        { "par": { "cmd": 1, "id": 4, "val": 162 } },
        { "par": { "cmd": 1, "id": 5, "val": 389 } },
        { "par": { "cmd": 1, "id": 6, "val": 45000 } },
        { "par": { "cmd": 1, "id": 7, "val": 0 } }]
      },
      function (err, res, body) {
        var id = res.headers.location.split('/').pop();
        req.get(rootUrl + uri, function (err, res, actions) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(actions).to.be.an('array');
          expect(actions[0].id).to.equal(id);

          req.get(rootUrl + uri + '/' + id, function (err, res, action) {
            expect(err).to.be.null;
            expect(res.statusCode).to.equal(status.OK);
            expect(action).to.be.a('object');
            expect(action.command).to.be.a('array');
            expect(action.command).to.have.length(8);
            for (var i = 0; i < 8; i++) {
              expect(action.command[i]).to.be.a('object');
              expect(action.command[i].par).to.be.a('object');
              expect(action.command[i].par.cmd).to.be.a('number');
              expect(action.command[i].par.cmd).to.equal(1);
              expect(action.command[i].par.id).to.be.a('number');
              expect(action.command[i].par.val).to.be.a('number');
            }
            expect(action.status).to.be.a('string');
            expect(action.timestamp).to.be.a('string');
            expect(action.status).to.equal('completed');

            req.get(rootUrl + '/properties', function (err, res, properties) {

              expect(err).to.be.null;
              expect(res.statusCode).to.equal(status.OK);

              // check the values
              expect(properties).to.be.a('array');
              expect(properties).to.have.length.above(0);
              var motorProperties = properties.pop();
              expect(motorProperties.values['maxSpeed']).to.be.a('number');
              expect(motorProperties.values['maxSpeed']).to.equal(2500);
              expect(motorProperties.values['maxAccel']).to.be.a('number');
              expect(motorProperties.values['maxAccel']).to.equal(10000);
              expect(motorProperties.values['maxDecel']).to.be.a('number');
              expect(motorProperties.values['maxDecel']).to.equal(10000);
              expect(motorProperties.values['intersectionSpeed']).to.be.a('number');
              expect(motorProperties.values['intersectionSpeed']).to.equal(152000);
              expect(motorProperties.values['startGradient']).to.be.a('number');
              expect(motorProperties.values['startGradient']).to.equal(162);
              expect(motorProperties.values['endGradient']).to.be.a('number');
              expect(motorProperties.values['endGradient']).to.equal(389);
              expect(motorProperties.values['pwm']).to.be.a('number');
              expect(motorProperties.values['pwm']).to.equal(45000);
              expect(motorProperties.values['7']).to.be.a('number');
              expect(motorProperties.values['7']).to.equal(0);
              done();
            });
          });
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
        {
          body: { "par": { "cmd": 1, "id": 0, "val": 2500 } }
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
          body: { "par": { "cmd": 1, "id": 0, "val": 2500 } }
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
        {
          body: { "par": { "cmd": 1, "id": 0, "val": 2500 } }
        },
        function (err, res, something) {
        });

      req.post(rootUrl + uri,
        {
          body: { "par": { "cmd": 1, "id": 0, "val": 2500 } }
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
        function (err, res, body) {
        });

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          //console.log("Received over WS: '" + message.utf8Data + "'");
          var res = JSON.parse(message.utf8Data);
          // older version:
          // res =
          //   {
          //     "par": { "cmd": 1, "id": 0, "val": 2502 },
          //     "id": "86122840-33ba-11e7-9749-2760042d1d53",
          //     "timestamp": "2017-05-08T06:49:46.436Z",
          //     "status": "completed"
          //   }

          // newer version: 
          // res =
          //   {
          //     "command":
          //     {
          //       "par": { "cmd": 1, "id": 0, "val": 2502 }
          //     },
          //     "id": "4a693790-5b45-11e7-9b18-93d04cfb5c2d",
          //     "status": "completed",
          //     "timestamp": "2017-06-27T16:31:21.737Z"
          //   }

          expect(res.command.par.val).to.be.a('number');
          expect(res.command.par.val).to.be.equal(maxSpeedVal);
          expect(res.command.par.cmd).to.be.equal(1);
          expect(res.command.par.id).to.be.equal(0);
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
  it('sends a wrong spelled command which gets sent anyway, but receives a NACK', function (done) {
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
          expect(action.command.cmd.väl).to.be.a('number');
          expect(action.command.cmd.väl).to.be.equal(402);
          expect(action.status).to.be.a('string');
          expect(action.timestamp).to.be.a('string');
          expect(action.status).to.equal('completed');

          // wait a little to GET the properties
          setTimeout(function () {
            req.get(rootUrl + '/properties', function (err, res, properties) {
              expect(err).to.be.null;
              expect(res.statusCode).to.equal(status.OK);

              expect(properties).to.be.a('array');
              expect(properties).to.be.of.length(1);
              var motorPropterties = properties.pop();
              expect(motorPropterties.values.lastACK).to.be.a('string');
              expect(motorPropterties.values.lastACK).to.equal('NACK');
              done();
            });
          }, 500);

        });
      });
  });

  it('sends a wrong spelled sequence and a sys:1 which get sent anyway, but receives a ERROR 1', function (done) {
    this.timeout(4000);
    var uri = '/actions/sendCommand';
    req.post(rootUrl + uri,
      {
        body: [{ "rom": { "frm": [1, 1], "val": "{gehe zu position 900,0,0],wait:3000}" } },
        { "sys": 1 }]
      },
      function (err, res, body) {
        req.get(rootUrl + res.headers.location, function (err, res, action) {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(action.command).to.be.a('array');
          expect(action.command).to.have.length(2);
          expect(action.command[0]).to.be.a('object');
          expect(action.command[0].rom).to.be.a('object');
          expect(action.command[0].rom.val).to.be.a('string');
          expect(action.command[1]).to.be.a('object');
          expect(action.command[1].sys).to.be.a('number');
          expect(action.command[1].sys).to.equal(1);
          expect(action.status).to.be.a('string');
          expect(action.timestamp).to.be.a('string');
          expect(action.status).to.equal('completed');

          // wait a little to GET the properties
          setTimeout(function () {
            req.get(rootUrl + '/properties/motor', function (err, res, properties) {
              expect(err).to.be.null;
              expect(res.statusCode).to.equal(status.OK);
              expect(properties).to.be.a('array');
              expect(properties).to.have.length.above(2);
              // get the second most current property, because that's where the ERROR 1 message should be
              var motorProperties = properties[1];
              // console.log(motorProperties);
              expect(motorProperties.lastResponse).to.be.a('string');
              expect(motorProperties.lastResponse).to.equal('ERROR 1');
              done();
            });
          }, 2000);

        });
      });
  });

});