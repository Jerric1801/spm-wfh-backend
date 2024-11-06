import { sendEmail, ReciepientEmailParams } from '../../src/shared/sendEmail';
import { MailtrapClient } from 'mailtrap';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

jest.mock('mailtrap');

const mockedMailtrapClient = MailtrapClient as jest.Mock;

describe('sendEmail', () => {
  let mockClientInstance: { send: jest.Mock };

  beforeEach(() => {
    // Mock the Mailtrap client instance
    mockClientInstance = {
      send: jest.fn().mockResolvedValue({ message_id: 'mocked-message-id' }),
    };
    mockedMailtrapClient.mockImplementation(() => mockClientInstance);

    // Mock process.env variables used in tests
    process.env.SENDER_EMAIL = 'no-reply@example.com';
    process.env.RECIEPIENT_EMAIL = 'recipient@example.com';
    process.env.MAILTRAP_API_TOKEN = 'mocked_token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send an email with correct parameters when managerAction is true', async () => {
    const user: ReciepientEmailParams = { Staff_FName: "Jerric", Staff_LName: "Chan", Email: "jerric.chan@allinone.com" }

    const emailParams = {
      user: user,
      currentStatus: 'Pending Approval',
      requestId: 12345,
      managerAction: true,
    };

    await sendEmail(emailParams);

    expect(mockedMailtrapClient).toHaveBeenCalledWith({
      token: process.env.MAILTRAP_API_TOKEN,
    });

    expect(mockClientInstance.send).toHaveBeenCalledWith({
      from: {
        email: process.env.SENDER_EMAIL,
        name: 'no-reply-aio-wfh',
      },
      to: [
        {
          email: process.env.RECIEPIENT_EMAIL,
        },
      ],
      subject: 'Notification for Request ID: 12345',
      text: `Hello Jerric Chan,\nThere has been an update to request ID 12345.\nCurrent Status: Pending Approval\n\nThis requires action from you to approve/reject this request.\n\nThis is a system-generated message. Do not reply to this email`,
      category: 'Notification',
    });
  });

  it('should send an email with correct parameters when managerAction is false', async () => {
    const userPayload = {
      Staff_FName: 'Jane',
      Staff_LName: 'Smith',
      Email: 'jane.smith@example.com',
    };

    const emailParams = {
      user: userPayload,
      currentStatus: 'Approved',
      requestId: 67890,
      managerAction: false,
    };

    await sendEmail(emailParams);

    expect(mockedMailtrapClient).toHaveBeenCalledWith({
      token: process.env.MAILTRAP_API_TOKEN,
    });

    expect(mockClientInstance.send).toHaveBeenCalledWith({
      from: {
        email: process.env.SENDER_EMAIL,
        name: 'no-reply-aio-wfh',
      },
      to: [
        {
          email: process.env.RECIEPIENT_EMAIL,
        },
      ],
      subject: 'Notification for Request ID: 67890',
      text: `Hello Jane Smith,\nThere has been an update to request ID 67890.\nCurrent Status: Approved\n\nThis is a system-generated message. Do not reply to this email`,
      category: 'Notification',
    });
  });

  it('should handle errors from the Mailtrap client and throw an error', async () => {
    // Mock the send method to throw an error to simulate an API failure
    mockClientInstance.send.mockRejectedValue(new Error('Mailtrap error'));

    const userPayload = {
      Staff_FName: 'John',
      Staff_LName: 'Doe',
      Email: 'john.doe@example.com',
    };

    const emailParams = {
      user: userPayload,
      currentStatus: 'Pending Approval',
      requestId: 12345,
      managerAction: true,
    };

    await expect(sendEmail(emailParams)).rejects.toThrow(
      'Unable to send email notification.'
    );
  });

  it('should throw an error if MAILTRAP_API_TOKEN is not defined', async () => {
    // Temporarily delete the MAILTRAP_API_TOKEN variable
    delete process.env.MAILTRAP_API_TOKEN;

    const userPayload = {
      Staff_FName: 'John',
      Staff_LName: 'Doe',
      Email: 'john.doe@example.com',
    };

    const emailParams = {
      user: userPayload,
      currentStatus: 'Pending Approval',
      requestId: 12345,
      managerAction: true,
    };

    await expect(sendEmail(emailParams)).rejects.toThrow(
      'Mailtrap API token is not defined in environment variables.'
    );
  });

  it('should throw an error if SENDER_EMAIL is not defined', async () => {
    // Temporarily delete the SENDER_EMAIL variable
    delete process.env.SENDER_EMAIL;

    const userPayload = {
      Staff_FName: 'John',
      Staff_LName: 'Doe',
      Email: 'john.doe@example.com',
    };

    const emailParams = {
      user: userPayload,
      currentStatus: 'Pending Approval',
      requestId: 12345,
      managerAction: true,
    };

    await expect(sendEmail(emailParams)).rejects.toThrow(
      'Sender email is not defined in environment variables.'
    );
  });
});

