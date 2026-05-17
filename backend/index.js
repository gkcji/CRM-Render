require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./database'); // This requires the database.js we created
const {
  sendMail
} = require('./mailer');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_aura_crm';

// ── RBAC MIDDLEWARE ──────────────────────────────────────────────────────────
// Verifies JWT and attaches req.user = { id, email, role }
const authenticate = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({
    error: 'No token provided'
  });
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

// requireRole('Admin') or requireRole(['Admin','Manager'])
const requireRole = roles => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!req.user) return res.status(401).json({
    error: 'Not authenticated'
  });
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${allowed.join(' or ')}`
    });
  }
  next();
};
// ────────────────────────────────────────────────────────────────────────────

const app = express();
const port = process.env.PORT || 8080;
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// --- AUTH & USERS ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;
  try {
    const user = await db.prepare('SELECT id, name, email, role, password FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({
      error: 'Invalid email or password'
    });

    // Secure bcrypt comparison
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({
      error: 'Invalid email or password'
    });

    // Remove password from payload
    delete user.password;

    // Generate real JWT
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    }, JWT_SECRET, {
      expiresIn: '7d'
    });
    res.json({
      user,
      token
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.get('/api/users', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const users = await db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name ASC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/users', authenticate, requireRole('Admin'), async (req, res) => {
  const {
    name,
    email,
    password,
    role
  } = req.body;
  try {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({
      error: 'User with this email already exists'
    });
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword, role || 'Agent');
    res.status(201).json({
      id: result.id,
      name,
      email,
      role: role || 'Agent'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/users/:id', authenticate, requireRole('Admin'), async (req, res) => {
  try {
    const user = await db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({
      error: 'User not found'
    });
    if (user.role === 'Admin') {
      const adminCount = (await db.prepare("SELECT count(*) as count FROM users WHERE role = 'Admin'").get()).count;
      if (adminCount <= 1) return res.status(400).json({
        error: 'Cannot delete the last admin'
      });
    }
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    await db.prepare('UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- AUDIT LOG ROUTES ---
app.get('/api/audit-logs', authenticate, requireRole('Admin'), async (req, res) => {
  try {
    const logs = await db.prepare(`
            SELECT al.*, u.name as user_name, u.role as user_role
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 200
        `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/audit-logs', async (req, res) => {
  const {
    user_id,
    action,
    entity_type,
    entity_id,
    details
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)');
    stmt.run(user_id || null, action, entity_type, entity_id || null, details || null);
    res.status(201).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- CUSTOM FIELDS ROUTES ---

// Get all custom field definitions (optionally by entity_type)
app.get('/api/custom-fields', authenticate, async (req, res) => {
  try {
    const {
      entity_type
    } = req.query;
    let query = 'SELECT * FROM custom_fields';
    const params = [];
    if (entity_type) {
      query += ' WHERE entity_type = ?';
      params.push(entity_type);
    }
    query += ' ORDER BY created_at ASC';
    res.json(await db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Create a new custom field definition
app.post('/api/custom-fields', authenticate, requireRole('Admin'), async (req, res) => {
  const {
    label,
    field_type,
    entity_type,
    options,
    required
  } = req.body;
  if (!label || !field_type || !entity_type) return res.status(400).json({
    error: 'label, field_type, entity_type are required'
  });
  try {
    // Auto-generate a stable key from label
    const field_key = label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const result = await db.prepare('INSERT INTO custom_fields (label, field_key, field_type, entity_type, options, required) VALUES (?, ?, ?, ?, ?, ?)').run(label, field_key, field_type, entity_type, options || null, required ? 1 : 0);
    res.status(201).json({
      id: result.id,
      label,
      field_key,
      field_type,
      entity_type
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Delete a custom field (and all its values via CASCADE)
app.delete('/api/custom-fields/:id', authenticate, requireRole('Admin'), async (req, res) => {
  try {
    await db.prepare('DELETE FROM custom_fields WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- NOTIFICATIONS ROUTES ---
// Helper to create a notification (used internally)
async function createNotif(db, {
  user_id = null,
  title,
  body = '',
  type = 'info',
  link = ''
}) {
  try {
    await db.prepare('INSERT INTO notifications (user_id, title, body, type, link) VALUES (?,?,?,?,?)').run(user_id, title, body, type, link);
  } catch (e) {
    console.error('Notif insert error:', e.message);
  }
}
app.get('/api/notifications', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1').run();
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- EMAIL TEMPLATES ROUTES ---
app.get('/api/email-templates', authenticate, async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM email_templates ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/email-templates', authenticate, requireRole('Admin'), async (req, res) => {
  const {
    name,
    subject,
    body
  } = req.body;
  try {
    const result = await db.prepare('INSERT INTO email_templates (name, subject, body) VALUES (?, ?, ?)').run(name, subject, body);
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/email-templates/:id', authenticate, requireRole('Admin'), async (req, res) => {
  const {
    name,
    subject,
    body
  } = req.body;
  try {
    await db.prepare('UPDATE email_templates SET name=?, subject=?, body=? WHERE id=?').run(name, subject, body, req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/email-templates/:id', authenticate, requireRole('Admin'), async (req, res) => {
  try {
    await db.prepare('DELETE FROM email_templates WHERE id=?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- PRODUCTS CATALOG ROUTES ---
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/products', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    billing_freq
  } = req.body;
  try {
    const result = await db.prepare('INSERT INTO products (name, sku, description, price, billing_freq) VALUES (?, ?, ?, ?, ?)').run(name, sku, description, price, billing_freq || 'One-Time');
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/products/:id', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    billing_freq
  } = req.body;
  try {
    await db.prepare('UPDATE products SET name=COALESCE(?, name), sku=COALESCE(?, sku), description=COALESCE(?, description), price=COALESCE(?, price), billing_freq=COALESCE(?, billing_freq) WHERE id=?').run(name, sku, description, price, billing_freq, req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/products/:id', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  try {
    await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Get all custom field values for a specific record
app.get('/api/custom-field-values/:entity_type/:entity_id', async (req, res) => {
  try {
    const {
      entity_type,
      entity_id
    } = req.params;
    // Return all field definitions for this entity type, with their current values
    const fields = await db.prepare('SELECT * FROM custom_fields WHERE entity_type = ? ORDER BY created_at ASC').all(entity_type);
    const values = await db.prepare('SELECT * FROM custom_field_values WHERE entity_type = ? AND entity_id = ?').all(entity_type, entity_id);
    const valueMap = {};
    for (const v of values) valueMap[v.field_id] = v.value;
    const result = fields.map(f => ({
      ...f,
      value: valueMap[f.id] || ''
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Save/update custom field values for a record
app.post('/api/custom-field-values/:entity_type/:entity_id', async (req, res) => {
  const {
    entity_type,
    entity_id
  } = req.params;
  const {
    values
  } = req.body; // { [field_id]: value }
  try {
    const upsert = db.prepare('INSERT INTO custom_field_values (field_id, entity_type, entity_id, value) VALUES (?, ?, ?, ?) ON CONFLICT(field_id, entity_type, entity_id) DO UPDATE SET value = excluded.value');
    for (const [field_id, value] of Object.entries(values)) {
      await upsert.run(Number(field_id), entity_type, entity_id, value);
    }
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- GLOBAL SEARCH ROUTE ---
app.get('/api/search', async (req, res) => {
  try {
    const {
      q
    } = req.query;
    if (!q || q.length < 2) return res.json({
      leads: [],
      deals: []
    });
    const term = `%${q}%`;
    const matchedLeads = await db.prepare(`
            SELECT id, name, company, email, phone 
            FROM leads 
            WHERE name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? 
            LIMIT 5
        `).all(term, term, term, term);
    const matchedDeals = await db.prepare(`
            SELECT id, title, value, stage 
            FROM deals 
            WHERE title LIKE ? 
            LIMIT 5
        `).all(term);
    res.json({
      leads: matchedLeads,
      deals: matchedDeals
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// --- MAIN BUSINESS ROUTES ---
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalLeads: (await db.prepare('SELECT count(*) as count FROM leads').get()).count,
      channelCounts: await db.prepare('SELECT lead_type, count(*) as count FROM leads GROUP BY lead_type').all(),
      dueFollowupsCount: (await db.prepare("SELECT count(*) as count FROM tasks WHERE completed = 0 AND date(due_date) <= date('now')").get()).count,
      upcomingFollowupsCount: (await db.prepare("SELECT count(*) as count FROM tasks WHERE completed = 0 AND date(due_date) > date('now')").get()).count,
      convertedCount: (await db.prepare("SELECT count(*) as count FROM leads WHERE status IN ('Qualified', 'Converted', 'Closed Won')").get()).count,
      dueTasks: await db.prepare("SELECT t.*, l.name as lead_name FROM tasks t LEFT JOIN leads l ON t.lead_id = l.id WHERE t.completed = 0 AND date(t.due_date) <= date('now') ORDER BY t.due_date ASC").all(),
      upcomingTasks: await db.prepare("SELECT t.*, l.name as lead_name FROM tasks t LEFT JOIN leads l ON t.lead_id = l.id WHERE t.completed = 0 AND date(t.due_date) > date('now') ORDER BY t.due_date ASC").all(),
      leadsBySource: await db.prepare('SELECT source, count(*) as count FROM leads WHERE source IS NOT NULL GROUP BY source').all(),
      leadsByIndustry: await db.prepare("SELECT industry, count(*) as count FROM leads WHERE industry IS NOT NULL AND industry != '' GROUP BY industry").all(),
      recentLeads: await db.prepare('SELECT id, name, email, phone, company, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5').all(),
      pipelineFunnel: await db.prepare(`SELECT stage as name, count(*) as value, sum(value) as revenue FROM deals GROUP BY stage ORDER BY CASE stage WHEN 'Discovery' THEN 1 WHEN 'Proposal Sent' THEN 2 WHEN 'Negotiation' THEN 3 WHEN 'Closed Won' THEN 4 ELSE 5 END`).all(),
      revenueByMonth: await db.prepare(`SELECT strftime('%Y-%m', expected_close) as month, sum(value) as revenue FROM deals WHERE stage = 'Won' AND expected_close IS NOT NULL GROUP BY month ORDER BY month ASC LIMIT 12`).all()
    };
    res.json(stats);
  } catch (err) {
    console.error("API STATS ERROR:", err);
    res.status(500).json({
      error: err.message
    });
  }
});

// Advanced Reports API
app.get('/api/reports', async (req, res) => {
  try {
    const stats = {
      agentPerformance: await db.prepare(`
                SELECT u.name, u.email,
                       (SELECT count(*) FROM leads WHERE assigned_to = u.id) as total_leads,
                       (SELECT sum(value) FROM deals d JOIN leads l ON d.lead_id = l.id WHERE l.assigned_to = u.id AND d.stage = 'Closed Won') as revenue_won,
                       (SELECT count(*) FROM deals d JOIN leads l ON d.lead_id = l.id WHERE l.assigned_to = u.id AND d.stage = 'Closed Won') as deals_won
                FROM users u
            `).all(),
      pipelineFunnel: await db.prepare(`
                SELECT stage as name, count(*) as value, sum(value) as revenue 
                FROM deals GROUP BY stage ORDER BY 
                CASE stage WHEN 'Discovery' THEN 1 WHEN 'Proposal Sent' THEN 2 WHEN 'Negotiation' THEN 3 WHEN 'Closed Won' THEN 4 ELSE 5 END
            `).all(),
      revenueByMonth: await db.prepare(`
                SELECT strftime('%Y-%m', expected_close) as month, sum(value) as revenue
                FROM deals
                WHERE stage = 'Closed Won' AND expected_close IS NOT NULL
                GROUP BY month ORDER BY month ASC LIMIT 12
            `).all()
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Leads — Agents only see their own assigned leads
app.get('/api/leads', authenticate, async (req, res) => {
  try {
    let query = 'SELECT leads.*, users.name as assigned_to_name FROM leads LEFT JOIN users ON leads.assigned_to = users.id';
    const params = [];
    const conditions = [];

    // Agent role: restrict to only their assigned leads
    if (req.user.role === 'Agent') {
      conditions.push('leads.assigned_to = ?');
      params.push(req.user.id);
    } else if (req.query.assigned_to) {
      conditions.push('leads.assigned_to = ?');
      params.push(req.query.assigned_to);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY leads.created_at DESC';
    const leads = await db.prepare(query).all(...params);
    res.json(leads);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({
      error: 'Lead not found'
    });
    const activities = await db.prepare('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    const tasks = await db.prepare('SELECT * FROM tasks WHERE lead_id = ? ORDER BY due_date ASC').all(req.params.id);
    const deals = await db.prepare('SELECT * FROM deals WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({
      lead,
      activities,
      tasks,
      deals
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/leads/:id/activities', async (req, res) => {
  const {
    type,
    description
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO activities (lead_id, type, description) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, type, description);
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/activities/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/leads/:id/tasks', async (req, res) => {
  const {
    title,
    due_date
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO tasks (lead_id, title, due_date) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, title, due_date);

    // --- NOTIFICATION HOOK ---
    const lead = await db.prepare('SELECT name, assigned_to FROM leads WHERE id = ?').get(req.params.id);
    if (lead && lead.assigned_to) {
      const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(lead.assigned_to);
      if (user && user.email) {
        sendMail(user.email, `New Follow-Up Scheduled: ${title}`, 'Upcoming Task Scheduled', `A new task "<strong>${title}</strong>" has been created for Lead "<strong>${lead.name}</strong>" due on ${due_date}.`, `http://localhost:5173/leads/${req.params.id}`, 'Open Lead Details');
      }
    }
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/tasks/:id/complete', async (req, res) => {
  try {
    await db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.prepare(`
            SELECT t.*, 
                   l.name as lead_name, 
                   d.title as deal_title 
            FROM tasks t 
            LEFT JOIN leads l ON t.lead_id = l.id 
            LEFT JOIN deals d ON t.deal_id = d.id 
            ORDER BY t.due_date ASC
        `).all();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/leads', async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    city,
    website,
    notes,
    source,
    status,
    lead_type,
    industry,
    service,
    address,
    pincode,
    state,
    country,
    tags,
    assigned_to
  } = req.body;
  const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Unnamed Lead';
  try {
    // Duplicate check by email or phone
    if (email) {
      const existingEmail = await db.prepare('SELECT id, name FROM leads WHERE email = ?').get(email);
      if (existingEmail) {
        return res.status(409).json({
          error: `Duplicate: A lead with email "${email}" already exists (${existingEmail.name}).`
        });
      }
    }
    if (phone) {
      const existingPhone = await db.prepare('SELECT id, name FROM leads WHERE phone = ?').get(phone);
      if (existingPhone) {
        return res.status(409).json({
          error: `Duplicate: A lead with phone "${phone}" already exists (${existingPhone.name}).`
        });
      }
    }
    const stmt = db.prepare('INSERT INTO leads (name, email, phone, company, job_title, city, website, notes, source, status, lead_type, industry, service, address, pincode, state, country, tags, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(name, email, phone, company, job_title, city, website, notes, source, status || 'New', lead_type || 'Calling', industry, service, address, pincode, state, country, tags, assigned_to || null);

    // --- NOTIFICATION HOOK ---
    createNotif(db, {
      title: `New Lead: ${name}`,
      body: `${name} was added${assigned_to ? ' and assigned.' : '.'}`,
      type: 'info',
      link: `/leads/${result.id}`
    });
    if (assigned_to) {
      const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(assigned_to);
      if (user && user.email) {
        sendMail(user.email, `New Lead Assigned: ${name}`, 'Lead Assignment', `You have been assigned a new Lead: <strong>${name}</strong>. Log in to start working on it!`, `http://localhost:5173/leads/${result.id}`, 'View Lead Profile');
      }
    }
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/leads/:id', async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    city,
    website,
    notes,
    source,
    status,
    lead_type,
    industry,
    service,
    address,
    pincode,
    state,
    country,
    tags,
    assigned_to
  } = req.body;
  const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Unnamed Lead';
  try {
    // Duplicate check excluding self
    if (email) {
      const dup = await db.prepare('SELECT id, name FROM leads WHERE email = ? AND id != ?').get(email, req.params.id);
      if (dup) return res.status(409).json({
        error: `Duplicate: Email "${email}" is already used by ${dup.name}.`
      });
    }
    if (phone) {
      const dup = await db.prepare('SELECT id, name FROM leads WHERE phone = ? AND id != ?').get(phone, req.params.id);
      if (dup) return res.status(409).json({
        error: `Duplicate: Phone "${phone}" is already used by ${dup.name}.`
      });
    }
    const oldLead = await db.prepare('SELECT assigned_to, name FROM leads WHERE id = ?').get(req.params.id);
    await db.prepare('UPDATE leads SET name=?, email=?, phone=?, company=?, job_title=?, city=?, website=?, notes=?, source=?, status=?, lead_type=?, industry=?, service=?, address=?, pincode=?, state=?, country=?, tags=?, assigned_to=? WHERE id=?').run(name, email, phone, company, job_title, city, website, notes, source, status, lead_type || 'Calling', industry, service, address, pincode, state, country, tags, assigned_to || null, req.params.id);

    // --- NOTIFICATION HOOK ---
    if (assigned_to && assigned_to !== oldLead?.assigned_to) {
      const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(assigned_to);
      if (user && user.email) {
        sendMail(user.email, `Lead Transferred to You: ${name}`, 'Lead Reassignment', `A lead has been transferred to your pipeline: <strong>${name}</strong>.`, `http://localhost:5173/leads/${req.params.id}`, 'View Lead Profile');
      }
    }
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/leads/bulk', async (req, res) => {
  const {
    leads: incoming
  } = req.body;
  try {
    const insert = db.prepare('INSERT INTO leads (name, email, phone, company, job_title, city, website, notes, source, status, lead_type, industry, service, address, pincode, state, country, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const checkEmail = db.prepare('SELECT id FROM leads WHERE email = ?');
    const checkPhone = db.prepare('SELECT id FROM leads WHERE phone = ?');
    let imported = 0;
    const duplicates = [];
    for (const lead of incoming) {
      let isDup = false;
      if (lead.email && await checkEmail.get(lead.email)) {
        isDup = true;
      }
      if (!isDup && lead.phone && await checkPhone.get(lead.phone)) {
        isDup = true;
      }
      if (isDup) {
        duplicates.push(lead.name || lead.email || lead.phone);
      } else {
        await insert.run(lead.name, lead.email, lead.phone, lead.company, lead.job_title, lead.city, lead.website, lead.notes, lead.source, lead.status || 'New', lead.lead_type || 'Calling', lead.industry, lead.service, lead.address, lead.pincode, lead.state, lead.country, lead.tags);
        imported++;
      }
    }
    res.status(201).json({
      success: true,
      imported,
      duplicates: duplicates.length,
      duplicateNames: duplicates.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// CSV Download
app.get('/api/leads/export', async (req, res) => {
  try {
    const {
      lead_type,
      status,
      source
    } = req.query;
    let query = 'SELECT name, email, phone, company, job_title, city, website, notes, source, status, lead_type, industry, service, address, pincode, state, country, tags, created_at FROM leads WHERE 1=1';
    const params = [];
    if (lead_type && lead_type !== 'All') {
      query += ' AND lead_type = ?';
      params.push(lead_type);
    }
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (source && source !== 'All') {
      query += ' AND source = ?';
      params.push(source);
    }
    query += ' ORDER BY created_at DESC';
    const rows = await db.prepare(query).all(...params);
    let csv = 'Name,Email,Phone,Company,Job Title,City,Website,Notes,Source,Status,Channel,Industry,Service,Address,Pincode,State,Country,Tags,Date Added\n';
    for (const r of rows) {
      csv += `"${r.name || ''}","${r.email || ''}","${r.phone || ''}","${r.company || ''}","${r.job_title || ''}","${r.city || ''}","${r.website || ''}","${(r.notes || '').replace(/"/g, '""')}","${r.source || ''}","${r.status || ''}","${r.lead_type || ''}","${r.industry || ''}","${r.service || ''}","${(r.address || '').replace(/"/g, '""')}","${r.pincode || ''}","${r.state || ''}","${r.country || ''}","${r.tags || ''}","${r.created_at || ''}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/leads/:id', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const id = req.params.id;
    // Delete tasks linked to this lead
    await db.prepare('DELETE FROM tasks WHERE lead_id = ?').run(id);
    // Delete activities linked to this lead
    await db.prepare('DELETE FROM activities WHERE lead_id = ?').run(id);
    // Delete deal-level records for deals linked to this lead
    const deals = await db.prepare('SELECT id FROM deals WHERE lead_id = ?').all(id);
    for (const deal of deals) {
      await db.prepare('DELETE FROM tasks WHERE deal_id = ?').run(deal.id);
      await db.prepare('DELETE FROM activities WHERE deal_id = ?').run(deal.id);
      try {
        await db.prepare('DELETE FROM deal_stage_history WHERE deal_id = ?').run(deal.id);
      } catch (_) {}
    }
    // Delete deals linked to this lead
    await db.prepare('DELETE FROM deals WHERE lead_id = ?').run(id);
    // Finally delete the lead
    await db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.json({
      success: true
    });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({
      error: err.message
    });
  }
});

// Deals
app.get('/api/deals', authenticate, async (req, res) => {
  try {
    let sql = `
            SELECT d.*, l.name as lead_name, l.company as lead_company 
            FROM deals d 
            LEFT JOIN leads l ON d.lead_id = l.id 
        `;
    const params = [];
    if (req.user.role === 'Agent') {
      sql += ' WHERE l.assigned_to = ? ';
      params.push(req.user.id);
    }
    sql += ' ORDER BY d.created_at DESC';
    const deals = await db.prepare(sql).all(...params);
    res.json(deals);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/deals', async (req, res) => {
  const {
    title,
    value,
    stage,
    lead_id,
    expected_close
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO deals (title, value, stage, lead_id, expected_close) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(title, value, stage || 'Discovery', lead_id, expected_close);
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.put('/api/deals/:id', async (req, res) => {
  const {
    title,
    value,
    stage,
    expected_close,
    lead_id,
    notes,
    priority
  } = req.body;
  try {
    const existing = await db.prepare('SELECT stage, title, lead_id FROM deals WHERE id=?').get(req.params.id);
    await db.prepare('UPDATE deals SET title=COALESCE(?, title), value=COALESCE(?, value), stage=COALESCE(?, stage), expected_close=COALESCE(?, expected_close), lead_id=COALESCE(?, lead_id), notes=COALESCE(?, notes), priority=COALESCE(?, priority) WHERE id=?').run(title, value, stage, expected_close, lead_id, notes, priority, req.params.id);
    // Record stage change in history
    if (stage && existing && existing.stage !== stage) {
      await db.prepare('INSERT INTO deal_stage_history (deal_id, from_stage, to_stage) VALUES (?, ?, ?)').run(req.params.id, existing.stage, stage);

      // --- IN-APP NOTIFICATION HOOK ---
      const notifType = stage === 'Won' ? 'success' : stage === 'Lost' ? 'warning' : 'info';
      createNotif(db, {
        title: stage === 'Won' ? `🎉 Deal Won: ${existing.title}` : stage === 'Lost' ? `Deal Lost: ${existing.title}` : `Deal moved to ${stage}`,
        body: `Stage changed from ${existing.stage} → ${stage}`,
        type: notifType,
        link: `/deals/${req.params.id}`
      });
      const leadOwner = await db.prepare('SELECT assigned_to FROM leads WHERE id = ?').get(existing.lead_id);
      if (leadOwner && leadOwner.assigned_to) {
        const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(leadOwner.assigned_to);
        if (user && user.email) {
          sendMail(user.email, `Deal Stage Change: ${existing.title}`, 'Deal Pipeline Update', `Your deal "<strong>${existing.title}</strong>" has been moved from <em>${existing.stage}</em> to <strong style="color: #3b82f6;">${stage}</strong>.`, `http://localhost:5173/deals`, 'View Pipeline');
        }
      }
    }
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.delete('/api/deals/:id', authenticate, requireRole(['Admin', 'Manager']), async (req, res) => {
  try {
    await db.prepare('DELETE FROM deals WHERE id=?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Single Deal Details
app.get('/api/deals/:id', async (req, res) => {
  try {
    const deal = await db.prepare('SELECT * FROM deals WHERE id=?').get(req.params.id);
    if (!deal) return res.status(404).json({
      error: 'Not found'
    });
    if (deal.lead_id) {
      deal.lead = await db.prepare('SELECT id, name, company, email, phone, lead_type, industry, service FROM leads WHERE id=?').get(deal.lead_id);
    }
    res.json(deal);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ── QUOTE / PROPOSAL PUBLIC LINKS ──
const crypto = require('crypto');
app.post('/api/deals/:id/quote', authenticate, async (req, res) => {
  try {
    const dealId = req.params.id;
    const {
      items_json,
      total_value
    } = req.body;
    let token = (await db.prepare('SELECT quote_token FROM deals WHERE id=?').get(dealId))?.quote_token;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
    }
    await db.prepare('UPDATE deals SET quote_token=?, quote_items=?, quote_status=?, value=? WHERE id=?').run(token, JSON.stringify(items_json), 'Pending', total_value, dealId);
    res.json({
      success: true,
      token,
      url: `http://localhost:5173/quote/${token}`
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.get('/api/quote/:token', async (req, res) => {
  try {
    const deal = await db.prepare('SELECT id, title, value, quote_items, quote_status, lead_id FROM deals WHERE quote_token=?').get(req.params.token);
    if (!deal) return res.status(404).json({
      error: 'Invalid or expired quote link.'
    });
    const lead = await db.prepare('SELECT name, company, email FROM leads WHERE id=?').get(deal.lead_id);
    res.json({
      deal,
      lead
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/quote/:token/accept', async (req, res) => {
  try {
    const deal = await db.prepare('SELECT id, lead_id, title FROM deals WHERE quote_token=?').get(req.params.token);
    if (!deal) return res.status(404).json({
      error: 'Invalid or expired quote link.'
    });

    // 1. Mark Quote Accepted (DO NOT CHANGE STAGE)
    await db.prepare("UPDATE deals SET quote_status='Accepted' WHERE id=?").run(deal.id);

    // 2. Add Activity Log to Deal
    await db.prepare("INSERT INTO activities (lead_id, type, description, deal_id) VALUES (?, ?, ?, ?)").run(deal.lead_id, 'Quote Checked', `The client securely accepted the quote. Please finalize.`, deal.id);
    res.json({
      success: true,
      message: 'Quote accepted successfully. Thank you!'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Deal Tasks
app.get('/api/deals/:id/tasks', async (req, res) => {
  try {
    const tasks = await db.prepare('SELECT * FROM tasks WHERE deal_id=? ORDER BY due_date ASC').all(req.params.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/deals/:id/tasks', async (req, res) => {
  const {
    title,
    due_date
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO tasks (title, due_date, deal_id) VALUES (?, ?, ?)');
    const result = stmt.run(title, due_date, req.params.id);
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Stage History
app.get('/api/deals/:id/stage-history', async (req, res) => {
  try {
    const history = await db.prepare('SELECT * FROM deal_stage_history WHERE deal_id=? ORDER BY changed_at ASC').all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Delete Activity
app.delete('/api/activities/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM activities WHERE id=?').run(req.params.id);
    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Deal Activities
app.get('/api/deals/:id/activities', async (req, res) => {
  try {
    const activities = await db.prepare('SELECT * FROM activities WHERE deal_id=? ORDER BY created_at DESC').all(req.params.id);
    res.json(activities);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.post('/api/deals/:id/activities', async (req, res) => {
  const {
    type,
    description
  } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO activities (deal_id, type, description) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, type || 'Note', description);
    res.status(201).json({
      id: result.id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
const {
  google
} = require('googleapis');
const {
  backup,
  uploadToDrive
} = require('./googleDrive');
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

// Auth URL
app.get('/api/auth/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('GET_FROM_GOOGLE')) {
    return res.status(400).json({
      error: "Missing Google Client ID. Update your backend/.env file."
    });
  }
  if (!process.env.GOOGLE_REDIRECT_URI) {
    return res.status(400).json({
      error: "Missing Redirect URI. Update your backend/.env file."
    });
  }
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  res.json({
    url
  });
});

// Callback
app.get('/api/auth/callback', async (req, res) => {
  const {
    code
  } = req.query;
  try {
    const {
      tokens
    } = await oauth2Client.getToken(code);
    // In a real prod app, you'd save this to the DB for the user
    // For this local version, we'll store it in the db's users table (Admin)
    await db.prepare('UPDATE users SET googleToken = ? WHERE email = ?').run(JSON.stringify(tokens), 'admin@example.com');
    res.send('Authentication successful! You can close this tab and return to the CRM.');
  } catch (err) {
    res.status(500).send('Error authenticating: ' + err.message);
  }
});

// Update /api/backup to use real logic
app.post('/api/backup', async (req, res) => {
  try {
    const user = await db.prepare('SELECT googleToken FROM users WHERE email = ?').get('admin@example.com');
    if (!user || !user.googleToken) {
      return res.status(401).json({
        error: "Google Drive not connected. Please authenticate first."
      });
    }
    oauth2Client.setCredentials(JSON.parse(user.googleToken));
    const filePath = await backup();
    const fileId = await uploadToDrive(oauth2Client, filePath);
    res.json({
      message: "Backup successfully uploaded to Google Drive.",
      fileId
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Serve static frontend files
const path = require('path');
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for React Router
app.get('*', async (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.listen(port, '0.0.0.0', () => {
  console.log(`CRM Backend running at http://0.0.0.0:${port}`);
  console.log('--- Ready for requests ---');

  // --- CRON JOBS FOR SCHEDULED MAILS ---
  // Runs every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running Daily Due Reminders check...');
    try {
      const pendingTasks = await db.prepare("SELECT t.*, l.name as lead_name, l.assigned_to FROM tasks t JOIN leads l ON t.lead_id = l.id WHERE t.completed = 0 AND date(t.due_date) <= date('now')").all();
      const notificationMap = {};
      for (let t of pendingTasks) {
        if (t.assigned_to) {
          if (!notificationMap[t.assigned_to]) notificationMap[t.assigned_to] = [];
          notificationMap[t.assigned_to].push(t);
        }
      }
      for (let userId in notificationMap) {
        const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
        if (user && user.email) {
          const dueCount = notificationMap[userId].length;
          let taskListHTML = notificationMap[userId].map(x => `<li style="margin-bottom: 8px;"><strong>${x.title}</strong> (Lead: ${x.lead_name}) <br/><span style="color: #ef4444; font-size: 13px;">Due: ${x.due_date}</span></li>`).join("");
          sendMail(user.email, `Daily Digest: ${dueCount} Tasks Overdue or Due Today`, `Action Required: Daily Task Digest`, `Hello ${user.name},<br/><br/>You have <strong style="color: #ef4444;">${dueCount}</strong> important follow-ups / tasks that require immediate attention today:<br/><br/><ul>${taskListHTML}</ul><br/>Please log in to your CRM dashboard to complete them and keep your pipeline clean!`, 'http://localhost:5173/tasks', 'Open Tasks Dashboard');
        }
      }
      // Also create in-app notifications for overdue tasks
      for (let t of pendingTasks) {
        createNotif(db, {
          title: `⏰ Overdue: ${t.title}`,
          body: `Follow-up for ${t.lead_name} was due ${t.due_date}`,
          type: 'warning',
          link: `/leads/${t.lead_id}`
        });
      }
    } catch (err) {
      console.error('[Cron] Error running daily reminders:', err);
    }
  });
});
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});