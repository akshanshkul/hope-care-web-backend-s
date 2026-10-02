import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validation/auth';
import * as c from '../controllers/auth';

const r = Router();

const limit = rateLimit({
    windowMs: 60000,
    max: 20
});

r.post('/register', limit, validate(registerSchema), c.register);
r.post('/login', limit, c.login);
r.post('/refresh', limit, c.refresh);
export default r;
