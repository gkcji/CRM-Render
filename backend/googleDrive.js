const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function uploadToDrive(auth, filePath) {
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
        name: `crm-backup-${new Date().toISOString()}.json`,
    };
    const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(filePath),
    };
    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    } catch (err) {
        throw err;
    }
}

async function backup() {
    // 1. Export DB to JSON
    const data = {
        leads: db.prepare('SELECT * FROM leads').all(),
        deals: db.prepare('SELECT * FROM deals').all(),
        users: db.prepare('SELECT * FROM users').all(),
        tasks: db.prepare('SELECT * FROM tasks').all(),
    };
    const exportPath = path.join(__dirname, 'temp_backup.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    // 2. Upload to Drive (Requires Auth)
    // For a fully "Production ready" local CRM, we'll need an OAuth flow.
    // I'll provide the helper but won't trigger it without valid credentials.
    return exportPath;
}

module.exports = { backup, uploadToDrive };
