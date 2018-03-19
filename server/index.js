var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
require('dotenv').config();
//must point to your openSSL install
pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express();
//Create root certificate
//arg rootname = the name of your root Certificate
app.get('/createroot', function (req, res) {
    var commonName = req.query.rootname;
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
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
    res.send('generated root certificate on server side')
});

//Create Intermediary set of certificate based on the current root saved
//arg customer set the customer to which the intermediate certificate apply
app.get('/createintermediary', function (req, res) {
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
    };
    var customer = req.query.customer;
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
        'commonName = ' + customer,
        '[v3_req]',
        'basicConstraints = critical, CA:true'
    ].join('\n');
    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;
    var csr = pem.createCertificate(
        certOptions, function (err, cert) {
            fs.writeFile('./keys/intermediary/' + customer + '/_cert.pem', cert.certificate);
            fs.writeFile('./keys/intermediary/' + customer + '/_key.pem', cert.clientKey);
            fs.writeFile('./keys/intermediary/' + customer + '/_fullchain.pem', cert.certificate + '\n' + parentChain);

        });


    // Invoke the next step here however you like


    res.send('generated intermediary certificate for customer ' + customer)
});

//create a leaf certificate based on an intermediate certificate.
//arg customer intermediary certificate to use
//arg deviceid the device Id to which this certificate will be applied
//return json with pair certificate + key as leaf certificate to be put on device.
app.get('/createleaf', function (req, res) {

    var customer = req.query.customer;
    var deviceId = req.query.deviceid;

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
        days: 365000,
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
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ public: cert.certificate, key: cert.clientKey }));    

        }); 


    console.log('generated leaf certificate');
});

//create a leaf certificate based on an intermediate certificate.
//arg deviceid the device Id to which this certificate will be applied
//return json with pair certificate + key as leaf certificate to be put on device.
app.get('/createrootleaf', function (req, res) {

    var deviceId = req.query.deviceid;

    console.log("Generate Leaf Cert for + Device: " + deviceId);

    if (!fs.existsSync('./keys/leaf/' + deviceId)) {
        fs.mkdirSync('./keys/leaf/' + deviceId);
    }

    var commonName = deviceId;

    parentCert = fs.readFileSync('./keys/root/'  + '/_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '/_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '/_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
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
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ public: cert.certificate, key: cert.clientKey }));    

        }); 


    console.log('generated leaf certificate');
});

//method to verify a certificate given a challenge
//parameter challenge the challenge given by Azure
//return the public part of the generated certificate
app.get('/verify', function (req, res) {

    var query = require('url').parse(req.url, true).query;

    var challenge = query.challenge;


    var commonName = challenge;
    parentCert = fs.readFileSync('./keys/root/' + '_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 36500,
    };


    if (!fs.existsSync('./keys/verif/' + commonName)) {
        fs.mkdirSync('./keys/verif/' + commonName);
    }
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
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ challengeresult: cert.certificate }));
        });

    console.log('generated verification certificate')


    // Invoke the next step here however you like
});

