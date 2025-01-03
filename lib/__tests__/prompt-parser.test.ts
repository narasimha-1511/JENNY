import { parseSystemPrompt } from '../prompt-parser';
import { Bot } from '../types';

describe('parseSystemPrompt', () => {
  const mockTemplate = `
# Appointment Booking System Configuration

  ## Agent Role
  - Name: Appointment Assistant
  - Context: Voice-based appointment booking system with TTS output
  - Current time: \${new Date()}

  ## Business Hours
  Monday - Friday: 9:00 AM - 5:00 PM
  Saturday: 10:00 AM - 2:00 PM
  Sunday: Closed
  `;

  const mockBot: Bot = {
    id: '1',
    name: 'Test Bot',
    voice: 'en-US',
    system_prompt: '',
    created_at: new Date().toISOString(),
    user_id: '1',
    allows_appointments: true,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    hours: {
      start: '8:00 AM',
      end: '6:00 PM'
    }
  };

  it('should replace dynamic date', () => {
    const fixedDate = new Date('2024-01-01T12:00:00Z');
    const result = parseSystemPrompt(mockTemplate, mockBot, fixedDate);
    expect(result).toContain('2024-01-01T12:00:00.000Z');
  });

  it('should replace business hours based on bot configuration', () => {
    const result = parseSystemPrompt(mockTemplate, mockBot);
    expect(result).toContain('Monday - Friday: 8:00 AM - 6:00 PM');
    expect(result).toContain('Saturday: 8:00 AM - 6:00 PM');
    expect(result).toContain('Sunday: Closed');
  });
});
