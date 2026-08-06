export type EmailEventType =
  | "welcome"
  | "verify_email"
  | "forgot_password"
  | "password_changed"
  | "new_device_login"
  | "contest_registration"
  | "contest_reminder"
  | "contest_result"
  | "assignment_published"
  | "assignment_deadline"
  | "course_enrollment"
  | "certificate_earned"
  | "achievement_unlocked"
  | "project_featured"
  | "weekly_report"
  | "monthly_report"
  | "daily_digest"
  | "account_deletion";

export interface TemplateData {
  userName?: string;
  actionUrl?: string;
  title?: string;
  details?: string;
  metrics?: Record<string, any>;
}

export function generateBaseEmailLayout(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #070913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
    .card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .logo { font-size: 24px; font-weight: 900; background: linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #8b5cf6; text-decoration: none; margin-bottom: 24px; display: inline-block; }
    .header { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #ec4899, #8b5cf6); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 14px; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.4); text-align: center; }
    .stat-box { background-color: #070913; border: 1px solid #334155; border-radius: 16px; padding: 16px; margin-bottom: 20px; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 32px; line-height: 1.5; }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <a href="https://campus-code-virid.vercel.app" class="logo">CampusCode 🚀</a>
      ${contentHtml}
    </div>
    <div class="footer">
      <p>© 2026 CampusCode Platform. All rights reserved.</p>
      <p>Need support? Contact us at <a href="mailto:team18.web@gmail.com">team18.web@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderEmailTemplate(eventType: EmailEventType, data: TemplateData): { subject: string; html: string } {
  const name = data.userName || "Developer";

  switch (eventType) {
    case "welcome":
      return {
        subject: "Welcome to CampusCode! 🚀 Start Coding Today",
        html: generateBaseEmailLayout(
          "Welcome to CampusCode",
          `<h2 class="header">Welcome aboard, ${name}! 👋</h2>
           <p class="text">CampusCode is your ultimate college coding platform. Solve LeetCode-grade DSA problems, join live contests, showcase GitHub projects, and get placed at top tech companies.</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/dashboard"}" class="btn">Explore Dashboard</a>`
        ),
      };

    case "verify_email":
      return {
        subject: "Verify your CampusCode Email Address",
        html: generateBaseEmailLayout(
          "Verify Email",
          `<h2 class="header">Verify your account email</h2>
           <p class="text">Please click the button below to verify your email address and activate your CampusCode account.</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/auth"}" class="btn">Verify Email Address</a>`
        ),
      };

    case "forgot_password":
      return {
        subject: "Reset your CampusCode Password",
        html: generateBaseEmailLayout(
          "Password Reset",
          `<h2 class="header">Password Reset Request</h2>
           <p class="text">We received a request to reset your password. Click below to create a new password. If you didn't request this, ignore this email.</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/auth"}" class="btn">Reset Password</a>`
        ),
      };

    case "contest_registration":
      return {
        subject: `Registered for Contest: ${data.title || "Weekly Coding Contest"} 🏆`,
        html: generateBaseEmailLayout(
          "Contest Registration",
          `<h2 class="header">Contest Registration Confirmed! 🏆</h2>
           <p class="text">You are registered for <strong>${data.title || "Weekly Contest"}</strong>. Prepare your IDE and get ready to compete!</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/contests"}" class="btn">View Contest Details</a>`
        ),
      };

    case "certificate_earned":
      return {
        subject: `Congratulations! Course Certificate Earned 🎓`,
        html: generateBaseEmailLayout(
          "Certificate Earned",
          `<h2 class="header">Course Certificate Issued! 🎓</h2>
           <p class="text">Great job, ${name}! You have successfully completed <strong>${data.title || "Full Stack Web Development"}</strong>. Your verified certificate is ready to share on LinkedIn.</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/certificates"}" class="btn">View Certificate</a>`
        ),
      };

    case "achievement_unlocked":
      return {
        subject: `New Achievement Unlocked: ${data.title || "Streak Master"} 🎉`,
        html: generateBaseEmailLayout(
          "Achievement Unlocked",
          `<h2 class="header">Achievement Unlocked! 🎉</h2>
           <p class="text">You unlocked the <strong>${data.title || "Badge"}</strong> achievement and earned bonus XP!</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/dashboard"}" class="btn">Check Profile XP</a>`
        ),
      };

    case "daily_digest":
      return {
        subject: `Your CampusCode Daily Coding Digest 📈`,
        html: generateBaseEmailLayout(
          "Daily Digest",
          `<h2 class="header">Daily Summary for ${name} 📈</h2>
           <div class="stat-box">
             <p style="margin:0; color:#cbd5e1; font-size:13px;">${data.details || "2 Problems Solved • 1 Contest Registered • +100 XP Gained"}</p>
           </div>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app/dashboard"}" class="btn">Keep Coding</a>`
        ),
      };

    default:
      return {
        subject: `${data.title || "CampusCode Platform Notification"}`,
        html: generateBaseEmailLayout(
          data.title || "Notification",
          `<h2 class="header">${data.title || "Notification"}</h2>
           <p class="text">${data.details || "You have a new notification on CampusCode."}</p>
           <a href="${data.actionUrl || "https://campus-code-virid.vercel.app"}" class="btn">Open CampusCode</a>`
        ),
      };
  }
}
