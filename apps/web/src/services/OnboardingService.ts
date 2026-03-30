/**
 * Onboarding Service - Frontend API Client
 * Handles organization creation and onboarding flow
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  settings: {
    allowPublicRooms: boolean;
    requireEmailVerification: boolean;
    defaultRecordingEnabled: boolean;
  };
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: Partial<Organization['settings']>;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface SetupProgress {
  completedSteps: string[];
  totalSteps: number;
  percentage: number;
  nextStep: string;
}

class OnboardingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Create a new organization
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/create-organization`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create organization');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get current user's organization
   */
  async getMyOrganization(): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/my-organization`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch organization');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update organization
   */
  async updateOrganization(data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/my-organization`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update organization');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Invite team member
   */
  async inviteTeamMember(data: InviteTeamMemberRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/invite-team-member`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to invite team member');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Upgrade plan
   */
  async upgradePlan(plan: 'pro' | 'enterprise'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/upgrade-plan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upgrade plan');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get setup progress
   */
  async getSetupProgress(): Promise<SetupProgress> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/setup-progress`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch setup progress');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Complete setup step
   */
  async completeSetup(step: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/complete-setup`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ step }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to complete setup');
    }

    const result = await response.json();
    return result.data;
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;
