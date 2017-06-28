var expect = require('chai').expect,
    request = require('request'),
    status = require('http-status'),
    util = require('util'),
    WebSocketClient = require('websocket').client;
var token = 'fRfLNLe9aBix0mHyeCdI0PSzNeLpPPgu';

var waitingTimeBetween = 200;
var waitShort = 400;
var waitLong = 1500;
var waitingTimeToGET = waitShort;

describe('MCommands:', function () {
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
        { "par": { "cmd": 1, "id": 0, "val": 2500 } },
        { "par": { "cmd": 1, "id": 1, "val": 10000 } },
        { "par": { "cmd": 1, "id": 2, "val": 10000 } },
        { "par": { "cmd": 1, "id": 3, "val": 152000 } },
        { "par": { "cmd": 1, "id": 4, "val": 162 } },
        { "par": { "cmd": 1, "id": 5, "val": 389 } },
        { "par": { "cmd": 1, "id": 6, "val": 45000 } },
        { "par": { "cmd": 1, "id": 7, "val": 0 } },
        // read property commands
        { "par": { "cmd": 0, "id": 0 } },
        { "par": { "cmd": 0, "id": 1 } },
        { "par": { "cmd": 0, "id": 2 } },
        { "par": { "cmd": 0, "id": 3 } },
        { "par": { "cmd": 0, "id": 4 } },
        { "par": { "cmd": 0, "id": 5 } },
        { "par": { "cmd": 0, "id": 6 } },
        { "par": { "cmd": 0, "id": 7 } },
        // sys:2
        { "sys": 2 },
        // par cmd 0
        { "par": { "cmd": 0 } },
        // par cmd 2
        { "par": { "cmd": 2 } },
        // commands
        { "rom": { "frm": [1, 1], "val": "{g:[900,0],r:[0,30,0,0],wt:3000}" } },
        { "sys": 1 },
        { "rom": { "frm": [1, 1], "val": " " } },
        { "sys": 1 }
    ];

    var answers = [
        // write property answers
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        { "com": { "id": "state", "val": "ACK" } },
        // read property answers
        { "par": { "id": 0, "cmd": 0, "val": 2500 } },
        { "par": { "id": 1, "cmd": 0, "val": 10000 } },
        { "par": { "id": 2, "cmd": 0, "val": 10000 } },
        { "par": { "id": 3, "cmd": 0, "val": 152000 } },
        { "par": { "id": 4, "cmd": 0, "val": 162 } },
        { "par": { "id": 5, "cmd": 0, "val": 389 } },
        { "par": { "id": 6, "cmd": 0, "val": 45000 } },
        { "par": { "id": 7, "cmd": 0, "val": 0 } },
        // answer to sys:2
        {
            "info": [
                { "id": "Position", "val": "2553" },
                { "id": "Error Number", "val": "0x00000000" },
                { "id": "Error Counter", "val": "0" },
                { "id": "Prod. Version", "val": "24.1" },
                { "id": "FW Version", "val": "0.3" },
                { "id": "Seq. Version", "val": "0.0" }
            ]
        },
        // answer to par cmd 0
        { "par": { "id": -1, "cmd": 0, "val": 65537 } },
        // answer to par cmd 2
        { "par": { "id": 7, "cmd": 0, "val": 0 } },
        // answers to commands
        { "rom": { "frm": [1, 1], "val": "{g:[900,0],r:[0,30,0,0],wt:3000}" } },
        'SEQUENCE LENGTH 13',
        { "rom": { "frm": [1, 1], "val": " " } },
        'SEQUENCE LENGTH 0'
    ];

    if (commands.length != answers.length) {
        console.error('commands array is not as long as answers array!');
    }

    commands.forEach(function (command, index) {
        var answer = answers[index];
        it('MCommand-Nr ' + (index + 1) + ': ensures command ' + JSON.stringify(command) + ' receives the desired answer ' + JSON.stringify(answer), function (done) {
            if (command.sys && command.sys == 1) {
                waitingTimeToGET = waitLong;
            } else {
                waitingTimeToGET = waitShort;
            }
            this.timeout(waitingTimeBetween + waitingTimeToGET + 2000);
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
                                expect(properties).to.be.of.length(1);
                                var mostRecentProperties = properties.pop().values;
                                // console.log(mostRecentProperties);
                                expect(mostRecentProperties['lastResponse']).to.be.a('string');
                                expect(mostRecentProperties['timestamp']).to.be.a('string');
                                if (answer.com && answer.com.val == 'ACK') {
                                    // ACK expected
                                    expect(mostRecentProperties['lastACK']).to.equal('ACK');
                                } else if (answer.info) {
                                    // info answer expected
                                    var info = JSON.parse(mostRecentProperties['lastResponse']);
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
                                } else if (command.sys && command.sys == 1) {
                                    // SEQENCE LENGTH answer expected
                                    expect(mostRecentProperties['lastResponse']).to.equal(answer);
                                } else {
                                    // some other answer expected
                                    expect(mostRecentProperties['lastResponse']).to.equal(JSON.stringify(answer));
                                }
                                done();
                            });
                        }, waitingTimeToGET);
                    });
            }, waitingTimeBetween);
        });
    });




});