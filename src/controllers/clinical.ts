import { Request, Response, NextFunction } from 'express';
import { clinicalModel } from '../models/clinical.model';
const fail = (message: string, statusCode = 400) => Object.assign(new Error(message), { statusCode });
export async function getHistory(req: Request, res: Response, next: NextFunction) { try {
  const p = await clinicalModel.patientForUser(req.user!.id); if (!p) throw fail('Patient profile not found', 404);
  res.json({ data: await clinicalModel.history(p.id) });
} catch (e) { next(e); } }
export async function addHistory(req: Request, res: Response, next: NextFunction) { try {
  const p = await clinicalModel.patientForUser(req.user!.id); if (!p) throw fail('Patient profile not found', 404);
  res.status(201).json({ data: await clinicalModel.addHistory(p.id, req.user!.id, req.body) });
} catch (e) { next(e); } }
export async function departments(_req: Request, res: Response, next: NextFunction) { try { res.json({ data: await clinicalModel.departments() }); } catch(e) { next(e); } }
export async function createDepartment(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({data: await clinicalModel.addDepartment(req.body)}); } catch(e) { next(e); } }
export async function hospitals(_req: Request, res: Response, next: NextFunction) { try { res.json({ data: await clinicalModel.hospitals() }); } catch(e) { next(e); } }
export async function createHospital(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({data: await clinicalModel.addHospital(req.user!.id, req.body)}); } catch(e) { next(e); } }
export async function associateDoctor(req: Request, res: Response, next: NextFunction) { try { const result = await clinicalModel.associate(req.user!.id, req.body); if (!result) throw fail('Doctor or department not found', 404); res.status(201).json({data: result}); } catch(e) { next(e); } }
export async function book(req: Request, res: Response, next: NextFunction) { try {
  const result = await clinicalModel.book(req.user!.id, req.body); if (!result) throw fail('Hospital, doctor, department, or association not found', 422);
  res.status(201).json({data: result});
} catch(e) { next(e); } }
export async function listAppointments(req: Request, res: Response, next: NextFunction) { try { res.json({data: await clinicalModel.listFor(req.user!.id, req.user!.role)}); } catch(e) { next(e); } }
export async function routeAppointment(req: Request, res: Response, next: NextFunction) { try {
  const result = await clinicalModel.route(String(req.params.id), req.user!.id, req.body.doctorId, req.body.departmentId);
  if (!result) throw fail('Appointment or doctor association not found', 404); res.json({data: result});
} catch(e) { next(e); } }
export async function transitionAppointment(req: Request, res: Response, next: NextFunction) { try {
  const result = await clinicalModel.transition(String(req.params.id), req.user!.id, req.user!.role, req.body.status, req.body.note);
  if (result === undefined) throw fail('Appointment not found', 404); if (result === null) throw fail('Not authorized for this appointment', 403);
  res.json({data: result});
} catch(e) { next(e); } }
