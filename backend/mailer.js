const nodemailer = require('nodemailer');

let transporter;

async function initMailer() {
   try {
      // Use Ethereal for testing beautifully without needing real SMTP credentials!
      // This allows the user to click the Preview URL in the console immediately.
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
         host: "smtp.ethereal.email",
         port: 587,
         secure: false, // true for 465, false for other ports
         auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
         },
      });
      console.log(`\n=======================================\n[Mailer] 📧 Ethereal Email Ready: ${testAccount.user}\n=======================================\n`);
   } catch (e) {
      console.error("[Mailer] Failed to init Ethereal: ", e);
   }
}

initMailer();

function getEmailTemplate(title, message, linkUrl, linkText) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
            .header { background: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #3b82f6; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .content { padding: 40px 32px; color: #334155; line-height: 1.6; font-size: 16px; }
            .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0; }
            .message { margin-bottom: 0; font-size: 16px; color: #475569; }
            .btn { display: inline-block; padding: 14px 28px; background: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s; }
            .btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
            .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
            .highlight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px; }
        </style>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc"><tr><td align="center">
        <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left;">
            <div class="header" style="background: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #3b82f6;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">💎 Aura CRM System</h1>
            </div>
            <div class="content" style="padding: 40px 32px; color: #334155; line-height: 1.6; font-size: 16px;">
                <h2 class="title" style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0;">${title}</h2>
                <div class="highlight" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                   <p class="message" style="margin:0; font-size: 16px; color: #475569;">${message}</p>
                </div>
                ${linkUrl ? `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td align="center"><a href="${linkUrl}" class="btn" style="display: inline-block; padding: 14px 28px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">${linkText || 'View in CRM'}</a></td></tr></table>` : ''}
                <p style="margin-top: 30px; font-size: 14px; color: #94a3b8;">If you believe you received this by mistake, please ignore.</p>
            </div>
            <div class="footer" style="background: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0;">This is an automated notification from your Aura CRM workspace.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Aura CRM. All rights reserved.</p>
            </div>
        </div>
        </td></tr></table>
    </body>
    </html>
    `;
}

async function sendMail(to, subject, title, msgHTML, linkUrl = null, linkText = null) {
    if (!transporter) return;
    try {
        const info = await transporter.sendMail({
            from: '"Aura CRM 🚀" <noreply@auracrm.local>',
            to,
            subject,
            html: getEmailTemplate(title, msgHTML, linkUrl, linkText)
        });
        console.log(`\n--- 🔔 CRM NOTIFICATION DISPATCHED ---`);
        console.log(`To: ${to} | Subject: ${subject}`);
        console.log(`Preview Email beautifully in browser: ${nodemailer.getTestMessageUrl(info)}`);
        console.log(`--------------------------------------\n`);
    } catch (e) {
        console.error("[Mailer] Send Error: ", e);
    }
}

module.exports = { sendMail };
