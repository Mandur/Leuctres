
var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express();

app.get('/createRoot', function (req, res) {
    var commonName = "testRoot";

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


app.get('/createIntermediary', function (req, res) {
    var certOptions = {
        commonName: commonName,
        serial: Math.floor(Math.random() * 1000000000),
        days: 1,
    };
    var customer = req.query.customer;

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

app.get('/createLeaf', function (req, res) {
    var customer = req.query.customer;
    var deviceId = req.query.deviceId;
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
    var certifPath = req.query.certif;
    var challenge = req.query.challenge;
    if (!fs.existsSync('./keys/verif/' + challenge)) {
        fs.mkdirSync('./keys/verif/' + challenge);
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
    res.send('generated leaf certificate')

    // Invoke the next step here however you like
});



http.createServer(app).listen(8000)
