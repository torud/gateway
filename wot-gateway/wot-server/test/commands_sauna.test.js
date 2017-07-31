var expect = require('chai').expect,
    request = require('request'),
    status = require('http-status'),
    util = require('util'),
    WebSocketClient = require('websocket').client;
var token = 'fRfLNLe9aBix0mHyeCdI0PSzNeLpPPgu';

var waitingTimeBetween = 300;
var waitingTimeToGET = 500;

describe('SCommands:', function () {
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

    // various commands
    var commands = [
        // write property commands
        { "par": { "rw": 1, "id": 0, "val": 42 } },
        { "par": { "rw": 1, "id": 1, "val": 80 } },
        { "par": { "rw": 1, "id": 4, "val": 900 } },
        { "par": { "rw": 1, "id": 5, "val": 50 } },
        { "par": { "rw": 1, "id": 6, "val": 25200 } },
        { "par": { "rw": 1, "id": 7, "val": 63 } },
        // read property commands
        { "par": { "rw": 0, "id": 0 } },
        { "par": { "rw": 0, "id": 1 } },
        { "par": { "rw": 0, "id": 2 } },
        { "par": { "rw": 0, "id": 3 } },
        { "par": { "rw": 0, "id": 4 } },
        { "par": { "rw": 0, "id": 5 } },
        { "par": { "rw": 0, "id": 6 } },
        { "par": { "rw": 0, "id": 7 } },
        { "par": { "rw": 0, "id": 8 } },
        { "par": { "rw": 0, "id": 9 } },
        { "par": { "rw": 0, "id": 10 } },
        { "par": { "rw": 0, "id": 11 } },
        { "par": { "rw": 0, "id": 12 } },
        { "par": { "rw": 0, "id": 13 } },
        { "par": { "rw": 0, "id": 14 } },
        // commands
        { "cmd": { "id": 0, "temp": 80, "hum": 30, "dur": 15 } },
        { "cmd": { "id": 1 } },
        { "cmd": { "id": 2 } },
    ];
    var answers = [
        // write property answers
        { "par": { "rw": 1, "id": 0, "val": 42 } },
        { "par": { "rw": 1, "id": 1, "val": 80 } },
        { "par": { "rw": 1, "id": 4, "val": 900 } },
        { "par": { "rw": 1, "id": 5, "val": 50 } },
        { "par": { "rw": 1, "id": 6, "val": 25200 } },
        { "par": { "rw": 1, "id": 7, "val": 63 } },
        // read property answers
        { "par": { "rw": 0, "id": 0, "val": 42 } },
        { "par": { "rw": 0, "id": 1, "val": 80 } },
        { "par": { "rw": 0, "id": 2, "val": 25 } },
        { "par": { "rw": 0, "id": 3, "val": 75 } },
        { "par": { "rw": 0, "id": 4, "val": 900 } },
        { "par": { "rw": 0, "id": 5, "val": 50 } },
        { "par": { "rw": 0, "id": 6, "val": 25200 } },
        { "par": { "rw": 0, "id": 7, "val": 63 } },
        { "par": { "rw": 0, "id": 8, "val": 42 } },
        { "par": { "rw": 0, "id": 9, "val": 0 } },
        { "par": { "rw": 0, "id": 10, "val": 0 } },
        { "par": { "rw": 0, "id": 11, "val": 0 } },
        { "par": { "rw": 0, "id": 12, "val": 100 } },
        { "par": { "rw": 0, "id": 13, "val": 200 } },
        { "par": { "rw": 0, "id": 14, "val": 2 } },
        // answers to commands
        { "cmd": { "id": 0, "temp": 80, "hum": 30, "dur": 15 } },
        { "cmd": { "id": 1 } },
        { "cmd": { "id": 2 } },
    ];

    commands.forEach(function (command, index) {
        var answer = answers[index];
        it('SCommand-Nr ' + (index + 1) + ': ensures command ' + JSON.stringify(command) + ' receives the desired answer ' + JSON.stringify(answer), function (done) {
            this.timeout(waitingTimeBetween + 2000);
            setTimeout(function () {
                var uri = '/actions/sendCommand';
                req.post(rootUrl + uri,
                    {
                        body: command
                    },
                    function (err, res, body) {
                        // wait a little to GET the properties
                        setTimeout(function () {
                            req.get(rootUrl + '/properties', function (err, res, properties) {
                                expect(err).to.be.null;
                                expect(res.statusCode).to.equal(status.OK);

                                expect(properties).to.be.a('array');
                                expect(properties).to.have.length.above(0);
                                var mostRecentProperties = properties.pop().values;
                                expect(mostRecentProperties['lastResponse']).to.be.a('string');
                                expect(JSON.stringify(JSON.parse(mostRecentProperties['lastResponse']))).to.equal(JSON.stringify(answer));

                                done();
                            });
                        }, waitingTimeToGET);
                    });
            }, waitingTimeBetween);
        });
    });

});