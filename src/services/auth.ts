import bcrypt from 'bcryptjs';
import { userModel } from '../models/user.model';
import { signAccess, signRefresh } from '../security/tokens';
import { sendRegistrationEmail } from './email';
import { RoleName } from '../models/role.model';
import { cmoModel } from '../models/cmo.model';
import { doctorAccountModel, hospitalAccountModel } from '../models/professional-account.model';
import { patientModel } from '../models/patient.model';
import { hashIdentity } from '../security/identity';

export async function register(
  email: string,
  password: string,
  role: RoleName,
  patientDetails?: { firstName: string; lastName: string; mobile: string; aadhaar: string }
  ,doctorDetails?: {
    firstName: string;
    lastName: string;
    mobile: string;
    aadhaar: string;
    degree: string;
    registrationNumber: string;
  }
) {
  const passwordHash = await bcrypt.hash(password, 12);
  if (role === 'DOCTOR' || role === 'HOSPITAL') {
    const account = role === 'DOCTOR'
      ? await doctorAccountModel.create(email, passwordHash, {
        ...doctorDetails!,
        aadhaarHash: hashIdentity(doctorDetails!.aadhaar)
      })
      : await hospitalAccountModel.create(email, passwordHash);
    try {
      await sendRegistrationEmail(account.email, role);
    } catch (error) {
      console.error('Registration email delivery failed', error);
    }
    return {
      accessToken: signAccess({ sub: account.id, role }),
      refreshToken: signRefresh({ sub: account.id, role }),
      user: { id: account.public_id, email: account.email, role }
    };
  }
  if (role === 'CMO_DISTRICT' || role === 'CMO_STATE' || role === 'CMO_NOMINEE_AC') {
    const cmoType = role === 'CMO_DISTRICT' ? 'DISTRICT' : role === 'CMO_STATE' ? 'STATE' : 'NOMINEE_AC';
    const cmo = await cmoModel.create(email, passwordHash, cmoType);
    return {
      accessToken: signAccess({ sub: cmo.id, role }),
      refreshToken: signRefresh({ sub: cmo.id, role }),
      user: { id: cmo.public_id, email: cmo.email, role }
    };
  }
  if (role === 'PATIENT' && patientDetails) {
    const identityHash = hashIdentity(patientDetails.aadhaar);
    if (await patientModel.findByIdentityHash(identityHash)) {
      throw Object.assign(new Error('Aadhaar is already registered'), { statusCode: 409 });
    }
    const user = await userModel.create(email, passwordHash, role);
    const patient = await patientModel.completeRegistration(
      user.id,
      patientDetails.firstName,
      patientDetails.lastName,
      patientDetails.mobile,
      identityHash
    );
    try {
      await sendRegistrationEmail(user.email, role);
    } catch (error) {
      console.error('Registration email delivery failed', error);
    }
    return {
      accessToken: signAccess({ sub: user.id, role: user.role, roleId: user.role_id }),
      refreshToken: signRefresh({ sub: user.id, role: user.role, roleId: user.role_id }),
      user: { id: user.public_id, patientId: patient.public_id, email: user.email, role: user.role }
    };
  }
  const user = await userModel.create(email, passwordHash, role);
  try {
    if (role === 'PATIENT') {
      await sendRegistrationEmail(user.email, role);
    }
  } catch (error) {
    console.error('Registration email delivery failed', error);
  }
  return {
    accessToken: signAccess({ sub: user.id, role: user.role, roleId: user.role_id }),
    refreshToken: signRefresh({ sub: user.id, role: user.role, roleId: user.role_id }),
    user: { id: user.public_id, email: user.email, role: user.role }
  };
}

export async function login(email: string, role: string, password: string) {
  console.log(role);
  if (role === 'CMO_DISTRICT' || role === 'CMO_STATE' || role === 'CMO_NOMINEE_AC') {
    const cmo = await cmoModel.findByEmail(email);
    if (!cmo || !(await bcrypt.compare(password, cmo.password_hash))) {
      throw new Error('Invalid credentials');
    }
    const cmoType = cmo.cmo_type === 'DISTRICT' ? 'CMO_DISTRICT' : cmo.cmo_type === 'STATE' ? 'CMO_STATE' : 'CMO_NOMINEE_AC';
    if (cmoType !== role) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: signAccess({ sub: cmo.id, role }),
      refreshToken: signRefresh({ sub: cmo.id, role }),
      user: { id: cmo.public_id, email: cmo.email, role }
    };
  }

  if (role === 'DOCTOR') {
    const doctor = await doctorAccountModel.findByEmail(email);
    if (!doctor || !(await bcrypt.compare(password, doctor.password_hash))) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: signAccess({ sub: doctor.id, role }),
      refreshToken: signRefresh({ sub: doctor.id, role }),
      user: { id: doctor.public_id, email: doctor.email, role }
    };
  }

  if (role === 'HOSPITAL') {
    const hospital = await hospitalAccountModel.findByEmail(email);
    if (!hospital || !(await bcrypt.compare(password, hospital.password_hash))) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: signAccess({ sub: hospital.id, role }),
      refreshToken: signRefresh({ sub: hospital.id, role }),
      user: { id: hospital.public_id, email: hospital.email, role }
    };
  }

  if (role === 'PATIENT') {
    const user = await userModel.findByEmail(email);
    if (!user || user.role !== role || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: signAccess({ sub: user.id, role: user.role, roleId: user.role_id }),
      refreshToken: signRefresh({ sub: user.id, role: user.role, roleId: user.role_id }),
      user: { id: user.public_id, email: user.email, role: user.role }
    };
  }

  throw new Error('Invalid credentials');
}
