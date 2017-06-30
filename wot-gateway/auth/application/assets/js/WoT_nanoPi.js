/**
 * Javascript Code für Website KannMotion WoT-Gateway
 */

var td = top.document;
var comArray = new Array;       // Array for sequence
var i = 0;                      // position in comArray
var logMessage;
var logArray = new Array('Log');       // Array for logs
var logString;
var j = 0;                      // position in logArray
var answArray = new Array;      // Array with answers

// ------------------------------------------ MOTOR ------------------------------------------
var configKM17 = [{}];

var configKM24 = [{ "par": { "cmd": 1, "id": 0, "val": 2500 } },
{ "par": { "cmd": 1, "id": 1, "val": 10000 } },
{ "par": { "cmd": 1, "id": 2, "val": 10000 } },
{ "par": { "cmd": 1, "id": 3, "val": 152000 } },
{ "par": { "cmd": 1, "id": 4, "val": 162 } },
{ "par": { "cmd": 1, "id": 5, "val": 389 } },
{ "par": { "cmd": 1, "id": 6, "val": 45000 } }];


// sends the command to config the motor either Kann Motion 17 or 24
$("#buttonConfig").on("click", function () {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    $('#textArea').html('');
    var command;
    if (td.getElementById('mArt').options[document.getElementById('mArt').selectedIndex].value == 'c17') {
        command = JSON.stringify(configKM24);
    } else if (td.getElementById('mArt').options[document.getElementById('mArt').selectedIndex].value == 'c24') {
        command = JSON.stringify(configKM24);
    }
    $('#actualConfigCommand').html(command);

    request.onreadystatechange = function () {
        console.log('CONFIG status: ' + request.status);
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            $('#communicationCommand').html('config sendt\n');
        } else if (request.readyState === XMLHttpRequest.DONE && request.status != 200) {
            $('#communicationCommand').html('configuration failed: ' + request.status + ' ' + request.statusText);
        }
    }
    request.send(command);
});

// adds a command to your sequence and displays it in curSeq
$("#buttonAddSeq").on("click", function () {
    var actVal = td.getElementById('valueSeq').value;
    var comSeq;
    if ($('#seqCom :selected').val() == 's1') {  // GEHE ZU POSITION
        comSeq = 'g:[' + actVal + ',0]';
    } else if ($('#seqCom :selected').val() == 's4') {    // DREHEN
        comSeq = 'r:[0,' + actVal + ',0,0]';
    } else if ($('#seqCom :selected').val() == 's12') {    // WARTE
        comSeq = 'wt:' + actVal;
    }
    comArray[i] = comSeq;
    i++;
    $('#curSeq').html(comArray.join(', '));
});

// sends a whole sequence to the motor
$("#buttonSendSeq").on("click", function () {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var command;
    var comSeq;
    if ((document.getElementById('curSeq').innerHTML === "") != true) {
        command = '{"rom":{"frm":[1,1],"val":"{' + comArray.toString() + '}"}}';
        comArray[i] = ' - GESENDET';
        $('#curSeq').html(comArray.join(', '));
        comArray = [];
        i = 0;
    } else if ((document.getElementById('wholeComSeq').innerHTML === "") != true) {
        command = td.getElementById('wholeComSeq').value;
    } else {
        $('#AnswerReceived pre').html('No sequence existing');
    }
    request.onreadystatechange = function () {
        console.log('SENDSEQ status: ' + request.status);
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            $('#CommandSent pre').html(command);
            $('#communicationCommand').html('sequence sendt\n');
        } else if (request.readyState === XMLHttpRequest.DONE && request.status != 200) {
            $('#communicationCommand').html('sending sequence failed: ' + request.status + ' ' + request.statusText);
        }
    }
    request.send(command);
});

// send the command to delete the current sequence on the motor
$("#buttonDelSeq").on("click", function () {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var command = '[{"rom":{"frm":[1,1],"val":" "}},\n'
        + '{"sys":1}]\n';
    request.onreadystatechange = function () {
        console.log('DELSEQ status: ' + request.status);
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            $('#communicationCommand').html('current sequence deleted\n');
        } else if (request.readyState === XMLHttpRequest.DONE && request.status != 200) {
            $('#communicationCommand').html('deleting current sequence failed: ' + request.status + ' ' + request.statusText);
        }
    }
    console.log('Command: ' + command);
    request.send(command);
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonReset").on("click", function () {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var command = '{"sys":1}\n';
    request.onreadystatechange = function () {
        console.log('RESET status: ' + request.status);
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            console.log('current sequence started\n');
            //console.log(request.responseURL);
            //logCommand('current sequence started\n');
        } else if (request.readyState === XMLHttpRequest.DONE && request.status != 200) {
            console.log('starting current sequence failed: ' + request.status + ' ' + request.statusText);
            //console.log(request.responseURL);
            //logCommand('starting current sequence failed: ' + request.status + ' ' + request.statusText);
        }
    }
    request.send(command);
});

//log commands in Logging html
// function logCommand(mes) {
//     logMessage = mes;
//     console.log('logMessage: ' + logMessage);
//     var logArrayString = sessionStorage.getItem('logArray');
//     console.log('logArrayString: ' + logArrayString);
//     logArray.length = 0;
//     logArray.push(logArrayString);
//     console.log('logArray: ' + logArray);
//     logArray.push(logMessage);
//     for (a = 0; a <= logArray.length; a++) {
//         console.log("logArray ausgeben: " + logArray[a]);
//     }
//     sessionStorage.setItem('logArray', JSON.stringify(logArray));
//     if (logArray.length > 10) {
//         logArray.shift();
//     }

//     $('#communicationCommand').html(logArray.join(', '));
// }

// function logCommand(mes) {
//     logMessage = mes;
//     console.log('logMessage: ' + logMessage);
//     logArray = sessionStorage.getObject('logArray');
//     logArray.push(logMessage);
//     console.log('logArray: ' + logArray);
//     for (a = 0; a <= logArray.length; a++) {
//         console.log("logArray ausgeben: " + logArray[a]);
//     }
//     sessionStorage.setObject('logArray', logArray);
//     if (logArray.length > 10) {
//         logArray.shift();
//     }

//     $('#communicationCommand').html(logArray.join(', '));
// }

// function logCommand(mes) {
//     logMessage = mes;
//     console.log(logMessage);
//     logString = sessionStorage.getItem('logString');
//     console.log('logArray: ' + logString);
//     logString = logString + ', ' + logMessage;
//     console.log('logArray: ' + logString);
//     sessionStorage.setItem('logString', logString);
//     $('#communicationCommand').html(logString);
// }