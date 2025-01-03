// TypeScript types for Twilio credentials

export interface TwilioCredentials {
    id: number;
    account_sid: string;
    auth_token: string;
    from_phone_number: string;
    created_at: Date;
}
