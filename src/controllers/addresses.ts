import { NextFunction, Request, Response } from 'express';
import * as addressService from '../services/address';

export async function create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ success: true, data: await addressService.replaceAddress(req.user!.id, req.body) }); } catch (error) { next(error); } }
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const addressId = String(req.params.addressId);
    const current = await addressService.getAddress(req.user!.id, addressId);
    if (!current) return res.status(404).json({ error: 'Address not found' });
    res.status(201).json({ success: true, data: await addressService.replaceAddress(req.user!.id, { ...current, ...req.body, addressType: current.addressType }, addressId) });
  } catch (error) { next(error); }
}
export async function active(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await addressService.activeAddresses(req.user!.id) }); } catch (error) { next(error); } }
export async function all(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await addressService.history(req.user!.id) }); } catch (error) { next(error); } }
export async function one(req: Request, res: Response, next: NextFunction) { try { const data = await addressService.getAddress(req.user!.id, String(req.params.addressId)); if (!data) return res.status(404).json({ error: 'Address not found' }); res.json({ success: true, data }); } catch (error) { next(error); } }
export async function statuses(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await addressService.statusHistory(req.user!.id, String(req.params.addressId)) }); } catch (error) { next(error); } }
