'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Badge, Card } from '@vantage/ui';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  TrendingUp,
  DollarSign,
  Server,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Crown,
  Activity,
  Video,
  HardDrive,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { adminService, type Organization, type Invoice, type UsageAnalytics, type RevenueAnalytics } from '@/services/AdminService';

type AdminTab = 'overview' | 'organizations' | 'invoices' | 'usage' | 'revenue' | 'health';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [newTier, setNewTier] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    loadData();
  }, [user, router]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [orgs, invs, usageData, revenueData, healthData] = await Promise.all([
        adminService.getOrganizations().catch(() => []),
        adminService.getInvoices().catch(() => []),
        adminService.getUsageAnalytics().catch(() => null),
        adminService.getRevenueAnalytics().catch(() => null),
        adminService.getHealth().catch(() => null),
      ]);
      setOrganizations(orgs);
      setInvoices(invs);
      setUsage(usageData);
      setRevenue(revenueData);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateTier(orgId: string) {
    try {
      await adminService.updateTier(orgId, { tier: newTier });
      await loadData();
      setShowTierModal(false);
      setSelectedOrg(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update tier');
    }
  }

  async function handleDeleteOrg(orgId: string) {
    if (!confirm('Are you sure? This will delete the organization and all its data.')) return;
    
    try {
      await adminService.deleteOrganization(orgId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete organization');
    }
  }

  async function handleSendInvoice(invoiceId: string) {
    try {
      await adminService.sendInvoice(invoiceId);
      alert('Invoice sent successfully');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to send invoice');
    }
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-[#0f172a] border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">System administration and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center gap-2">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'organizations'}
              onClick={() => setActiveTab('organizations')}
              icon={<Building2 className="h-4 w-4" />}
              label="Organizations"
              badge={organizations.length}
            />
            <TabButton
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
              icon={<FileText className="h-4 w-4" />}
              label="Invoices"
              badge={invoices.length}
            />
            <TabButton
              active={activeTab === 'usage'}
              onClick={() => setActiveTab('usage')}
              icon={<Activity className="h-4 w-4" />}
              label="Usage"
            />
            <TabButton
              active={activeTab === 'revenue'}
              onClick={() => setActiveTab('revenue')}
              icon={<DollarSign className="h-4 w-4" />}
              label="Revenue"
            />
            <TabButton
              active={activeTab === 'health'}
              onClick={() => setActiveTab('health')}
              icon={<Server className="h-4 w-4" />}
              label="Health"
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Organizations"
                value={organizations.length}
                icon={<Building2 className="h-5 w-5 text-blue-400" />}
                trend={12}
              />
              <StatCard
                title="Total Users"
                value={usage?.totalUsers || 0}
                icon={<Users className="h-5 w-5 text-green-400" />}
                trend={8}
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(revenue?.monthlyRecurringRevenue || 0)}
                icon={<DollarSign className="h-5 w-5 text-amber-400" />}
                trend={23}
              />
              <StatCard
                title="System Health"
                value={health?.status === 'healthy' ? '99.9%' : 'Degraded'}
                icon={<Server className="h-5 w-5 text-purple-400" />}
                trend={health?.status === 'healthy' ? 0 : -5}
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                {health ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Overall Status</span>
                      <Badge className={
                        health.status === 'healthy' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                        health.status === 'degraded' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                        'bg-red-600/20 text-red-400 border-red-600/30'
                      }>
                        {health.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {health.status === 'degraded' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {health.status === 'unhealthy' && <XCircle className="h-3 w-3 mr-1" />}
                        {health.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Uptime</span>
                      <span className="text-white font-mono">{(health.uptime / 3600).toFixed(2)}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Version</span>
                      <span className="text-white font-mono">{health.version}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">No health data available</p>
                )}
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Video className="h-4 w-4" /> Total Meetings
                    </span>
                    <span className="text-white font-medium">{usage?.totalMeetings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <HardDrive className="h-4 w-4" /> Storage Used
                    </span>
                    <span className="text-white font-medium">{formatStorage(usage?.storageUsed || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Active Users
                    </span>
                    <span className="text-white font-medium">{usage?.activeUsers || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Organizations Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Organization</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Tier</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Members</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Created</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{org.name}</div>
                          <div className="text-xs text-slate-400">{org.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={
                          org.tier === 'enterprise' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' :
                          org.tier === 'pro' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                          'bg-slate-600/20 text-slate-400 border-slate-600/30'
                        }>
                          {org.tier}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{org.memberCount}</td>
                      <td className="px-6 py-4">
                        <Badge className={
                          org.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                          org.status === 'suspended' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                          'bg-red-600/20 text-red-400 border-red-600/30'
                        }>
                          {org.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setNewTier(org.tier);
                              setShowTierModal(true);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrg(org.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrgs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No organizations found
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Invoice</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Organization</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Due Date</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{invoice.organizationId}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={
                          invoice.status === 'paid' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                          invoice.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                          'bg-red-600/20 text-red-400 border-red-600/30'
                        }>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          Send
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No invoices found
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && usage && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard title="Total Users" value={usage.totalUsers} icon={<Users className="h-5 w-5 text-blue-400" />} />
              <StatCard title="Total Organizations" value={usage.totalOrganizations} icon={<Building2 className="h-5 w-5 text-green-400" />} />
              <StatCard title="Total Meetings" value={usage.totalMeetings} icon={<Video className="h-5 w-5 text-amber-400" />} />
              <StatCard title="Total Recordings" value={usage.totalRecordings} icon={<HardDrive className="h-5 w-5 text-purple-400" />} />
              <StatCard title="Storage Used" value={formatStorage(usage.storageUsed)} icon={<Server className="h-5 w-5 text-cyan-400" />} />
              <StatCard title="Active Users" value={usage.activeUsers} icon={<Activity className="h-5 w-5 text-red-400" />} />
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenue && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={formatCurrency(revenue.totalRevenue)} icon={<DollarSign className="h-5 w-5 text-green-400" />} trend={revenue.growthRate} />
              <StatCard title="Monthly Recurring Revenue" value={formatCurrency(revenue.monthlyRecurringRevenue)} icon={<TrendingUp className="h-5 w-5 text-amber-400" />} trend={15} />
              <StatCard title="Avg Revenue Per User" value={formatCurrency(revenue.averageRevenuePerUser)} icon={<Users className="h-5 w-5 text-blue-400" />} />
              <StatCard title="Growth Rate" value={`${revenue.growthRate}%`} icon={<ArrowUpRight className="h-5 w-5 text-purple-400" />} trend={revenue.growthRate} />
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">System Health</h3>
              {health ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50">
                    <span className="text-slate-400">Status</span>
                    <Badge className={
                      health.status === 'healthy' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                      health.status === 'degraded' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                      'bg-red-600/20 text-red-400 border-red-600/30'
                    }>
                      {health.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50">
                    <span className="text-slate-400">Uptime</span>
                    <span className="text-white font-mono">{(health.uptime / 3600).toFixed(2)} hours</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50">
                    <span className="text-slate-400">Version</span>
                    <span className="text-white font-mono">{health.version}</span>
                  </div>
                  {health.services && (
                    <div className="pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Services</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(health.services).map(([name, status]: [string, any]) => (
                          <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
                            <span className="text-sm text-slate-300">{name}</span>
                            <Badge className={
                              status === 'healthy' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                              'bg-red-600/20 text-red-400 border-red-600/30'
                            }>
                              {String(status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">No health data available</p>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Tier Change Modal */}
      {showTierModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Change Organization Tier</h3>
            <p className="text-slate-400 mb-4">Changing tier for: {selectedOrg.name}</p>
            
            <div className="space-y-2 mb-6">
              {(['free', 'pro', 'enterprise'] as const).map((tier) => (
                <label
                  key={tier}
                  className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="tier"
                    checked={newTier === tier}
                    onChange={() => setNewTier(tier)}
                    className="w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white capitalize">{tier}</div>
                    <div className="text-xs text-slate-400">
                      {tier === 'free' && 'Basic features, limited users'}
                      {tier === 'pro' && 'Advanced features, up to 100 users'}
                      {tier === 'enterprise' && 'All features, unlimited users'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTierModal(false);
                  setSelectedOrg(null);
                }}
                className="flex-1 border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateTier(selectedOrg.id)}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
              >
                Update Tier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'text-amber-400 border-amber-400'
          : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <Badge className="bg-slate-700 text-slate-300 text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-4 text-sm">
          {trend > 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-400" />
          ) : trend < 0 ? (
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          ) : null}
          <span className={trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </Card>
  );
}
