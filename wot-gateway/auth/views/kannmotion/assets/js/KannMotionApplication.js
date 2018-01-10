/**
 * JavaScript code Application-Website KannMotion on the WoT-Gateway
 *
 * @author: Thierry Durot, thierry.durot@adlos.com
 */ // -------------------------- global variables -------------------------- 
var td = top.document; var sequenceCommands = []; // Array for sequence commands (JSON)
var sequenceButtons = []; // Array for sequence commands (radio buttons)
var i = 0; // position in sequenceCommands and sequenceButtons
var buttonIndex = 0;
var selectedCommandIndex = -1;
var sequenceCommandSelected = false;
var serverLocation = window.location;
var postActionStatus = 204;
var wsURL = '';
var webSocket;
var inputFields = [];

// -------------------------- predefined motor commands --------------------------
var configKM17_11H2045X4_095_001 = [{ "par": { "cmd": 1, "id": 0, "val": 10000 } },
				    { "par": { "cmd": 1, "id": 1, "val": 295000 } },
				    { "par": { "cmd": 1, "id": 2, "val": 295000 } },
				    { "par": { "cmd": 1, "id": 3, "val": 750000 } },
				    { "par": { "cmd": 1, "id": 4, "val": 32 } },
				    { "par": { "cmd": 1, "id": 5, "val": 50 } },
				    { "par": { "cmd": 1, "id": 6, "val": 25000 } },
				    { "par": { "cmd": 1, "id": 7, "val": 0 } }];

var configKM17_24H2085_200_4A = [{ "par": { "cmd": 1, "id": 0, "val": 20000} },
				 { "par": { "cmd": 1, "id": 1, "val": 200000 } },
				 { "par": { "cmd": 1, "id": 2, "val": 200000 } },
				 { "par": { "cmd": 1, "id": 3, "val": 290000 } },
				 { "par": { "cmd": 1, "id": 4, "val": 40 } },
				 { "par": { "cmd": 1, "id":5, "val": 70 } },
				 { "par": { "cmd": 1, "id": 6, "val": 18000 } },
				 { "par": { "cmd": 1, "id": 7, "val": 0 }}];

var configKM24_11H2045X4_095_001 = [{ "par": { "cmd": 1, "id": 0, "val": 10000 } },
				    { "par": { "cmd": 1,"id": 1, "val": 295000 } },
				    { "par": { "cmd": 1, "id": 2, "val": 295000 } },
				    { "par": { "cmd": 1, "id": 3,"val": 750000 } },
				    { "par": { "cmd": 1, "id": 4, "val": 32 } },
				    { "par": { "cmd": 1, "id": 5, "val": 50 } },
				    { "par": { "cmd": 1, "id": 6, "val": 25000 } }];

var configKM24_24H2085_200_4A = [{ "par": { "cmd": 1, "id": 0,"val": 2500 } },
				 { "par": { "cmd": 1, "id": 1, "val": 10000 } },
				 { "par": { "cmd": 1, "id": 2, "val": 10000 } },
				 { "par": { "cmd": 1, "id": 3, "val": 152000 } },
				 { "par": { "cmd": 1, "id": 4, "val": 162 } },
				 { "par": { "cmd": 1, "id": 5, "val": 389 } },
				 { "par": { "cmd": 1, "id": 6, "val": 45000 } }];

var resetCommand = { "sys": 1 };
var infoCommand = [{ "sys": 2 }, { "par": { "cmd": 2 } }];

var vorSchnell =  [{ "rom": { "frm": [1, 1], "val": "{r:[0,90,0,0]}" } }, { "sys": 1 }];
var vorLangsam =  [{ "rom": { "frm": [1, 1], "val": "{r:[0,30,0,0]}" } }, { "sys": 1 }];
var ruckSchnell = [{ "rom": { "frm": [1, 1], "val": "{r:[0,-90,0,0]}" } }, { "sys": 1 }];
var ruckLangsam = [{ "rom": { "frm": [1, 1], "val": "{r:[0,-30,0,0]}" }}, { "sys": 1 }];

var vorRuck = [{ "rom": { "frm": [1, 1], "val": "{r:[0,60,0,0],wt:3000,r:[0,-60,0,0],wt:3000}" } }, { "sys": 1 }];

var stop = [{ "rom": { "frm": [1, 1], "val": " " } }, { "sys": 1 }];

// -------------------------- motorconfiguration -------------------------- 
// sends the command to config the motor either Kann Motion 17 or 24
$("#buttonConfig").on("click", function () {
    var command;
    var selectedOption = td.getElementById('configOptions').options[document.getElementById('configOptions').selectedIndex].value;
    switch (selectedOption) {
        case 'c17_11H':
            command = JSON.stringify(configKM17_11H2045X4_095_001);
            break;
        case 'c17_24H':
            command = JSON.stringify(configKM17_24H2085_200_4A);
            break;
        case 'c24_11H':
            command = JSON.stringify(configKM24_11H2045X4_095_001);
            break;
        case 'c24_24H':
            command = JSON.stringify(configKM24_24H2085_200_4A);
            break;
    }
    console.log("config command: ", command);
    postSendCommand(command, 'Konfiguration');
});
// -------------------------- motor commands -------------------------- 
// Starts Motor: Vorwärts, schnell
$("#buttonVorSchnell").on("click", function () {
    var command = JSON.stringify(vorSchnell);
    postSendCommand(command, 'Vorwarts-Schnell-Befehl');
});

// Starts Motor: Vorwärts, langsam
$("#buttonVorLangsam").on("click", function () {
    var command = JSON.stringify(vorLangsam);
    postSendCommand(command, 'Vorwarts-Langsam-Befehl');
});

// Starts Motor: Rückwärts, schnell
$("#buttonRuckSchnell").on("click", function () {
    var command = JSON.stringify(ruckSchnell);
    postSendCommand(command, 'Ruckwarts-Schnell-Befehl');
});

// Starts Motor: Rückwärts, langsam
$("#buttonRuckLangsam").on("click", function () {
    var command = JSON.stringify(ruckLangsam);
    postSendCommand(command, 'Ruckwarts-Langsam-Befehl');
});

// Starts Motor: Vorwärts 3s, Rückwärts 3s
$("#buttonVorRuck").on("click", function () {
    var command = JSON.stringify(vorRuck);
    postSendCommand(command, 'Vorwärts-Rückwärts-Befehl');
});

// Stops Motor
$("#buttonStop").on("click", function () {
    var command = JSON.stringify(stop);
    postSendCommand(command, 'Ruckwarts-Langsam-Befehl');
});

// -------------------------- help functions -------------------------- 
/**
 * Sends a HTTP-POST to /actions/sendCommand if the command isn't undefined.
 * Displays a message with the specified name.
 * Runs the callback (if defined) with success = true if the desired answer from the WoT-Gateway (204)
 * is received, along with the request object.
 * @param {*} command The command to send as a string
 * @param {*} name The name of the command to display in answerStatus
 * @param {*} callback If defined: Gets called after an answer is received
 */
    function postSendCommand(command, name, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (callback) callback(request.status === postActionStatus, request);
            if (request.status === postActionStatus) {
                $('#answerStatus').html(name + ' erfolgreich gesendet\n');
            } else {
                console.log(request);
                $('#answerStatus').html(name + ' fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
            }
        }
    }
    if (command) {
	console.log("postSendCommand: ", command);
        request.send(command);
       // logCommand(command);
    }
} // postSendCommand
