var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
require('dotenv').config();

pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express();

app.get('/createRoot', function (req, res) {
    
    var query = require('url').parse(req.url, true).query;
    var customer = query.customer;
    
    var commonName = customer;

    if (!fs.existsSync('./keys/root')) {
        fs.mkdirSync('./keys/root/');
    }

    if (!fs.existsSync('./keys/root/' + customer)) {
        fs.mkdirSync('./keys/root/' + customer);
    }

    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        'x509_extensions = v3_ca',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'basicConstraints = critical, CA:true'
    ].join('\n');

    certOptions.selfSigned = true;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            fs.writeFile("./keys/root/" + customer + "/_cert.pem", cert.certificate);
            fs.writeFile("./keys/root/" + customer + "/_key.pem", cert.clientKey);
            fs.writeFile("./keys/root/" + customer + "/_fullchain.pem", cert.certificate);

        });
    console.log(csr);
    res.send('generated root certificate')
});


app.get('/createIntermediary', function (req, res) {
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };

    var query = require('url').parse(req.url, true).query;
    var customer = query.customer;

    console.log("Generate Intermediary Cert for Customer: " + customer);

    var commonName = customer;

    if (!fs.existsSync('./keys/intermediary')) {
        fs.mkdirSync('./keys/intermediary');
    }

        if (!fs.existsSync('./keys/intermediary/' + customer)) {
        fs.mkdirSync('./keys/intermediary/' + customer);
    }

    parentCert = fs.readFileSync('./keys/root/' + customer + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + customer + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + customer + '/_fullchain.pem').toString('ascii');

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        'x509_extensions = v3_ca',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'basicConstraints = critical, CA:true'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            console.log(err);
            console.log(cert);
            fs.writeFile('./keys/intermediary/' + customer + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/intermediary/' + customer + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/intermediary/' + customer + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });


    // Invoke the next step here however you like


    res.send('generated intermediary certificate')
});

app.get('/createLeaf', function (req, res) {

    var query = require('url').parse(req.url, true).query;
    var customer = query.customer;
    var deviceId = query.deviceId;

    console.log("Generate Leaf Cert for Customer: " + customer + " Device: " + deviceId);

    if (!fs.existsSync('./keys/leaf')) {
        fs.mkdirSync('./keys/leaf');
    }

    if (!fs.existsSync('./keys/leaf/' + customer)) {
        fs.mkdirSync('./keys/leaf/' + customer);
    }

    if (!fs.existsSync('./keys/leaf/' + customer + '/' + deviceId)) {
        fs.mkdirSync('./keys/leaf/' + customer + '/' + deviceId);
    }

    var commonName = deviceId;

    parentCert = fs.readFileSync('./keys/intermediary/' + customer + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/intermediary/' + customer + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/intermediary/' + customer + '/_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'extendedKeyUsage = critical,clientAuth'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            console.log(err);
            console.log(cert);
            fs.writeFile('./keys/leaf/' + customer +'/' + deviceId + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/leaf/' + customer +'/' + deviceId + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/leaf/' + customer +'/' + deviceId + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });
    res.send('generated leaf certificate')

    // Invoke the next step here however you like
});

app.get('/verify', function (req, res) {

    var query = require('url').parse(req.url,true).query;

    var customer = query.customer;
    var challenge = query.challenge;

    if (!fs.existsSync('./keys/verify/')) {
        fs.mkdirSync('./keys/verify/');
    }

    if (!fs.existsSync('./keys/verify/' + customer)) {
        fs.mkdirSync('./keys/verify/' + customer);
    }

    var commonName = challenge;
    parentCert = fs.readFileSync('./keys/root/' + customer + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + customer + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + customer + '/_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = ' + commonName,
        '[v3_req]',
        'extendedKeyUsage = critical,clientAuth'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;

    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            console.log(err);
            console.log(cert);
            fs.writeFile('./keys/verify/' + customer + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/verify/' + customer + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/verify/' + customer + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });
    res.send('generated verifcation certificate')

    // Invoke the next step here however you like
});

