/**
 * Admin Service - Frontend API Client
 * Handles system administration features
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Organization {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  createdAt: string;
  status: 'active' | 'suspended' | 'deleted';
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface UsageAnalytics {
  totalUsers: number;
  totalOrganizations: number;
  totalMeetings: number;
  totalRecordings: number;
  storageUsed: number;
  activeUsers: number;
  period: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  growthRate: number;
  period: string;
}

export interface UpdateTierRequest {
  tier: 'free' | 'pro' | 'enterprise';
}

class AdminService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<Organization[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/organizations`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch organizations');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get single organization
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/organizations/${id}`, {
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
   * Update organization tier
   */
  async updateTier(id: string, data: UpdateTierRequest): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/organizations/${id}/tier`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update tier');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/organizations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete organization');
    }
  }

  /**
   * Get all invoices
   */
  async getInvoices(): Promise<Invoice[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/invoices`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch invoices');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Send invoice to client
   */
  async sendInvoice(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/invoices/${id}/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send invoice');
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(): Promise<UsageAnalytics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/usage`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch usage analytics');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/revenue`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch revenue analytics');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get system health
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    services: Record<string, string>;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/health`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch health status');
    }

    const result = await response.json();
    return result.data;
  }
}

export const adminService = new AdminService();
export default adminService;
