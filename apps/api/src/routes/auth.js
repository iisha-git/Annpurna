import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { Owner } from '../models/Owner.js';
import { Student } from '../models/Student.js';

const router = Router();

const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

const studentView = (s) => ({
  id: s._id,
  messNumber: s._id,
  name: s.name,
  year: s.year || null,
  branch: s.branch || null,
  room: s.room || null,
  role: 'student',
});

/**
 * POST /api/auth/signup — student claims their roster doc.
 * body: { messNumber, name, mobile, password }
 */
router.post('/signup', async (req, res, next) => {
  try {
    const mess = String(req.body.messNumber || '').trim();
    const name = String(req.body.name || '').replace(/\s+/g, ' ').trim();
    const mobile = String(req.body.mobile || '').replace(/\D/g, '');
    const password = String(req.body.password || '');

    if (!mess) return res.status(400).json({ error: 'Enter your mess number.' });
    if (!name) return res.status(400).json({ error: 'Enter your full name.' });
    if (mobile.length !== 10) {
      return res.status(400).json({ error: "That doesn't look like a 10-digit mobile number." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password needs at least 6 characters.' });
    }

    const student = await Student.findById(mess);
    if (!student) {
      return res.status(404).json({ error: `Mess number "${mess}" is not on the mess list.` });
    }
    if (student.active === false) {
      return res.status(410).json({ error: `Mess number "${mess}" is no longer on the mess list. Ask the owner.` });
    }
    if (student.claimed) {
      return res.status(409).json({ error: 'That mess number already has an account. Try signing in.' });
    }
    if (norm(student.name) !== norm(name)) {
      return res.status(400).json({ error: "Name doesn't match mess records. Check spelling." });
    }
    if (!student.mobile || norm(student.mobile) !== norm(mobile)) {
      return res.status(400).json({ error: "Mobile number doesn't match mess records." });
    }

    student.passwordHash = await bcrypt.hash(password, 10);
    student.claimed = true;
    student.claimedAt = new Date();
    await student.save();

    const saved = student.toObject({ select: false });
    res.json({ token: sign({ sub: saved._id, role: 'student' }), user: studentView(saved) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login — identifier is an owner email ("@" present) OR a
 * student mess number.
 */
router.post('/login', async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Enter your credentials.' });
    }

    if (identifier.includes('@')) {
      const owner = await Owner.findOne({ email: identifier.toLowerCase() }).select('+passwordHash');
      if (!owner || !(await bcrypt.compare(password, owner.passwordHash))) {
        return res.status(401).json({ error: 'Wrong email or password.' });
      }
      return res.json({
        token: sign({ sub: String(owner._id), role: 'owner' }),
        user: { id: String(owner._id), role: 'owner', name: owner.name, email: owner.email },
      });
    }

    const student = await Student.findById(identifier).select('+passwordHash');
    if (!student || student.active === false || !student.claimed || !(await bcrypt.compare(password, student.passwordHash || ''))) {
      return res.status(401).json({ error: 'Wrong mess number or password.' });
    }
    res.json({ token: sign({ sub: student._id, role: 'student' }), user: studentView(student) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me — the current session's user. */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;