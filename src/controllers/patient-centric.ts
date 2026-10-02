import { Request, Response, NextFunction } from 'express';
import { patientCentricModel } from '../models/patient-centric.model';
export async function getProfile(req: Request,res: Response,next: NextFunction){try{res.json({data:await patientCentricModel.profile(req.user!.id)});}catch(e){next(e);}}
export async function updateProfile(req: Request,res: Response,next: NextFunction){try{res.json({data:await patientCentricModel.updateProfile(req.user!.id,req.body)});}catch(e){next(e);}}
export async function getRecords(req: Request,res: Response,next: NextFunction){try{res.json({data:await patientCentricModel.records(req.user!.id)});}catch(e){next(e);}}
export async function addRecord(req: Request,res: Response,next: NextFunction){try{res.status(201).json({data:await patientCentricModel.addRecord(req.user!.id,req.body)});}catch(e){next(e);}}
export async function getRoles(req: Request,res: Response,next: NextFunction){try{res.json({data:await patientCentricModel.roles(req.user!.id)});}catch(e){next(e);}}
