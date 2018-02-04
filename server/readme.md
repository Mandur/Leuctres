# Server settings
to use the server you need to configure a .env file in the root with the following value filled : 

CONNECTION_STRING=[Connection string to your Azure DPS]

ID_SCOPE=[The id scope of your Azure DPS]

# Server API surface documentation

GET operations: 

## /createroot
Create root certificate

Arguments:

*rootname* the name of your root Certificate

## /createintermediary 
create a set of intermediate certificate based on the current root saved

Arguments:

*customer* set the customer to which the intermediate certificate apply


## /createleaf
create a leaf certificate based on an intermediate certificate.

Arguments:

*customer* intermediary certificate to use

*deviceid* the device Id to which this certificate will be applied

**return** json with pair certificate + key as leaf certificate to be put on device.


## /verify
method to verify a certificate given a challenge

Arguments:

*challenge* the challenge given by the Azure DPS

*customer* the customer of the certificate to verify

**return** the public part of the generated certificate

## /creategroup
Create a group based on a certificate for group provisioning

Arguments:

*certiftype* type of the certificate, accepted value, root or intermediary

*groupname* name of the created group

*customername* name of the customer.

## /joingroup

device join a group on Azure DPS

**ID_SCOPE** the id scope of the DPS, must be set in the .env file

Arguments:

*deviceid* the id (name) of your device

## /createdevice

create a device. 

*customer* the customer name linked to the device

*deviceid* the id/name of the device

*type* value 'single' = single device, value 'group' = group device. 

## /clean
clean all stored certificates