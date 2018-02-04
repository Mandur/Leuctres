# Helper library to Device Provisioning service

N.B This library is not supposed to be a security best practice. It is just meant to provide an easy way to get started with DPS on Azure & the IoT Hub.

## Server
This server provide example of how to manage and create a certificate chain and a wrapper around common DPS operation such as creating a group, creating a device... The server is just a quickstart and is not meant to be secure, or to be a best practice. 
[documentation](server/readme.md)

## Client
The client library is here to provide a little example on how to connect with x509 certificate on Azure. This has been loosely inspired on the node public documentation available on GitHub. you could check a working C example [here](https://github.com/Azure/azure-iot-sdk-c/blob/master/iothub_client/samples/iothub_client_sample_x509/iothub_client_sample_x509.c)
[documentation](client/readme.md)