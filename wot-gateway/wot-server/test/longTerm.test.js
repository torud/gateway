var expect = require('chai').expect,
  request = require('request'),
  status = require('http-status'),
  util = require('util'),
  WebSocketClient = require('websocket').client;
var token = 'w5tlEjRQlgtDs!@^Hg)dDWC1kR^hpAHR';

var numberOfTests = 3;
var numberOfRandomTests = 5;
var waitingTime = 3000;
var from = 3 * 1000;
var to = 10 * 1000;
var resources = [];
var accepts = [];

var defaultResources = ['/properties', '/actions', '/model',
  '/', '/actions/sendCommand'];

var defaultAccepts = ['application/json', 'text/html',
  'application/x-msgpack'];

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

  });

} // for
