import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your Setu account ✨",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a1a; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width: 460px; width: 100%;">
                  
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background: linear-gradient(135deg, #6366f1, #818cf8); border-radius: 14px; padding: 10px 14px; display: inline-block;">
                            <span style="font-size: 18px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;">💬</span>
                          </td>
                          <td style="padding-left: 12px;">
                            <span style="font-size: 28px; font-weight: 800; color: #818cf8; letter-spacing: -1px;">Setu</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Card -->
                  <tr>
                    <td style="background: linear-gradient(145deg, #13132d 0%, #1a1a3e 50%, #141430 100%); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.15); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.05);">
                      
                      <!-- Purple accent bar -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #818cf8, #a78bfa); border-radius: 20px 20px 0 0;"></td>
                        </tr>
                      </table>

                      <!-- Content -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 44px 40px 40px;">
                        <tr>
                          <td>
                            <!-- Greeting -->
                            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">
                              Hey ${firstName}! 👋
                            </h1>
                            <p style="margin: 0 0 28px; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                              Welcome to <strong style="color: #c7d2fe;">Setu</strong> — your new home for seamless conversations. Just one quick step to get started.
                            </p>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                              <tr>
                                <td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);"></td>
                              </tr>
                            </table>

                            <!-- Icon + Message -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                              <tr>
                                <td align="center">
                                  <div style="width: 64px; height: 64px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; border: 2px solid rgba(99, 102, 241, 0.2); line-height: 64px; text-align: center; font-size: 28px; margin: 0 auto 16px;">
                                    ✉️
                                  </div>
                                  <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                                    Click the button below to verify your email address
                                  </p>
                                </td>
                              </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                              <tr>
                                <td align="center">
                                  <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(129, 140, 248, 0.2); mso-padding-alt: 0;">
                                    <!--[if mso]><i style="mso-font-width:300%;mso-text-raise:30" hidden>&emsp;</i><![endif]-->
                                    Verify My Email
                                    <!--[if mso]><i style="mso-font-width:300%" hidden>&emsp;&#8203;</i><![endif]-->
                                  </a>
                                </td>
                              </tr>
                            </table>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                              <tr>
                                <td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent);"></td>
                              </tr>
                            </table>

                            <!-- Fallback Link -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.1); border-radius: 10px; padding: 14px 18px;">
                                  <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                    Or copy this link
                                  </p>
                                  <p style="margin: 0; font-size: 12px; color: #a78bfa; word-break: break-all; line-height: 1.5;">
                                    ${verificationUrl}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 28px 20px 0; text-align: center;">
                      <p style="margin: 0 0 6px; font-size: 12px; color: #cbd5e1;">
                        ⏰ This link expires in <strong style="color: #c7d2fe;">10 minutes</strong>
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                        Didn't create a Setu account? You can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Brand footer -->
                  <tr>
                    <td style="padding: 32px 20px 0; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                        Made with 💜 by the Setu team
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

