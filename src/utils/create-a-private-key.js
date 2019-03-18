'use strict';

const keythereum = require('keythereum');

const password = '12345';
const dk = keythereum.create();
const keyObject = keythereum.dump(password, dk.privateKey, dk.salt, dk.iv);
keythereum.exportToFile(keyObject);

console.log('password: ' + password);
console.log('address: 0x' + keyObject.address);
console.log('private key: 0x' + keythereum.recover(password, keyObject).toString('hex'));
