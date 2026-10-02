import { Request, Response, NextFunction } from 'express';
import { profileModel } from '../models/profile.model';

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ data: await profileModel.find(req.user!.role, req.user!.id) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, phone, alternatePhone, profileImageKey, officeAddress, addressLine, city, state, postalCode } = req.body as {
      displayName?: string;
      phone?: string;
      alternatePhone?: string;
      profileImageKey?: string;
      officeAddress?: string;
      addressLine?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    res.json({
      data: await profileModel.upsert(req.user!.role, req.user!.id, {
        displayName, phone, alternatePhone, profileImageKey, officeAddress, addressLine, city, state, postalCode
      })
    });
  } catch (error) {
    next(error);
  }
}
