import crypto from 'crypto';
export function hashIdentity(value:string){return crypto.createHash('sha256').update(value.trim()).digest('hex')}
export function encryptIdentity(value:string){return {ciphertext:Buffer.from(value).toString('base64'),keyVersion:'placeholder-v1'}}
export function decryptIdentity(value:string){return Buffer.from(value,'base64').toString('utf8')}
