"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = require("crypto");
const config_1 = require("../../config");
const ENCRYPTION_KEY = config_1.config.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined.');
}
const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'base64');
if (ENCRYPTION_KEY_BUFFER.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes.');
}
const encrypt = (data) => {
    const iv = (0, crypto_1.randomBytes)(16);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv);
    return {
        iv: iv.toString('hex'),
        encrypted: cipher.update(data, 'utf8', 'hex') + cipher.final('hex'),
    };
};
exports.encrypt = encrypt;
const decrypt = ({ iv, encrypted, }) => {
    const decipher = (0, crypto_1.createDecipheriv)('aes-256-cbc', ENCRYPTION_KEY_BUFFER, Buffer.from(iv, 'hex'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};
exports.decrypt = decrypt;
