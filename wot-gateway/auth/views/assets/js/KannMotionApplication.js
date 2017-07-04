/**
 * Javascript Code für Application-Website KannMotion auf dem WoT-Gateway
 * 
 * @author: Thierry Durot, thierry.durot@ntb.ch
 * @author: Joël Lutz, joel.lutz@ntb.ch
 */

var td = top.document;
var sequenceCommands = [];      // Array for sequence commands (JSON)
var sequenceButtons = [];       // Array for sequence commands (radio buttons)
var i = 0;                      // position in sequenceCommands and sequenceButtons
var buttonIndex = 0;
var selectedCommandIndex = -1;
var sequenceCommandSelected = false;
var serverLocation = window.location;
var postActionStatus = 204;
var wsURL = '';
var webSocket;

// ------------------------------------------ MOTOR ------------------------------------------
var configKM17 = [{}];

var configKM24 = [{ "par": { "cmd": 1, "id": 0, "val": 2500 } },
{ "par": { "cmd": 1, "id": 1, "val": 10000 } },
{ "par": { "cmd": 1, "id": 2, "val": 10000 } },
{ "par": { "cmd": 1, "id": 3, "val": 152000 } },
{ "par": { "cmd": 1, "id": 4, "val": 162 } },
{ "par": { "cmd": 1, "id": 5, "val": 389 } },
{ "par": { "cmd": 1, "id": 6, "val": 45000 } }];

var deleteSequence = [{ "rom": { "frm": [1, 1], "val": " " } }, { "sys": 1 }];
var resetCommand = { "sys": 1 };
var infoCommand = [{ "sys": 2 }, { "par": { "cmd": 2 } }];

/**
 * Sends a HTTP-POST to /actions/sendCommand if the command isn't undefined.
 * Runs the callback with success = true if the desired answer from the WoT-Gateway (204)
 * is received, along with the request object.
 * @param {*} command   The command to send as a string
 * @param {*} callback  Gets called after an answer is received
 */
function postSendCommand(command, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE && callback) {
            callback(request.status === postActionStatus, request);
        }
    }
    if (command) {
        request.send(command);
        logCommand(command);
    }
} // postSendCommand

