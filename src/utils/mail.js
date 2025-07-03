import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({  
    host: process.env.SMTP_MAIL_HOST,
    port: Number(process.env.SMTP_MAIL_PORT),
    auth: {
        user: process.env.SMTP_MAIL_USERNAME,
        pass: process.env.SMTP_MAIL_PASSWORD
    }
});



export const sendResetPasswordEmail = async (username, email, resetToken) => {
    try {

        const verificationLink = `${process.env.RESET_PASSWORD_REDIRECT_URL}?token=${resetToken}`;
       

        const mailOptions = {
            from: String(process.env.SMTP_SENDER_EMAIL),
            to: email,
            subject: "Reset Your Password",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${"Reset Your Password"}</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 20px 0;
                            border-bottom: 1px solid #eeeeee;
                        }
                        .logo {
                            max-width: 150px;
                            height: auto;
                        }
                        .content {
                            padding: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #4f46e5;
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 4px;
                            font-weight: 600;
                            margin: 20px 0;
                        }
                        .button:hover {
                            background-color: #4338ca;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                            color: #666666;
                            border-top: 1px solid #eeeeee;
                        }
                        h1 {
                            color: #111827;
                            margin-top: 0;
                        }
                        p {
                            margin-bottom: 16px;
                        }
                        .code {
                            font-family: monospace;
                            font-size: 24px;
                            letter-spacing: 4px;
                            padding: 10px 15px;
                            background: #f3f4f6;
                            border-radius: 4px;
                            display: inline-block;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <!-- Replace with your logo -->
                            <img src="https://yourwebsite.com/logo.png" alt="Company Logo" class="logo">
                        </div>
                        
                        <div class="content">
                            <h1>${"Reset Your Password"}</h1>
                            <p>Hello ${username},</p>
                            <p>
                                ${"We received a request to reset your password. If you made this request, please click the button below to set a new password:"}
                            </p>
                            
                            <div style="text-align: center;">
                                <a href="${verificationLink}" class="button">
                                    ${"Reset Password"}
                                </a>
                            </div>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p><a href="${verificationLink}">Verification Link</a></p>
                            
                            
                            <p>
                                ${"If you didn’t request a password reset, you can safely ignore this email."}
                            </p>
                            
                            <p>Best regards,<br>The gobindaDas Team</p>
                        </div>
                        
                        <div class="footer">
                            <p>&copy; 2025 gobindaDas. All rights reserved.</p>
                            <p>
                                <a href="{{websiteUrl}}">Our Website</a> | 
                                <a href="{{privacyPolicyUrl}}">Privacy Policy</a> | 
                                <a href="{{contactUrl}}">Contact Us</a>
                            </p>
                        </div>
                    </div>
                </body>
            </html>`
        }


        const mailResponse = await transporter.sendMail(mailOptions);



        return mailResponse;

    } catch (error) {
        throw new Error(error.message);
    }
}