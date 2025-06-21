import Mailgen from "mailgen";



export const sendEmail = async (options) => {

    const { mailer } = options.fastify;

    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Gobinda Das",
            link: "https://localhost:4000",
        },
    });


    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

    const emailHtml = mailGenerator.generate(options.mailgenContent);


    const mail = {
        from: process.env.SMTP_SENDER_EMAIL, // We can name this anything. The mail will go to your Mailtrap inbox
        to: options.email, // receiver's mail
        subject: options.subject, // mail subject
        text: emailTextual, // mailgen content textual variant
        html: emailHtml, // mailgen content html variant
    };

    try {
        await mailer.sendMail(mail);
    } catch (error) {
        console.error(error);
        throw new Error(error || "Error sending email");
    }
};




export const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: [
                `Welcome to ${process.env.APP_NAME || "SocialConnect"}! 🎉`,
                "We're thrilled to have you join our community of creators, thinkers, and innovators. Your journey to connect with the world starts here."
            ],
            action: {
                instructions: [
                "To get started and secure your account, please verify your email address by clicking the button below:",
                "This verification helps us ensure the security of your account and enables all platform features."
                ],
                button: {
                color: "#1DA1F2", // Twitter-like blue
                text: "Verify Email Address",
                link: verificationUrl,
                },
            },
            table: {
                data: [
                    {
                        item: "Account Security",
                        description: "Email verification protects your account from unauthorized access"
                    },
                    {
                        item: "Full Access",
                        description: "Unlock all features including posting, following, and notifications"
                    },
                    {
                        item: "Recovery Options",
                        description: "Enable account recovery and password reset capabilities"
                    }
                ],
                columns: {
                    // Optionally, customize the column widths
                    customWidth: {
                        item: "25%",
                        description: "75%"
                    }
                }
            },
            action2: {
                instructions: "If the button above doesn't work, copy and paste this link into your browser:",
                button: {
                    color: "#6C757D", // Secondary gray color
                    text: verificationUrl,
                    link: verificationUrl,
                },
            },
            outro: [
                "This verification link will expire in 24 hours for security reasons.",
                "If you didn't create this account, please ignore this email or contact our support team.",
                "Welcome aboard! We can't wait to see what you'll share with the world. 🚀"
            ],
            signature: "The Team"
        }
    };
};