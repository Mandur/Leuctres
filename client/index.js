//first argument IoT hub of form xxx.azure-devices.net.
//second argument IoT device name.
//third argument folder where leaf certificate are stored (assuming name of _cert.pem for certificate and _key.pem for private key) eg. ../nodecert/keys/leaf/testdevice/

// e.g. node index.js secondthing.azure-devices.net testdevice leafKeys/



'use strict';
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var connectionString = require('azure-iot-device').ConnectionString.createWithX509Certificate(process.argv[2],process.argv[3]);
var client = clientFromConnectionString(connectionString);
var fs = require('fs');

console.log(process.argv[2]);

var certFile = process.argv[4]+'_cert.pem';
var keyFile = process.argv[4]+'_key.pem';
var passphrase = '';

console.log(client);
var Message = require('azure-iot-device').Message;


var options = {
    cert : fs.readFileSync(certFile, 'utf-8').toString(),
    key : fs.readFileSync(keyFile, 'utf-8').toString(),
    passphrase: passphrase
 };

function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }

  var connectCallback = function (err) {
    if (err) {
      console.log('Could not connect: ' + err);
    } else {
      console.log('Client connected');
  
      // Create a message and send it to the IoT Hub every second
      setInterval(function(){
          var temperature = 20 + (Math.random() * 15);
          var humidity = 60 + (Math.random() * 20);            
          var data = JSON.stringify({ deviceId: process.argv[3], temperature: temperature, humidity: humidity });
          var message = new Message(data);
          message.properties.add('temperatureAlert', (temperature > 30) ? 'true' : 'false');
          console.log("Sending message: " + message.getData());
          client.sendEvent(message, printResultFor('send'));
      }, 1000);
    }
  };
  client.setOptions(options);

  client.open(connectCallback);
