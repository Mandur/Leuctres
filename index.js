var http = require('http')
var pem = require('pem')
var express = require('express')
var fs = require('fs');
pem.config({
    pathOpenSSL: '/usr/bin/openssl'
})

var app = express()

app.get('/createRoot', function (req, res) {

    var csr = pem.createCertificate(
        { days: 180, organization: "smarthometechnology", country: "CH", state: "ZH", selfSigned: true }, function (err, arg) {
            fs.writeFile("./keys/root/certificate.pem", arg.certificate);
            fs.writeFile("./keys/root/clientKey.key", arg.clientKey);
            fs.writeFile("./keys/root/csr.csr", arg.csr);
            fs.writeFile("./keys/root/serviceKey.key", arg.serviceKey);

        });
    console.log(csr);
    res.send('generated root certificate')
});


app.get('/createMiddle', function (req, res) {
    var customer=req.param.customer;
    if (!fs.existsSync('./keys/middle/'+customer)){
        fs.mkdirSync('./keys/middle/'+customer);
    }

    fs.readFile('./keys/root/clientKey.key', "utf-8",function read(err, dataServiceKey) {
        if (err) {
            throw err;
        }
        console.log(dataServiceKey);
        fs.readFile('./keys/root/csr.csr', "utf-8",function read(err2, datacsr) {
            if (err2) {
                throw err2;
            }
        console.log(datacsr);
        var csr = pem.createCertificate(
            { serviceKey: dataServiceKey, selfSigned:false,csr:datacsr,days:180,country:"ch",organization:"ms",commonName:"test" }, function (err, arg) {
                fs.writeFile("./keys/middle/"+customer+"/certificate.pem", arg.certificate);
                fs.writeFile("./keys/middle/"+customer+"/clientKey.key", arg.clientKey);
                fs.writeFile("./keys/middle/"+customer+"/csr.csr", arg.csr);
                fs.writeFile("./keys/middle/"+customer+"/serviceKey.key", arg.serviceKey);

            });
        });

        // Invoke the next step here however you like
    });

    res.send('generated middle certificate')
});

app.get('/createLeaf', function (req, res) {
    var customer=req.param.customer;
    var deviceId=req.param.deviceId;
    if (!fs.existsSync('./keys/leaf/'+deviceId)){
        fs.mkdirSync('./keys/leaf/'+deviceId);
    }
    // First I want to read the file
    fs.readFile('./keys/middle/'+customer+'/serviceKey.key', function read(err, data) {
        if (err) {
            throw err;
        }
        console.log(data);
        var csr = pem.createCertificate(
            { serviceKey: data, selfSigned:false }, function (err, arg) {
                fs.writeFile("./keys/leaf/"+deviceId+"/certificate.pem", arg.certificate);
                fs.writeFile("./keys/leaf/"+deviceId+"/clientKey.key", arg.clientKey);
                fs.writeFile("./keys/leaf/"+deviceId+"/csr.csr", arg.csr);
                fs.writeFile("./keys/leaf/"+deviceId+"/serviceKey.key", arg.serviceKey);

            });

        // Invoke the next step here however you like
    });

    res.send('generated middle certificate')
});


http.createServer(app).listen(8000)
