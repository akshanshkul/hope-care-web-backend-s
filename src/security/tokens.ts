import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export type Claims = { sub: string; role: string; roleId?: string };
const sign = (claims: Claims, secret: string, expiresIn: string) =>
  jwt.sign(claims, secret, { expiresIn } as SignOptions);

export const signAccess = (claims: Claims) => sign(claims, env.jwtAccessSecret, env.accessTokenTtl);
export const verifyAccess = (token: string) => jwt.verify(token, env.jwtAccessSecret) as Claims;
export const signRefresh = (claims: Claims) => sign(claims, env.jwtRefreshSecret, env.refreshTokenTtl);
export const verifyRefresh = (token: string) => jwt.verify(token, env.jwtRefreshSecret) as Claims;
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
