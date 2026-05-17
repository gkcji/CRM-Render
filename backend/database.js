const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
    prepare: (sql) => {
        let index = 1;
        let pgSql = sql.replace(/\?/g, () => `$${index++}`);
        
        // Auto append RETURNING id for inserts if not present
        if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
        }
        // Fix SQLite specific COALESCE syntax differences if any, usually fine
        
        return {
            get: async (...args) => {
                const res = await pool.query(pgSql, args);
                return res.rows[0];
            },
            all: async (...args) => {
                const res = await pool.query(pgSql, args);
                return res.rows;
            },
            run: async (...args) => {
                const res = await pool.query(pgSql, args);
                return { id: res.rows[0] ? res.rows[0].id : null, changes: res.rowCount };
            }
        };
    },
    transaction: (callback) => {
        return async (...args) => {
            // Simplified transaction: in a full driver we'd pass the client
            return await callback(...args);
        };
    },
    exec: async (sql) => {
        return await pool.query(sql);
    }
};

// Initialize schema for Postgres
async function initDb() {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            googleToken TEXT,
            role TEXT DEFAULT 'Agent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            company TEXT,
            job_title TEXT,
            city TEXT,
            website TEXT,
            notes TEXT,
            industry TEXT,
            service TEXT,
            address TEXT,
            pincode TEXT,
            state TEXT,
            country TEXT,
            tags TEXT,
            source TEXT,
            status TEXT DEFAULT 'New',
            lead_type TEXT DEFAULT 'Calling',
            assigned_to INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(assigned_to) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS deals (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            value REAL,
            stage TEXT DEFAULT 'Discovery',
            lead_id INTEGER,
            notes TEXT,
            priority TEXT DEFAULT 'Medium',
            quote_token TEXT,
            quote_items TEXT,
            quote_status TEXT DEFAULT 'Pending',
            expected_close TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(lead_id) REFERENCES leads(id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            completed BOOLEAN DEFAULT false,
            due_date TIMESTAMP,
            deal_id INTEGER,
            lead_id INTEGER,
            FOREIGN KEY(deal_id) REFERENCES deals(id),
            FOREIGN KEY(lead_id) REFERENCES leads(id)
        );

        CREATE TABLE IF NOT EXISTS activities (
            id SERIAL PRIMARY KEY,
            lead_id INTEGER,
            deal_id INTEGER,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(lead_id) REFERENCES leads(id)
        );

        CREATE TABLE IF NOT EXISTS deal_stage_history (
            id SERIAL PRIMARY KEY,
            deal_id INTEGER NOT NULL,
            from_stage TEXT,
            to_stage TEXT NOT NULL,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(deal_id) REFERENCES deals(id)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS custom_fields (
            id SERIAL PRIMARY KEY,
            label TEXT NOT NULL,
            field_key TEXT NOT NULL UNIQUE,
            field_type TEXT NOT NULL DEFAULT 'text',
            entity_type TEXT NOT NULL DEFAULT 'lead',
            options TEXT,
            required BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_field_values (
            id SERIAL PRIMARY KEY,
            field_id INTEGER NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            value TEXT,
            FOREIGN KEY(field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
            UNIQUE(field_id, entity_type, entity_id)
        );

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT,
            description TEXT,
            price REAL DEFAULT 0,
            billing_freq TEXT DEFAULT 'One-Time',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_templates (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            title TEXT NOT NULL,
            body TEXT,
            type TEXT DEFAULT 'info',
            link TEXT,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Insert default data if users table is empty
    const usersCount = (await db.prepare('SELECT count(*) as count FROM users').get()).count;
    if (usersCount == 0) {
        const bcrypt = require('bcryptjs');
        const defaultHash = bcrypt.hashSync('password', 10);
        await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin User', 'admin@example.com', defaultHash, 'Admin');
        await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Sales Agent', 'agent@example.com', defaultHash, 'Agent');
    }
}

initDb().catch(console.error);

module.exports = db;
