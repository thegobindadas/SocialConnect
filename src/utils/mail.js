

export const sendResetPasswordEmail = async (fastify, username, email, resetToken) => {
    try {

        const { mailer } = fastify

        const verificationLink = `${process.env.RESET_PASSWORD_REDIRECT_URL}?token=${resetToken}`;
       

        const mailOptions = {
            from: String(process.env.SMTP_SENDER_EMAIL),
            to: email,
            subject: "Reset Your Password",
            html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset - SocialConnect</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f5f7fa;
                            margin: 0;
                            padding: 20px;
                        }

                        .email-wrapper {
                            max-width: 600px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                            overflow: hidden;
                        }

                        .header {
                            background-color: #4f46e5;
                            padding: 30px 20px;
                            text-align: center;
                            color: #ffffff;
                        }

                        .brand-name {
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                        }

                        .content {
                            padding: 30px 20px;
                            color: #333333;
                        }

                        .content h2 {
                            font-size: 20px;
                            margin-bottom: 10px;
                            color: #2d3748;
                        }

                        .content p {
                            font-size: 14px;
                            margin-bottom: 15px;
                            color: #555555;
                            line-height: 1.6;
                        }

                        .cta-button {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #4f46e5;
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            margin-top: 20px;
                        }

                        .cta-button:hover {
                            background-color: #4338ca;
                        }

                        .alternative-link {
                            margin-top: 20px;
                            font-size: 12px;
                            color: #777777;
                            word-break: break-word;
                        }

                        .footer {
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                            color: #999999;
                            border-top: 1px solid #eeeeee;
                        }

                        .footer a {
                            color: #4f46e5;
                            text-decoration: none;
                        }

                        .footer a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-wrapper">
                        <div class="header">
                            <div class="brand-name">SocialConnect</div>
                        </div>

                        <div class="content">
                            <h2>Password Reset Request</h2>
                            <p>Hello ${username},</p>
                            <p>We received a request to reset your SocialConnect password. To proceed, please click the button below:</p>

                            <p style="text-align: center;">
                                <a href="${verificationLink}" class="cta-button">Reset Password</a>
                            </p>

                            <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
                            <p class="alternative-link">${verificationLink}</p>

                            <p>If you didn’t request this, please ignore this email. This link will expire in 24 hours.</p>

                            <p>Best regards,<br>The SocialConnect Team</p>
                        </div>

                        <div class="footer">
                            <p>&copy; 2025 SocialConnect. All rights reserved.</p>
                            <p>
                                <a href="{{websiteUrl}}">Website</a> |
                                <a href="{{privacyPolicyUrl}}">Privacy Policy</a> |
                                <a href="{{contactUrl}}">Contact</a>
                            </p>
                        </div>
                    </div>
                </body>
            </html>`
        }


        const mailResponse = await mailer.sendMail(mailOptions);



        return mailResponse;

    } catch (error) {
        throw new Error(error);
    }
}


export const sendResetPasswordSuccessEmail = async (fastify, username, email) => {
    try {

        const { mailer } = fastify


        const mailOptions = {
            from: String(process.env.SMTP_SENDER_EMAIL),
            to: email,
            subject: "Password Reset Successful",
            html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Successful - SocialConnect</title>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    background-color: #f5f7fa;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    }

                    .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    overflow: hidden;
                    }

                    .header {
                    background-color: #22c55e;
                    padding: 30px 20px;
                    text-align: center;
                    color: #ffffff;
                    }

                    .brand-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0;
                    }

                    .content {
                    padding: 30px 20px;
                    }

                    .content h2 {
                    font-size: 20px;
                    margin-bottom: 10px;
                    color: #2d3748;
                    }

                    .content p {
                    font-size: 14px;
                    margin-bottom: 15px;
                    color: #555;
                    line-height: 1.6;
                    }

                    .footer {
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #999;
                    border-top: 1px solid #eee;
                    }

                    .footer a {
                    color: #4f46e5;
                    text-decoration: none;
                    }

                    .footer a:hover {
                    text-decoration: underline;
                    }
                </style>
                </head>
                <body>
                <div class="email-wrapper">
                    <div class="header">
                    <div class="brand-name">SocialConnect</div>
                    </div>

                    <div class="content">
                    <h2>Password Successfully Reset</h2>
                    <p>Hello ${username},</p>

                    <p>We wanted to let you know that your password for your SocialConnect account was successfully changed. If this was you, no further action is needed.</p>

                    <p>If you did <strong>not</strong> perform this action, please reset your password immediately or contact our support team.</p>

                    <p>Stay safe,<br>The SocialConnect Team</p>
                    </div>

                    <div class="footer">
                    <p>&copy; 2025 SocialConnect. All rights reserved.</p>
                    <p>
                        <a href="{{websiteUrl}}">Website</a> |
                        <a href="{{privacyPolicyUrl}}">Privacy Policy</a> |
                        <a href="{{contactUrl}}">Contact</a>
                    </p>
                    </div>
                </div>
                </body>
            </html>`
        }


        const mailResponse = await mailer.sendMail(mailOptions);



        return mailResponse;

    } catch (error) {
        throw new Error(error);
    }
}