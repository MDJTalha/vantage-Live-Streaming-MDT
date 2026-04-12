import { meetingService, Meeting } from '../services/MeetingService';

describe('MeetingService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    localStorage.clear();
  });

  const mockMeetings: Meeting[] = [
    {
      id: '1',
      name: 'Test Meeting',
      code: 'ABC123',
      hostId: 'host-1',
      status: 'ACTIVE',
      participants: 5,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  describe('getAllMeetings', () => {
    it('should fetch meetings from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMeetings }),
      });

      const meetings = await meetingService.getAllMeetings();
      expect(meetings).toHaveLength(1);
      expect(meetings[0].name).toBe('Test Meeting');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      await expect(meetingService.getAllMeetings()).rejects.toThrow('Failed to fetch meetings');
    });
  });

  describe('getMeeting', () => {
    it('should return null for 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const meeting = await meetingService.getMeeting('INVALID');
      expect(meeting).toBeNull();
    });

    it('should return meeting on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMeetings[0] }),
      });

      const meeting = await meetingService.getMeeting('ABC123');
      expect(meeting).not.toBeNull();
      expect(meeting?.code).toBe('ABC123');
    });
  });

  describe('createMeeting', () => {
    it('should create a new meeting', async () => {
      const newMeeting = { ...mockMeetings[0], id: '2' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: newMeeting }),
      });

      const result = await meetingService.createMeeting({ name: 'New Meeting' });
      expect(result.name).toBe('Test Meeting');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/meetings'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw with error message on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Name is required' }),
      });

      await expect(meetingService.createMeeting({ name: '' })).rejects.toThrow('Name is required');
    });
  });

  describe('deleteMeeting', () => {
    it('should delete a meeting', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await expect(meetingService.deleteMeeting('1')).resolves.not.toThrow();
    });

    it('should throw on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(meetingService.deleteMeeting('1')).rejects.toThrow('403');
    });
  });
});
