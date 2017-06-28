var expect = require('chai').expect,
  request = require('request'),
  status = require('http-status'),
  util = require('util'),
  WebSocketClient = require('websocket').client;
var token = 'fRfLNLe9aBix0mHyeCdI0PSzNeLpPPgu';

var numberOfTests = 3;
var numberOfRandomTests = 5;
var waitingTime = 3000;
var from = 3 * 1000;
var to = 10 * 1000;
var resources = [];
var accepts = [];

var defaultResources = ['/properties', '/actions', '/model',
  '/', '/properties/sauna', '/actions/sendCommand'];

var defaultAccepts = ['application/json', 'text/html',
  'application/x-msgpack', 'application/ld+json'];

function shuffle(callback) {
  resources = [];
  accepts = [];
  for (var i = 0; i < numberOfRandomTests; i++) {
    var randomResource = Math.round((defaultResources.length - 1) * Math.random());
    resources.push(defaultResources[randomResource]);
    var randomAccept = Math.round((defaultAccepts.length - 1) * Math.random());
    accepts.push(defaultAccepts[randomAccept]);
  }
  callback();
}

for (var i = 0; i < numberOfTests; i++) {

  describe('Long term test Nr. ' + (i + 1) + '/' + numberOfTests + ':', function () {
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

    shuffle(function () {
      resources.forEach(function (dataItem, index) {
        var accept = accepts[index];
        it('returns the ' + dataItem + ' page with accept = ' + accept,
          function (done) {
            req.get(rootUrl + dataItem, {
              headers: {
                'Accept': accept
              }
            }, function (err, res, body) {
              expect(err).to.be.null;
              expect(res.statusCode).to.equal(status.OK);

              if (accept == 'text/html') {
                expect(body).to.be.a('string');
                expect(body).to.have.string('<!DOCTYPE html>');
              } else if (accept == 'application/json') {
                if (body instanceof Array) {
                  expect(body).to.be.a('array');
                } else {
                  expect(body).to.be.a('object');
                }
              }

              done();
            });
          });
      }); // forEach
    }); // shuffle

    it('returns the thing', function (done) {
      // wait some time with execution, so that there is a pause between the several test runs
      waitingTime = from + (to - from) * Math.random();
      this.timeout(waitingTime + 1000);

      setTimeout(function () {
        req.get(rootUrl, function (err, res, thing) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);

          expect(thing).to.be.a('object');
          expect(thing).to.have.keys(['id', 'name', 'description', 'tags', 'customFields']);
          done();
        });
      }, waitingTime);

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
        {
          body: { "par": { "rw": 0, "id": 0 } }
        },
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
        {
          body: { "par": { "rw": 0, "id": 0 } }
        },
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


    it('ensures a "set targetTemp" command changes the targetTemp property', function (done) {
      var uri = '/actions/sendCommand';
      req.post(rootUrl + uri,
        {
          body: { "par": { "rw": 1, "id": 0, "val": 42 } }
        },
        function (err, res, ledStates) {
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
            //     "par": { "rw": 1, "id": 4, "val": 900 },
            //     "id": "85ae8ff0-4f4f-11e7-9798-1db0f184713d",
            //     "timestamp": "2017-06-12T11:14:22.191Z",
            //     "status": "completed"
            //   }

            expect(res.par.val).to.be.a('number');
            expect(res.par.val).to.be.equal(duration);
            expect(res.par.rw).to.be.equal(1);
            expect(res.par.id).to.be.equal(4);
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

} // for
