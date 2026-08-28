import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config.js';
import { Owner } from '../models/Owner.js';
import { Student } from '../models/Student.js';

/**
 * Auth middleware — attaches req.user for any valid session.
 *
 * JWT payload: { sub, role } where sub is the owner _id or the student's
 * mess number. Student tokens are only valid while the roster doc is
 * claimed (i.e. still has a passwordHash).
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in.' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }

  if (payload.role === 'owner') {
    const owner = await Owner.findById(payload.sub).lean();
    if (!owner) return res.status(401).json({ error: 'Owner account not found.' });
    req.user = {
      role: 'owner',
      id: String(owner._id),
      name: owner.name,
      email: owner.email,
    };
  } else if (payload.role === 'student') {
    const student = await Student.findById(payload.sub).lean();
    if (!student || !student.claimed) {
      return res.status(401).json({ error: 'Account not found.' });
    }
    req.user = {
      role: 'student',
      messNumber: student._id,
      name: student.name,
      year: student.year || null,
      branch: student.branch || null,
      room: student.room || null,
      mobile: student.mobile || null,
    };
  } else {
    return res.status(401).json({ error: 'Invalid session.' });
  }

  next();
}

/** Requires a signed-in session AND the owner role (run it on its own). */
export const requireOwner = [
  requireAuth,
  (req, res, next) => {
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Owner only.' });
    }
    next();
  },
];