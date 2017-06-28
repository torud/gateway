var expect = require('chai').expect,
  request = require('request'),
  status = require('http-status'),
  util = require('util'),
  WebSocketClient = require('websocket').client;

describe('Authentication:', function () {
  var req;
  var reqToken;
  var reqTokenWrong;
  var rootUrlAuth = 'https://146.136.39.87';
  var token = '';
  var user = {};

  before(function () {
    // prepare the request
    req = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });
  });

  after(function () {

  });


  it('returns the login page', function (done) {
    req.get(rootUrlAuth + '/login', {
      json: false, headers: {
        'Accept': 'text/html'
      }
    }, function (err, res, html) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(html).to.be.a('string');
      expect(html).to.have.string('<!DOCTYPE html>');
      expect(html).to.have.string('Password');

      done();
    });
  });


  it('returns status code 401 after a GET /', function (done) {
    req.get(rootUrlAuth, {
      json: false, headers: {
        'Accept': 'text/html'
      }
    }, function (err, res, html) {
      //console.log(html);
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.UNAUTHORIZED);
      expect(html).to.be.a('string');
      expect(html).to.have.string('Unauthorized');

      done();
    });
  });

  it('returns status code 401 after a POST with wrong password', function (done) {
    // Post Action...
    var uri = '/login';
    var pw = 'wrongPW';
    req.post(rootUrlAuth + uri,
      { form: { username: 'Thor', password: pw } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.UNAUTHORIZED);
        expect(html).to.be.a('string');
        expect(html).to.have.string('Unauthorized');
        expect(res.headers.token).to.be.undefined;

        done();
      });
  });

  it('returns status code 401 after a POST with empty password', function (done) {
    // Post Action...
    var uri = '/login';
    var pw = '';
    req.post(rootUrlAuth + uri,
      { form: { username: 'Thor', password: pw } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.UNAUTHORIZED);
        expect(html).to.be.a('string');
        expect(html).to.have.string('Unauthorized');
        expect(res.headers.token).to.be.undefined;

        done();
      });
  });

  it('returns the /profile page after a POST with right password', function (done) {
    // Post Action...
    var uri = '/login';
    var pw = '1234';
    req.post(rootUrlAuth + uri,
      { form: { username: 'Thor', password: pw } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.OK);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('Access granted');

        done();
      });
  });

  function getCookie(cookieLine, name) {
    var value = "; " + cookieLine;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  } // getCookie

  it('returns the current API token of the web thing and a user after logging in', function (done) {
    // Post Action...
    var uri = '/login';
    var pw = '1234';
    req.post(rootUrlAuth + uri,
      { form: { username: 'Thor', password: pw } },
      function (err, res, html) {
        // // Parse the received cookie
        // var cookieLine = res.headers['set-cookie'];
        // //console.log(cookieLine);
        // var cookie = getCookie(cookieLine, 'connect.sid');
        // console.log(cookie);
        // var etag = res.headers.etag;
        // console.log(etag);
        // req.cookie(cookieLine.shift());

        // get the access token and the user
        token = res.headers.token;
        user = res.headers.user;

        expect(token).to.be.a('string');
        expect(token).to.have.length.above(20);
        expect(user).to.be.a('string');
        var userObject = JSON.parse(user);
        expect(userObject).to.be.a('object');
        expect(userObject.id).to.be.a('number');
        expect(userObject.id).to.be.above(0);
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.OK);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('Access granted');

        reqToken = request.defaults({
          json: true, headers: {
            'Accept': 'application/json',
            'Authorization': token,
            'User': user
          },
          rejectUnauthorized: false // accept unauthorized ca-certificates
        });

        reqToken.get(rootUrlAuth, function (err, res, thing) {

          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(thing).to.be.a('object');
          expect(thing).to.have.keys(['id', 'name', 'description', 'tags', 'customFields']);
          done();
        });
      });
  });

  it('ensures that the received API token and user is working', function (done) {
    reqToken.get(rootUrlAuth, function (err, res, thing) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(thing).to.be.a('object');
      expect(thing).to.have.keys(['id', 'name', 'description', 'tags', 'customFields']);
      done();
    });
  });

  it('returns 401 after logging out and trying to GET /properties', function (done) {
    // Post Action...
    var uri = '/login';
    var pw = '1234';
    req.post(rootUrlAuth + uri,
      { form: { username: 'Thor', password: pw } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.OK);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('Access granted');

        req.get(rootUrlAuth + '/logout', function (err, res, html) {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(status.OK);
          expect(html).to.be.a('string');
          expect(html).to.have.string('<!DOCTYPE html>');
          expect(html).to.have.string('Password');

          req.get(rootUrlAuth + '/properties', function (err, res, html) {
            expect(err).to.be.null;
            expect(res.statusCode).to.equal(status.UNAUTHORIZED);
            expect(html).to.be.a('string');
            expect(html).to.have.string('Unauthorized');

            done();
          });
        });
      });
  });

  it('returns the model when sending the token and the user in the header', function (done) {
    reqToken.get(rootUrlAuth + '/model', function (err, res, model) {

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


  it('returns 401 when sending the wrong token and the right user in the header', function (done) {
    var wrongToken = '1234';
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': wrongToken,
        'User': user
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });

    reqTokenWrong.get(rootUrlAuth + '/model', function (err, res, model) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.UNAUTHORIZED);
      expect(model).to.be.a('string');
      expect(model).to.have.string('Unauthorized');
      done();
    });
  });

  it('returns 401 when sending the right token and the wrong user {} in the header', function (done) {
    var wrongUser = '{}';   // only strings allowed, if you send an object, the server will receive a '[object Object]' string
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token,
        'User': wrongUser
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });

    reqTokenWrong.get(rootUrlAuth + '/model', function (err, res, model) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.UNAUTHORIZED);
      expect(model).to.be.a('string');
      expect(model).to.have.string('Unauthorized');
      done();
    });
  });

  it('returns 401 when sending the right token and the wrong user { "id": "abc" } in the header', function (done) {
    var wrongUser = '{ "id": "abc" }';
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token,
        'User': wrongUser
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });

    reqTokenWrong.get(rootUrlAuth + '/model', function (err, res, model) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.UNAUTHORIZED);
      expect(model).to.be.a('string');
      expect(model).to.have.string('Unauthorized');
      done();
    });
  });

  it('returns 401 when sending the right token and the wrong user { "id": -1 } in the header', function (done) {
    var wrongUser = '{ "id": -1 }';
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token,
        'User': wrongUser
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });

    reqTokenWrong.get(rootUrlAuth + '/model', function (err, res, model) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.UNAUTHORIZED);
      expect(model).to.be.a('string');
      expect(model).to.have.string('Unauthorized');
      done();
    });
  });

  it('returns the model when sending the token and a valid user { "id": 0 } in the header', function (done) {
    var validUser = '{ "id": 0 }';
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token,
        'User': validUser
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });

    reqTokenWrong.get(rootUrlAuth + '/model', function (err, res, model) {

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


  it('returns the /profile page with token and user in header', function (done) {
    var uri = '/profile';
    reqToken.get(rootUrlAuth + uri, function (err, res, html) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(html).to.be.a('string');
      expect(html).to.have.string('<!DOCTYPE html>');
      expect(html).to.have.string('Access granted');

      done();
    });
  });

  it('returns the /editProfile page with token and user in header', function (done) {
    var uri = '/editProfile';
    reqToken.get(rootUrlAuth + uri, function (err, res, html) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(status.OK);
      expect(html).to.be.a('string');
      expect(html).to.have.string('<!DOCTYPE html>');
      expect(html).to.have.string('Edit your profile');

      done();
    });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but wrong old password', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: 'wrongPW', newPassword: 'Abcdefgh123', confirmPassword: 'Abcdefgh123' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('old password is incorrect');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but empty new password', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: '', confirmPassword: '' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('new password is empty');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but two different new passwords', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: 'asdfa', confirmPassword: 'asdfasdf' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('confirmed password is not equal to new password');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but not long enough passwords', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: '12345', confirmPassword: '12345' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('new password does not match the requested format');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but with password without a number', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: 'Abcdefghij', confirmPassword: 'Abcdefghij' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('new password does not match the requested format');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but with password without a upper case', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: 'abcdefghij1', confirmPassword: 'abcdefghij1' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('new password does not match the requested format');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but with password without a lower case', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: 'ABCDEFGHIJ1', confirmPassword: 'ABCDEFGHIJ1' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('new password does not match the requested format');

        done();
      });
  });

  it('returns 200 (OK) after POST /editProfile with token and user in header and correct passwords', function (done) {
    var uri = '/editProfile';
    reqToken.post(rootUrlAuth + uri,
      { form: { oldPassword: '1234', newPassword: 'aBCDEFGHIJ1', confirmPassword: 'aBCDEFGHIJ1' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.OK);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('successfully changed password');

        done();
      });
  });

  it('returns 420 (Policy Not Fulfilled) after POST /editProfile with token and user in header, but wrong user to the old password', function (done) {
    var validUser = '{ "id": 4 }';
    reqTokenWrong = request.defaults({
      json: true, headers: {
        'Accept': 'application/json',
        'Authorization': token,
        'User': validUser
      },
      rejectUnauthorized: false // accept unauthorized ca-certificates
    });
    var uri = '/editProfile';
    reqTokenWrong.post(rootUrlAuth + uri,
      { form: { oldPassword: 'aBCDEFGHIJ1', newPassword: 'abCDEFGHIJ1', confirmPassword: 'abCDEFGHIJ1' } },
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(420);
        expect(html).to.be.a('string');
        expect(html).to.have.string('<!DOCTYPE html>');
        expect(html).to.have.string('old password is incorrect');

        done();
      });
  });

  it('resets the passwords to factory settings', function (done) {
    var uri = '/reset';
    reqToken.get(rootUrlAuth + uri,
      function (err, res, html) {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(status.OK);
        expect(html).to.be.a('string');
        expect(html).to.have.string('Password reseted to factory settings');

        done();
      });
  });

});