// --------------------- Konfiguration ---------------------
// sends the command to config the motor either Kann Motion 17 or 24
$("#buttonConfig").on("click", function () {
    var command;
    var selectedOption = td.getElementById('configOptions').options[document.getElementById('configOptions').selectedIndex].value;
    if (selectedOption == 'c17') {
        command = JSON.stringify(configKM17);
    } else if (selectedOption == 'c24') {
        command = JSON.stringify(configKM24);
    }
    postSendCommand(command, function (success, request) {
        console.log('CONFIG status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Konfiguration erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Konfiguration fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// --------------------- Befehle ---------------------

// send the command to delete the current sequence on the motor
$("#buttonDelSeq").on("click", function () {
    var command = JSON.stringify(deleteSequence);
    postSendCommand(command, function (success, request) {
        console.log('DELSEQ status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Lösche-Sequenz-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Lösche-Sequenz-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends a command to update the infos of the KannMotion control
$("#buttonUpdateInfo").on("click", function () {
    var command = JSON.stringify(infoCommand);
    postSendCommand(command, function (success, request) {
        console.log('INFO status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Aktualisiere-Infos-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Aktualisiere-Infos-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends the JSON command in plainJSONSeq
$("#buttonSendJSONCommand").on("click", function () {
    var command;
    if (td.getElementById('plainJSONSeq')) {
        var plainJSONSeq = td.getElementById('plainJSONSeq').value;
        if (plainJSONSeq !== '') {
            command = plainJSONSeq;
        }
    }
    postSendCommand(command, function (success, request) {
        console.log('SENDJSONCOM status: ' + request.status);
        if (success) {
            $('#answerStatus').html('JSON-Befehl ' + command + ' erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('JSON-Befehl senden fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonReset").on("click", function () {
    var command = JSON.stringify(resetCommand);
    postSendCommand(command, function (success, request) {
        console.log('RESET status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Reset-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Reset-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// --------------------- Sequenzen ---------------------
// adds a command to your sequence and displays it in curSeq
$("#buttonAddSeq").on("click", function () {
    createSequenceCommand(i, buttonIndex);
    i++;
    buttonIndex++;
});

/**
 * Creates a sequenceCommand and a sequenceButton according to the chosen option in seqCom,
 * the value in valueSeq and with the specified buttonIndex. Adds it to the sequenceCommands
 * and the sequenceButtons array at the speciefied position indexInArray.
 * @param {*} indexInArray 
 * @param {*} buttonIndex 
 */
function createSequenceCommand(indexInArray, buttonIndex) {
    var commandValue = td.getElementById('valueSeq').value;
    if (commandValue != '') {
        var sequenceCommand;
        var sequenceButton = '<label><input type="radio" id="seqComm' + buttonIndex + '" name="sequence" value="' + buttonIndex + '"><i> ';
        var selectedCommand = $('#seqCom :selected').val();
        switch (selectedCommand) {
            case 's1':      // GEHE ZU POSITION
                sequenceCommand = 'g:[' + commandValue + ',0]';
                sequenceButton += 'GEHE ZU POSITION (' + commandValue + ')';
                break;
            case 's4':      // DREHEN
                sequenceCommand = 'r:[0,' + commandValue + ',0,0]';
                sequenceButton += 'DREHEN (' + commandValue + '%)';
                break;
            case 's12':     // WARTE
                sequenceCommand = 'wt:' + commandValue;
                sequenceButton += 'WARTE (' + commandValue + 'ms)';
                break;
            default:
                sequenceCommand = '';
                sequenceButton += 'NO OPTION SELECTED!'
                break;
        } // switch
        sequenceButton += '</i></label><br>';
        sequenceButtons[indexInArray] = sequenceButton;
        sequenceCommands[indexInArray] = sequenceCommand;
        updateSequenceHTML();
    }
} // createSequenceCommand

// detects which sequence command in curSeq is selected
$('#abschnGrauSeq').on('change', function () {
    var radioButtons = $("#abschnGrauSeq input:radio[name='sequence']");
    var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
    console.log('selected index: ' + selectedIndex);
    if (selectedIndex >= 0) {
        selectedCommandIndex = selectedIndex;
        sequenceCommandSelected = true;
        updateChangeButton(false);
    } else {
        selectedCommandIndex = -1;
        sequenceCommandSelected = false;
        updateChangeButton(true);
    }
});

/**
 * Disables the changeSequence button according to the parameter.
 * @param {*} disabled 
 */
function updateChangeButton(disabled) {
    $('#buttonChangeSequence').prop('disabled', disabled);
    $('#buttonRemoveSequence').prop('disabled', disabled);
} // updateChangeButton

// changes the selected sequence command according the currently chosen options and values
$("#buttonChangeSequence").on("click", function () {
    if (sequenceCommandSelected && selectedCommandIndex >= 0) {
        var selectedButtonNumber = $('input:radio[name=sequence]:checked').val();
        createSequenceCommand(selectedCommandIndex, selectedButtonNumber);
        updateChangeButton(true);
    }
});

// removes the selected sequence command in curSeq
$("#buttonRemoveSequence").on("click", function () {
    if (sequenceCommandSelected && selectedCommandIndex >= 0) {
        sequenceButtons.splice(selectedCommandIndex, 1);
        sequenceCommands.splice(selectedCommandIndex, 1);
        i--;
        updateSequenceHTML();
        selectedCommandIndex = -1;
        sequenceCommandSelected = false;
        updateChangeButton(true);
    }
});

// clears the curSeq
$("#buttonClearSequence").on("click", function () {
    clearSequenceArrays();
    updateSequenceHTML();
    updateChangeButton(true);
});

/**
 * Deletes the sequenceCommands and the sequenceButtons array
 */
function clearSequenceArrays() {
    sequenceCommands = [];
    sequenceButtons = [];
    i = 0;
    buttonIndex = 0;
} // clearSequenceArrays

/**
 * Displays the sequenceButtons array in curSeq
 */
function updateSequenceHTML() {
    $('#curSeq').html(sequenceButtons.join('\n'));
} // updateSequenceHTML

// sends a whole sequence to the motor
$("#buttonSendSeq").on("click", function () {
    var command;
    if (document.getElementById('curSeq')) {
        if (document.getElementById('curSeq').innerHTML.trim() !== '' && sequenceCommands.length > 0) {
            command = '{"rom":{"frm":[1,1],"val":"{' + sequenceCommands.toString() + '}"}}';
            sequenceButtons[i] = ' - GESENDET';
            updateSequenceHTML();
            clearSequenceArrays();
        }
    }
    postSendCommand(command, function (success, request) {
        console.log('SENDSEQ status: ' + request.status);
        if (success) {
            // $('#CommandSent pre').html(command);    // ???
            $('#answerStatus').html('Sequenz erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Sequenz senden fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonRun").on("click", function () {
    var command = JSON.stringify(resetCommand);
    postSendCommand(command, function (success, request) {
        console.log('RESET status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Ausführen-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Ausführen-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// --------------------- Logging ---------------------

/**
 * Adds a command to the command log
 * @param {*} command   the command to log
 */
function logCommand(command) {
    if (command) {
        command = '<p>' + command + '</p>';
        $(command).appendTo('#sentCommands');
        var elem = document.getElementById('sentCommands');
        elem.scrollTop = elem.scrollHeight;
    }
} // logCommand



// --------------------- Eigenschaften (mit WebSockets) ---------------------
$(document).ready(function () {
    var request = new XMLHttpRequest();
    request.open("GET", '/properties/motor', true);
    request.setRequestHeader("Accept", "application/json; charset=utf-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            properties = JSON.parse(request.responseText)[0];
            updateProperties(properties);
        }
    }
    request.send(null);
}); // document ready


wsURL = 'wss://' + serverLocation.host + '/properties/motor';
webSocket = new WebSocket(wsURL);

webSocket.onmessage = function (event) {
    var result = JSON.parse(event.data);
    updateProperties(result);
}

webSocket.onerror = function (error) {
    console.log('WebSocket error!');
    console.log(error);
}

/**
 * Updates the data table "properties" with the keys and values in the properties object
 * @param {*} properties    the most recent properties
 */
function updateProperties(properties) {
    var htmlString = '';
    Object.keys(properties).forEach(function (propName, index) {
        var propValue = properties[propName];
        htmlString = htmlString.concat('<dt>' + propName + '</dt><dd>' + propValue + '</dd>');
        $('#properties').html(htmlString);
    });

} // updateProperties