

var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
require('dotenv').config();

pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express();

//rootname
app.get('/createRoot', function (req, res) {
    var commonName = req.query.rootname;
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 1,
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
            fs.writeFile("./keys/root/_cert.pem", cert.certificate);
            fs.writeFile("./keys/root/_key.pem", cert.clientKey);
            fs.writeFile("./keys/root/_fullchain.pem", cert.certificate);

        });
    console.log(csr);
    res.send('generated root certificate')
});

//customer
app.get('/createIntermediary', function (req, res) {
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 1,
    };

    var query = require('url').parse(req.url, true).query;
    var customer = query.customer;

    console.log("Generate Intermediary Cert for Customer: " + customer);

    var commonName = customer;


    if (!fs.existsSync('./keys/intermediary/' + customer)) {
        fs.mkdirSync('./keys/intermediary/' + customer);
    }
    parentCert = fs.readFileSync('./keys/root/' + '_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '_fullchain.pem').toString('ascii');

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


//customer, deviceid
app.get('/createleaf', function (req, res) {

    var query = require('url').parse(req.url, true).query;
    var customer = query.customer;
    var deviceId = query.deviceid;

    console.log("Generate Leaf Cert for Customer: " + customer + " Device: " + deviceId);

    if (!fs.existsSync('./keys/leaf/' + deviceId)) {
        fs.mkdirSync('./keys/leaf/' + deviceId);
    }

    var commonName = deviceId;

    parentCert = fs.readFileSync('./keys/intermediary/' + customer + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/intermediary/' + customer + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/intermediary/' + customer + '/_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 1,
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
            fs.writeFile('./keys/leaf/' + deviceId + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/leaf/' + deviceId + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/leaf/' + deviceId + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });
    res.send('generated leaf certificate')

    // Invoke the next step here however you like
});

app.get('/verify', function (req, res) {

    var query = require('url').parse(req.url,true).query;

    var customer = query.customer;
    var challenge = query.challenge;

    if (!fs.existsSync('./keys/verif/' + customer)) {
        fs.mkdirSync('./keys/verif/' + customer);
    }

    var commonName = challenge;
    parentCert = fs.readFileSync('./keys/root/' + '_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 1,
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
            fs.writeFile('./keys/verif/' + commonName + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/verif/' + commonName + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/verif/' + commonName + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });
    res.send('generated verifcation certificate')

    // Invoke the next step here however you like
});

app.get('/createGroup', function (req, res) {

    var certiftype = req.query.certiftype;
    var groupname = req.query.groupname;
    var customername = req.query.customername;

    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;

    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);

    var enrollment = {
        enrollmentGroupId: groupname,
        attestation: {
            type: 'x509',
            x509: {
                signingCertificates: {
                    primary: {
                        certificate: fs.readFileSync('./keys/'+certiftype+'/'+customername+'/' + '_cert.pem', 'utf-8').toString()
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


//deviceid
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
    var idScope = process.env.ID_SCOPE;
    var registrationId = req.query.deviceid;
    var deviceCert = {
        cert: fs.readFileSync('./keys/leaf/'+registrationId+'/_fullchain.pem').toString(),
        key: fs.readFileSync('./keys/leaf/'+registrationId  +'/_key.pem').toString()
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
});

app.get('/clean',function(req,res){
    var path = "./keys";
   deleteFolderRecursive(path);
    fs.mkdirSync(path);
    res.send('cleaned');
});

function deleteFolderRecursive(path){
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
          var curPath = path + "/" + file;
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }

}


http.createServer(app).listen(8000)
