import { Request, Response, NextFunction } from 'express';
import * as service from '../services/auth';
import { verifyRefresh, signAccess } from '../security/tokens';
import { userModel } from '../models/user.model';
import { cmoModel } from '../models/cmo.model';
import { doctorAccountModel, hospitalAccountModel } from '../models/professional-account.model';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.register(
      req.body.email,
      req.body.password,
      req.body.role,
      req.body.role === 'PATIENT'
        ? { firstName: req.body.firstName, lastName: req.body.lastName, mobile: req.body.mobile, aadhaar: req.body.aadhaar }
        : undefined,
      req.body.role === 'DOCTOR'
        ? {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          mobile: req.body.mobile,
          aadhaar: req.body.aadhaar,
          degree: req.body.degree,
          registrationNumber: req.body.registrationNumber
        }
        : undefined
    ));
  } catch (error) {
    next(error);
  }
}

import { loginSchema } from '../validation/auth';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(await service.login(parsed.data.email, parsed.data.role, parsed.data.password));
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const claims = verifyRefresh(req.body.refreshToken);
    if (claims.role.startsWith('CMO_')) {
      const cmo = await cmoModel.findById(claims.sub);
      if (!cmo) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }
      if (claims.role === 'DOCTOR' || claims.role === 'HOSPITAL') {
        const account = claims.role === 'DOCTOR'
          ? await doctorAccountModel.findById(claims.sub)
          : await hospitalAccountModel.findById(claims.sub);
        if (!account) {
          res.status(401).json({ error: 'Invalid refresh token' });
          return;
        }
        res.json({ accessToken: signAccess({ sub: account.id, role: claims.role }) });
        return;
      }
      res.json({ accessToken: signAccess({ sub: cmo.id, role: claims.role }) });
      return;
    }
    const user = await userModel.findById(claims.sub);
    if (!user) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    res.json({ accessToken: signAccess({ sub: user.id, role: user.role, roleId: user.role_id }) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