//Create a group based on a certificate for group provisioning
//argument certiftype: type of the certificate, accepted value, root or intermediary
//argument groupname: name of the group
//argument customername: Name of the customer.
app.get('/creategroup', function (req, res) {

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
                        certificate: fs.readFileSync('./keys/' + certiftype + '/' + customername + '/' + '_cert.pem', 'utf-8').toString()
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


//make device join a group on Azure DPS
//configfile ID_SCOPE: the id scope of the DPS
//argument deviceid: the id (name) of your device
app.get('/joingroup', function (req, res) {
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
        cert: fs.readFileSync('./keys/leaf/' + registrationId + '/_fullchain.pem').toString(),
        key: fs.readFileSync('./keys/leaf/' + registrationId + '/_key.pem').toString()
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

//clean all stored certificates
app.get('/clean', function (req, res) {
    var path = "./keys";
    deleteFolderRecursive(path);
    fs.mkdirSync(path);
    fs.mkdirSync(path + '/root/');
    fs.mkdirSync(path + '/intermediary/');
    fs.mkdirSync(path + '/leaf/');
    fs.mkdirSync(path + '/verif/');
    res.send('cleaned');
});

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
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
//create a device. 
//argument deviceid: the id/name of the device
//argument type: value 'single' = single device, value 'group' = group device.
app.get('/createdevice', function (req, res) {
    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
    var registrationId = req.query.deviceid;
    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    if (req.query.type == 'single')
        var deviceCert = fs.readFileSync('./keys/leaf/' + registrationId + '/_cert.pem').toString();
    else
        var deviceCert = fs.readFileSync('./keys/leaf/' + registrationId + '/_fullchain.pem').toString();

    var enrollment = {
        registrationId: registrationId,
        deviceID: registrationId,
        provisioningStatus: 'disabled',
        initialTwin: {
          tags: { 
              mytag: 'abc'
          },
          properties: {
            desired: {
              myproperty1: '123',
              myproperty2: '789'
            }
          }
        },
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
            console.log(enrollmentResponse.assignedHub);
            console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
        }
    });
    res.send('generated device enrolment for: ' + registrationId);
});

//update a device. 
//argument deviceid: the id/name of the device
//argument type: value 'single' = single device, value 'group' = group device.
app.get('/updatedevice', function (req, res) {

    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
    var registrationId = req.query.deviceid;
    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    if (req.query.type == 'single')
        var deviceCert = fs.readFileSync('./keys/leaf/' + registrationId + '/_cert.pem').toString();
    else
        var deviceCert = fs.readFileSync('./keys/leaf/' + registrationId + '/_fullchain.pem').toString();
  
    serviceClient.getIndividualEnrollment(registrationId, function (err, enrollmentResponse) {
        if (err) {
          console.log('error reading the individual enrollment: ' + err);
        } else {
          console.log("Etag: " + enrollmentResponse.etag);
          
          etag = enrollmentResponse.etag;

          enrollmentResponse.provisioningStatus = 'enabled';
          
          serviceClient.createOrUpdateIndividualEnrollment(enrollmentResponse, function (err, enrollmentResponse2) {
            if (err) {
              console.log('error updating the individual enrollment: ' + err);
            } else {
              console.log("updated enrollment record returned: " + JSON.stringify(enrollmentResponse2, null, 2));
            }
          });

        }
    });

    res.send('updated device enrolment for: ' + registrationId);
});


//query devices.
app.get('/querydevices', function (req, res) {

    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    var queryForEnrollments = serviceClient.createIndividualEnrollmentQuery ({

        "query":"SELECT TOP 1 * from enrollments", // THIS IS CURRENTLY IGNORED BY DPS. ALL DEVICES ARE RETURNED!

    });
    
    var onEnrollmentResults = function (err, results) {
        if (err) {
            console.error('Failed to fetch the results: ' + err.message);
        } else {
            // Do something with the results
            results.forEach(function (enrollment) {
            //console.log(JSON.stringify(enrollment, null, 2));
            console.log(enrollment.registrationId);
            });
        
            if (queryForEnrollments.hasMoreResults) {
                queryForEnrollments.next(onEnrollmentResults);
            }
        }
    };

    console.log('Querying for the enrollments: ');
    queryForEnrollments.next(onEnrollmentResults);

    res.send('query executed.');
});

//delete individual device registration state.
//argument deviceid: the id/name of the device
app.get('/deletedeviceregstate', function (req, res) {
    var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
    var registrationId = req.query.deviceId;
    var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    
    serviceClient.deleteDeviceRegistrationState(registrationId, function (deletionResponse) {

      console.log("deletion record returned: " + JSON.stringify(deletionResponse, null, 2));

    });

    res.send('deleted device registration state for: ' + registrationId);
});

//create a leaf certificate based on an intermediate certificate.
//arg deviceid the device Id to which this certificate will be applied
//return json with pair certificate + key as leaf certificate to be put on device.
app.get('/createfulldevice', function (req, res) {

    var deviceId = req.query.deviceid;

    console.log("Generate Leaf Cert for + Device: " + deviceId);

    if (!fs.existsSync('./keys/leaf/' + deviceId+'/')) {
        fs.mkdirSync('./keys/leaf/' + deviceId+'/');
    }

    parentCert = fs.readFileSync('./keys/root/'  + '_cert.pem').toString('ascii');
    parentKey = fs.readFileSync('./keys/root/' + '_key.pem').toString('ascii');
    parentChain = fs.readFileSync('./keys/root/' + '_fullchain.pem').toString('ascii');
    var certOptions = {
        commonName: deviceId,
        serial: Math.floor(Math.random() * 1000000000),
        days: 365000,
    };

    certOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = ' + deviceId,
        '[v3_req]',
        'extendedKeyUsage = critical,clientAuth'
    ].join('\n');

    certOptions.serviceKey = parentKey;
    certOptions.serviceCertificate = parentCert;
    var returncert='error';
    var csr = pem.createCertificate(
        certOptions, function (err, cert) {

            fs.writeFileSync('./keys/leaf/' + deviceId + '/_cert.pem', cert.certificate);
            fs.writeFileSync('./keys/leaf/' + deviceId + '/_key.pem', cert.clientKey);
            fs.writeFileSync('./keys/leaf/' + deviceId + '/_fullchain.pem', cert.certificate + '\n' + parentChain);  
            returncert=cert.certificate+'||||'+cert.clientKey ;
            console.log('generated leaf certificate');
            console.log('start working on device registration');
            var provisioningServiceClient = require('azure-iot-provisioning-service').ProvisioningServiceClient;
            var serviceClient = provisioningServiceClient.fromConnectionString(process.env.CONNECTION_STRING);  
            var enrollment = {
                registrationId: deviceId,
                deviceID: deviceId,
                attestation: {
                    type: 'x509',
                    x509: {
                        clientCertificates: {
                            primary: {
                                certificate: cert.certificate
                            }
                        }
                    }
                }
            };
        
            serviceClient.createOrUpdateIndividualEnrollment(enrollment, function (err, enrollmentResponse) {
                if (err) {
                    console.log('error creating the individual enrollment: ' + err);
                } else {
                    console.log(enrollmentResponse.assignedHub);
                    console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
                }
            });
            res.send(returncert);
        }
    ); 
});

http.createServer(app).listen(8000)
