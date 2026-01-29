const express = require('express');
const { query } = require('../db');
// auth middleware removed for demo access

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const jobs = await query(
      `SELECT job_orders.*, users.full_name AS recruiter_name
       FROM job_orders
       JOIN users ON job_orders.recruiter_id = users.id
       ORDER BY job_orders.created_at DESC`
    );
    return res.json({ jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load job orders' });
  }
});

router.get('/mine', async (_req, res) => {
  try {
    const jobs = await query(
      `SELECT * FROM job_orders ORDER BY created_at DESC`
    );
    return res.json({ jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load your job orders' });
  }
});

router.post('/', async (req, res) => {
  const { title, company, description, location, salaryMin, salaryMax, status } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const safeStatus = ['draft', 'open', 'closed'].includes(status) ? status : 'draft';
  const recruiterId = req.user?.id || 4; // fall back to existing user
  try {
    const result = await query(
      `INSERT INTO job_orders (recruiter_id, title, company, description, location, salary_min, salary_max, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recruiterId,
        title,
        company || null,
        description || '',
        location || '',
        salaryMin ?? null,
        salaryMax ?? null,
        safeStatus
      ]
    );
    const [job] = await query('SELECT * FROM job_orders WHERE id = ?', [result.insertId]);
    return res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create job order' });
  }
});

router.post('/copy', async (req, res) => {
  const { sourceId, title, company, description, location, salaryMin, salaryMax, status } = req.body;
  if (!sourceId) {
    return res.status(400).json({ message: 'Source job order id is required' });
  }
  try {
    const [source] = await query('SELECT * FROM job_orders WHERE id = ?', [sourceId]);
    if (!source) {
      return res.status(404).json({ message: 'Job order not found' });
    }
    const recruiterId = req.user?.id || source.recruiter_id || 4;
    const nextTitle = title?.trim() || `${source.title} (Copy)`;
    const result = await query(
      `INSERT INTO job_orders (recruiter_id, title, company, description, location, salary_min, salary_max, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recruiterId,
        nextTitle,
        company ?? source.company ?? null,
        description ?? source.description ?? '',
        location ?? source.location ?? '',
        salaryMin ?? source.salary_min,
        salaryMax ?? source.salary_max,
        ['draft', 'open', 'closed'].includes(status) ? status : 'draft'
      ]
    );
    const [job] = await query('SELECT * FROM job_orders WHERE id = ?', [result.insertId]);
    return res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to copy job order' });
  }
});

module.exports = router;
