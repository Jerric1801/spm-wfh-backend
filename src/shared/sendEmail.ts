import { MailtrapClient } from 'mailtrap';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

export interface ReciepientEmailParams {
    Staff_FName: string;
    Staff_LName: string;
    Email: string;
}

export interface EmailParams {
    user: ReciepientEmailParams;
    currentStatus: string;
    requestId: number;
    managerAction: boolean;
}

export const sendEmail = async ({ user, currentStatus, requestId, managerAction }: EmailParams): Promise<void> => {
    const TOKEN = process.env.MAILTRAP_API_TOKEN;
    const SENDER_EMAIL = process.env.SENDER_EMAIL;
    if (!SENDER_EMAIL) {
        throw new Error('Sender email is not defined in environment variables.');
    }
    if (!TOKEN) {
            throw new Error('Mailtrap API token is not defined in environment variables.');
    }
    try {
        // Create a transporter object using the default SMTP transpor
        const client = new MailtrapClient({
            token: TOKEN,
        });

        const sender = {
            email: SENDER_EMAIL, // Replace with your verified Mailtrap sender email
            name: 'no-reply-aio-wfh',
        };

        const subject = `Notification for Request ID: ${requestId}`;
        const recipients = [
            {
                // email: user.Email,
                email: process.env.TEST_RECIEPIENT,
                name: `${user.Staff_FName} ${user.Staff_LName}`,
            },
        ];
        
        let text = `Hello ${user.Staff_FName} ${user.Staff_LName},\nThere has been an update to request ID ${requestId}.\nCurrent Status: ${currentStatus}\n\n`;

        if (managerAction) {
            text += `This requires action from you to approve/reject this request.\n\n`;
        }

        text += `This is a system-generated message. Do not reply to this email`;

        console.log(text)

        // Send mail using Mailtrap API
        await client.send({
            from: sender,
            to: recipients,
            subject: subject,
            text: text,
            category: 'Notification',
        });

        console.log(`Email sent to ${user.Email} regarding request ID ${requestId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Unable to send email notification.');
    }
};

