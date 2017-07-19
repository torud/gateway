/**
 * JavaScript code Application-Website Kueng Sauna on the WoT-Gateway
 * 
 * @author: Thierry Durot, thierry.durot@ntb.ch
 * @author: Joël Lutz, joel.lutz@ntb.ch
 */

// -------------------------- global variables --------------------------
var td = top.document;
var selectedCommandIndex = -1;
var saunaOn = false;
var serverLocation = window.location;
var postActionStatus = 204;
var wsURL = '';
var webSocket;
var inputFields = [];

var tarTemp;
var tarHum;
var tarDur;

// -------------------------- predefined sauna commands --------------------------
var stopSauna = { "cmd": { "id": 1 } };
var readCurrTemp = { "par": { "rw": 0, "id": 2 } };
var readCurrHum = { "par": { "rw": 0, "id": 3 } };
var readCurrDur = { "par": { "rw": 0, "id": 4 } };
var readLight = { "par": { "rw": 0, "id": 5 } };

// -------------------------- sauna commands --------------------------
// choose type of sauna
$('#chooseBtn').on('click', function () {
      getSelectedOption();
});

$('#selectBtn').on('change', function () {
      getSelectedOption();
});

// sends the command to start/stop the sauna
$('#switchSauna').on('change', function () {
      tarTemp = td.getElementById('targetTemp').value;
      tarHum = td.getElementById('targetHum').value;
      tarDur = td.getElementById('targetDur').value;
      if ((tarTemp && tarHum && tarDur) != null) {
            if (td.getElementById('switchSauna').checked) {
                  var command = '{"cmd":{"id":0,"temp":' + tarTemp + ',"hum":' + tarHum + ',"dur":' + tarDur + '}}';
            } else {
                  var command = JSON.stringify(stopSauna);
            }
            postSendCommand(command, 'start/stop sauna');
      } else {
            td.getElementById('switchSauna').checked = false;
      }
});

// actualize target values while sauna running
$('#targetTemp').on('change', function () {
      tarTemp = td.getElementById('targetTemp').value;
      var command = '{"par":{"rw":1,"id":0,"val":' + tarTemp + '}}';
      postSendCommand(command, 'start/stop sauna on change temp');
});

$('#targetHum').on('change', function () {
      tarHum = td.getElementById('targetHum').value;
      var command = '{"par":{"rw":1,"id":1,"val":' + tarHum + '}}';
      postSendCommand(command, 'start/stop sauna on change hum');
});

$('#targetDur').on('change', function () {
      tarDur = td.getElementById('targetDur').value;
      var command = '{"par":{"rw":1,"id":4,"val":' + tarDur + '}}';
      postSendCommand(command, 'start/stop sauna on change dur');
});

// change light over slider
$('#levelLight').on('change', function () {
      var levLight = td.getElementById('levelLight').value;
      var command = '{"par":{"rw":1,"id":5,"val":' + levLight + '}}';
      postSendCommand(command, 'change light');
});


// -------------------------- properties (with WebSockets) --------------------------
$(document).ready(function () {
      var request = new XMLHttpRequest();
      request.open("GET", '/properties/sauna', true);
      request.setRequestHeader("Accept", "application/json; charset=utf-8");
      request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                  properties = JSON.parse(request.responseText)[0];
                  //updateProperties(properties);
            }
      }
      request.send(null);
}); // document ready

wsURL = 'wss://' + serverLocation.host + '/properties/sauna';
webSocket = new WebSocket(wsURL);

webSocket.onmessage = function (event) {
      var result = JSON.parse(event.data);
      displayVal(result);
}

webSocket.onerror = function (error) {
      console.error('WebSocket error!');
      console.error(error);
      $('#answerStatus').html('WoT-Gateway-Server ist offline! Neustart des Sauna-Gateways erforderlich!');
}


// -------------------------- help functions --------------------------
/**
 * Sends a HTTP-POST to /actions/sendCommand if the command isn't undefined.
 * Displays a message with the specified name.
 * Runs the callback (if defined) with success = true if the desired answer from the WoT-Gateway (204)
 * is received, along with the request object.
 * @param {*} command   The command to send as a string
 * @param {*} name      The name of the command to display in answerStatus
 * @param {*} callback  If defined: Gets called after an answer is received
 */
function postSendCommand(command, name, callback) {
      var request = new XMLHttpRequest();
      request.open("POST", '/actions/sendCommand');
      request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                  if (callback) callback(request.status === postActionStatus, request);
                  if (request.status === postActionStatus) {
                        //$('#answerStatus').html(name + ' erfolgreich gesendet\n');
                  } else {
                        console.log(request);
                        //$('#answerStatus').html(name + ' fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
                  }
            }
      }
      if (command) {
            request.send(command);
      }
} // postSendCommand


/**
 * Displays the values from the webSocket
 * @param {*} properties    the most recent properties
 */
function displayVal(properties) {
      var temp = properties.currTemp;
      var hum = properties.currHum;
      var dur = properties.duration;
      var isOnline = properties.isOnline;
      console.log(temp);
      console.log(hum);
      console.log(dur);
      console.log(isOnline);
      td.getElementById('currTemp').value = temp;
      td.getElementById('currHum').value = hum;
      td.getElementById('currDur').value = dur;
      if (isOnline == true) {
            console.log('online')
            td.getElementById('isOnline').value = 'Online';
            td.getElementById('isOnline').style.color = '#00d300';
      } else {
            console.log('offline')
            td.getElementById('isOnline').value = 'Offline';
            td.getElementById('isOnline').style.color = '#ff0000';
      }
}

/**
 *
 */
function getSelectedOption() {
      var defTemp;
      var defHum;
      var defDur;
      var selectedOption = td.getElementById('selectBtn').value;
      switch (selectedOption) {
            case 'finarium':
                  defTemp = 90;
                  defHum = 15;
                  defDur = 30;
                  break;
            case 'dampfbad':
                  defTemp = 50;
                  defHum = 50;
                  defDur = 30;
                  break;
            case 'warmluftbad':
                  defTemp = 45;
                  defHum = 15;
                  defDur = 30;
                  break;
      }
      td.getElementById('targetTemp').value = defTemp;
      td.getElementById('targetHum').value = defHum;
      td.getElementById('targetDur').value = defDur;
}