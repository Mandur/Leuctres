var Transport = require('azure-iot-provisioning-device-http').Http;
var fs = require('fs');
require('dotenv').config();


console.log(process.argv[2]);
var registrationId = process.argv[2];
var X509Security = require('azure-iot-security-x509').X509Security;

console.log(process.env.ID_SCOPE);
var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;

var provisioningHost = 'global.azure-devices-provisioning.net';
var idScope = process.env.ID_SCOPE;
var deviceCert = {
    cert: fs.readFileSync('../server/keys/leaf/' + registrationId + '/_cert.pem').toString(),
    key: fs.readFileSync('../server/keys/leaf/' + registrationId + '/_key.pem').toString()
};

var transport = new Transport();
var securityClient = new X509Security(registrationId, deviceCert);
var deviceClient = ProvisioningDeviceClient.create(provisioningHost, idScope, transport, securityClient);

// Register the device.  Do not force a re-registration.
deviceClient.register(function (err, result) {
    if (err) {
        console.log("error registering device: " + err);
    } else {
        console.log('registration succeeded');
        console.log('assigned hub=' + result.assignedHub);
        console.log('deviceId=' + result.deviceId);
    }
});
