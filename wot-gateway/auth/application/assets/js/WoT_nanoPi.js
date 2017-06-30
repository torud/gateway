//var ip = '146.136.39.87';		// IP-Adresse NanoPi NEO
//var ip = 'wotgateway';
var ip = '192.168.2.1'; // Wifi
//var ipWiFi = 'wotgateway';
//var port = '8484';
var port = '5000';
var rootUrl = 'https://' + ip + ':' + port;
//var rootUrlWS = 'ws://' + ip + ':' + port;
var request = new XMLHttpRequest();
var td = top.document;
var comArray = new Array;       // Array for sequence
var answArray = new Array;      // Array with answers
var loggedIn = false;
var i = 0;      // position in comArray


//--------------------------------------------------MOTOR-----------------------------------------------------

/*
$(document).ready(function () {

        // Create a WebSocket subscription properties of the motor. Note that the URL uses the WebSockets protocol (ws://...)
        var socketMotor = new WebSocket(rootUrlWS + '/properties/motor');

        // Register this anonymous function to be called when a message arrives on the WebSocket
        socketMotor.onmessage = function (event) {
                var result = JSON.parse(event.data);
                $('#AnswerReceived pre').html(JSON.stringify(result));
        };

        //Register this other anonymous function to be triggered when an error occurs on the WebSocket
        socketMotor.onerror = function (error) {
                console.log('WebSocket Motor error!');
                console.log(error);
        };
        getMOTORconfig();
});
*/

// Login with password set
$("#buttonLogin").on("click", function(){
    request.open("POST", rootUrl + '/login');
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    var command;
    if((td.getElementById('pwInput').value === '') != true){
            command = 'username=Thor&password=' + td.getElementById('pwInput').value;
    } else {
            console.log("! no password !");
    }
    
    request.onreadystatechange = function(){
       if(request.readyState === XMLHttpRequest.DONE && request.status === 200){
            console.log('status 200');
            td.location.href = 'loggedin.html';
            request.getResponseHeader('Access-Control-Allow-Origin');
            //request.getResponseHeader('Set-Cookie');
            // console.log('responseText:' + request.responseText);
            console.log('ARH: ' + request.getAllResponseHeaders());
            // allCookies = document.cookie;
            // console.log('cookie: ' + allCookies);
       } else if(request.readyState === XMLHttpRequest.DONE && request.status === 401){
            console.log('status 401');
            $('#loginLogger').html('Wrong password');
       } else if (request.status === 302){
            console.log('status 302');
       }
    }
    

    console.log('Command: ' + command);
    request.send(command);
}); 


// logout
$("#buttonLogout").on("click", function(){
    request.open("GET", rootUrl + '/logout');
    request.setRequestHeader("Accept", "application/json; charset=utf-8");
    
    request.onreadystatechange = function(){
       if(request.readyState === XMLHttpRequest.DONE && request.status === 200){
            console.log('status 200');
            td.location.href = 'index.html';
       } else if(request.readyState === XMLHttpRequest.DONE && request.status === 401){
            console.log('status 401');
       } else if (request.status === 302){
            console.log('status 302');
       }
    }
    request.send();
}); 

// // gives back the current configuration of the motor and displays it in ConfigReceived
// function getMOTORconfig() {
//         request.open("GET", rootUrl + '/properties/motor', true);
//         request.setRequestHeader("Accept", "application/json; charset=utf-8");
//         request.onreadystatechange = updatePageMOTORconfig();
//         request.send(null);
// }

// function updateMOTORConfiglabel(labelText1, labelText2) {
//         $('#ConfigReceived pre').html(labelText1);
// }

// function updatePageMOTORconfig() {
//         if (request.readyState == 4) { // DONE - operation complete
//                 if (request.status == 200) { // DONE - successful request
//                         var result = JSON.parse(request.responseText);
//                         $('#ConfigReceived pre').html(JSON.stringify(result));
//                 }
//         }
// }

// sends the command to config the motor either Kann Motion 17 or 24
$("#buttonConfig").on("click", function(){
    request.open("POST", rootUrl + '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    $('#textArea').html('');
    var command;
    if (td.getElementById('mArt').options[document.getElementById('mArt').selectedIndex].value == 'c17') {
        command = 'Keine Vorgaben vorhanden';
    } else if (td.getElementById('mArt').options[document.getElementById('mArt').selectedIndex].value == 'c24') {
        command = '[{"par":{"cmd":1,"id":0,"val":2500}},\n'
                + '{"par":{"cmd":1,"id":1,"val":10000}},\n'
                + '{"par":{"cmd":1,"id":2,"val":10000}},\n'
                + '{"par":{"cmd":1,"id":3,"val":152000}},\n'
                + '{"par":{"cmd":1,"id":4,"val":162}},\n'
                + '{"par":{"cmd":1,"id":5,"val":389}},\n'
                + '{"par":{"cmd":1,"id":6,"val":45000}}]\n';
    }
    $('#actualConfigCommand').html(command);


        request.onreadystatechange = function(){
       if(request.readyState === XMLHttpRequest.DONE && request.status === 200){
            console.log('status 200');
                console.log('statusText: ' + request.statusText);
    console.log('responseText: ' + request.responseText);
       } else if(request.readyState === XMLHttpRequest.DONE && request.status === 401){
            console.log('status 401');
                console.log('statusText: ' + request.statusText);
    console.log('responseText: ' + request.responseText);
       } else if (request.status === 302){
            console.log('status 302');
                console.log('statusText: ' + request.statusText);
    console.log('responseText: ' + request.responseText);
       }
        }


    request.send(command);
    console.log(command);
});

// adds a command to your sequence and displays it in curSeq
$("#buttonAddSeq").on("click", function(){
    var actVal = td.getElementById('valueSeq').value;
        var comSeq;
        if ($('#seqCom :selected').val() == 's1') {  // GEHE ZU POSITION
            comSeq = 'g:[' + actVal + ',0]';
        } else if ($('#seqCom :selected').val() == 's4'){    // DREHEN
            comSeq = 'r:[0,' + actVal + ',0,0]';
        } else if ($('#seqCom :selected').val() == 's12'){    // WARTE
            comSeq = 'wt:' + actVal;
        }
        console.log(comSeq);
        comArray[i] = comSeq;
        i++;
        $('#curSeq').html(comArray.join(', '));
});

// sends a whole sequence to the motor
$("#buttonSendSeq").on("click", function(){
    request.open("POST", rootUrl + '/actions/sendCommand');
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
    console.log(command);
    $('#CommandSent pre').html(command);
    request.send(command);
});

// send the command to delete the current sequence on the motor
$("#buttonDelSeq").on("click", function(){
    request.open("POST", rootUrl + '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var command = '{"rom":{"frm":[1,1],"val":" "}}\n';
                + '{"sys":1}\n';
    //console.log(JSON.stringify(command));
    $('#CommandSent pre').html(command);
    request.send(command);
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonReset").on("click", function(){
    request.open("POST", rootUrl + '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var command = '{"sys":1}\n';
    //console.log(JSON.stringify(command));
    $('#CommandSent pre').html(command);
    request.send(command);
});

// sends a command to search for a device
// Nicht in verwendung
function sendCommandSearchDev() {
        request.open("POST", rootUrl + '/actions/sendCommand');
        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        var command = '{"sys":2}\n';
        //console.log(JSON.stringify(command));
        $('#CommandSent pre').html(command);
        request.send(command);
}