app.get('/createGroup', function (req, res) {

    var query = require('url').parse(req.url,true).query;

    var certiftype = query.certiftype;
    var groupname = query.groupname;
    var customer = query.customer;

    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;

    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);

    var enrollment = {
        enrollmentGroupId: groupname,
        attestation: {
            type: 'x509',
            x509: {
                signingCertificates: {
                    primary: {
                        certificate: fs.readFileSync('./keys/'+certiftype+'/'+customer+'/' + '_cert.pem', 'utf-8').toString()
                    }
                }
            }
        },
        provisioningStatus: 'disabled'
    };

    serviceClient.createOrUpdateEnrollmentGroup(enrollment, function (err, enrollmentResponse) {
        if (err) {
            console.log('error creating the group enrollment: ' + err);
        } else {
            console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
            enrollmentResponse.provisioningStatus = 'enabled';
            serviceClient.createOrUpdateEnrollmentGroup(enrollmentResponse, function (err, enrollmentResponse) {
                if (err) {
                    console.log('error updating the group enrollment: ' + err);
                } else {
                    console.log("updated enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
                }
            });
        }
    });
    res.send('generated group enrolment');
});



app.get('/createDevice', function (req, res) {

    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
 
    var query = require('url').parse(req.url,true).query;

    var customer = query.customer;
    var registrationId = query.deviceId;
    // var connectionString = query.connectionString;
    var connectionString = 'HostName=SaschacIoTTestProvisioning.azure-devices-provisioning.net;SharedAccessKeyName=provisioningserviceowner;SharedAccessKey=SDOxMMGc/KHKEIuiilr3A0o5YFexJto6JMd1OZE5zbs='
    
    var serviceClient = provisioningServiceClient.fromConnectionString(connectionString);
    
    var deviceCert = fs.readFileSync('./keys/leaf/' + customer + '/' + registrationId + '/_cert.pem').toString();
    
    var enrollment = {
      registrationId: registrationId,
      deviceID: registrationId,
      attestation: {
        type: 'x509',
        x509: {
          clientCertificates: {
            primary: {
              certificate: deviceCert
            }
          }
        }
      }
    };
    
    serviceClient.createOrUpdateIndividualEnrollment(enrollment, function (err, enrollmentResponse) {
      if (err) {
        console.log('error creating the individual enrollment: ' + err);
      } else {
        console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
      }
    });
    res.send('generated device enrolment for: ' + registrationId);
});


app.get('/joinGroup', function (req, res) {
    var Transport = require('azure-iot-provisioning-device-http').Http;

    // Feel free to change the preceding using statement to anyone of the following if you would like to try another protocol.
    //var Transport = require('azure-iot-provisioning-device-amqp').Amqp;
    // var Transport = require('azure-iot-provisioning-device-amqp').AmqpWs;
    // var Transport = require('azure-iot-provisioning-device-mqtt').Mqtt;
    // var Transport = require('azure-iot-provisioning-device-mqtt').MqttWs;

    var X509Security = require('azure-iot-security-x509').X509Security;
    var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;

    var provisioningHost = 'global.azure-devices-provisioning.net';

    var query = require('url').parse(req.url,true).query;

    var idScope = query.idscope;
    var customer = query.customer;
    var registrationId = query.deviceId;

    // var idScope = process.env.ID_SCOPE;
    // var registrationId = req.query.deviceId;
    
    var deviceCert = {
        cert: fs.readFileSync('./keys/leaf/' + customer + '/' + registrationId + '/_fullchain.pem').toString(),
        key: fs.readFileSync('./keys/leaf/' + customer + '/' + registrationId  + '/_key.pem').toString()
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
            console.log('assigned hub=' + result.assignedHub );
            console.log('deviceId=' + result.deviceId);
        }
    });
    res.send('device registered in IoT Hub');
});


http.createServer(app).listen(8000)
