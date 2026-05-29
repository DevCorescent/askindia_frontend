import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Agent } from '../../types';
import {
  Users, Plus, X, CheckCircle, XCircle, Eye,
  MapPin, Phone, Mail, TrendingUp, ShoppingBag,
} from 'lucide-react';
import clsx from 'clsx';

interface AddAgentForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  commissionRate: number;
  password: string;
}

const EMPTY_FORM: AddAgentForm = {
  name: '', email: '', phone: '', city: '', state: '', commissionRate: 5, password: '',
};

const AgentStatusBadge: React.FC<{ status: Agent['status'] }> = ({ status }) => {
  const map = {
    active:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    pending:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    suspended: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const AdminAgents: React.FC = () => {
  const { currentUser, agents, orders, addAgent, activateAgent, suspendAgent } = useAppStore();

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [form, setForm] = useState<AddAgentForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const totalAgents = agents.length;
  const activeCount = agents.filter(a => a.status === 'active').length;
  const pendingCount = agents.filter(a => a.status === 'pending').length;
  const suspendedCount = agents.filter(a => a.status === 'suspended').length;

  const handleAddAgent = () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError('Valid email required.'); return; }
    if (!form.city.trim()) { setFormError('City is required.'); return; }
    if (!form.state.trim()) { setFormError('State is required.'); return; }
    if (!form.password.trim()) { setFormError('Password is required.'); return; }
    if (form.commissionRate < 0 || form.commissionRate > 30) { setFormError('Commission rate must be 0–30%.'); return; }

    setFormError('');
    setSubmitting(true);

    const result = addAgent({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      commissionRate: form.commissionRate,
      agentCode: '',  // will be auto-generated
      status: 'pending',
      password: form.password,
    });

    setSubmitting(false);

    if (result.success) {
      setFormSuccess('Agent added successfully. They can log in immediately (pending activation).');
      setForm(EMPTY_FORM);
    } else {
      setFormError(result.error ?? 'Failed to add agent.');
    }
  };

  const handleActivate = (agent: Agent) => {
    activateAgent(agent.id, currentUser?.email ?? 'admin');
    if (selectedAgent?.id === agent.id) setSelectedAgent({ ...agent, status: 'active', activatedAt: new Date().toISOString(), activatedBy: currentUser?.email });
  };

  const handleSuspend = (agent: Agent) => {
    suspendAgent(agent.id);
    if (selectedAgent?.id === agent.id) setSelectedAgent({ ...agent, status: 'suspended' });
  };

  const agentOrders = (agentId: string) => orders.filter(o => o.agentId === agentId);

  return (
    <AppLayout title="Sales Agents">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sales Agents</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage your field sales force</p>
          </div>
          <button
            onClick={() => { setShowAddPanel(true); setFormError(''); setFormSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Agent
          </button>
        </div>

        {/* Stats chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Agents', value: totalAgents, color: 'text-slate-900', bg: 'bg-white' },
            { label: 'Active', value: activeCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Pending', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Suspended', value: suspendedCount, color: 'text-red-700', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4 flex items-center gap-3`}>
              <Users className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending activation banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
            <span className="text-lg">⏳</span>
            <p>
              <span className="font-bold">{pendingCount} agent{pendingCount > 1 ? 's' : ''}</span> awaiting activation.
              Review and activate them below.
            </p>
          </div>
        )}

        {/* Agent list */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Agent</th>
                  <th className="table-th">Code</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Commission</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Total Sales</th>
                  <th className="table-th">Wallet</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{agent.name}</p>
                          <p className="text-xs text-slate-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-mono text-xs text-orange-600 font-bold">{agent.agentCode}</td>
                    <td className="table-td text-sm text-slate-600">{agent.city}</td>
                    <td className="table-td">
                      <span className="font-bold text-orange-600">{agent.commissionRate}%</span>
                    </td>
                    <td className="table-td text-sm text-slate-600">{agent.totalOrders}</td>
                    <td className="table-td font-semibold text-sm">{formatCurrency(agent.totalSales)}</td>
                    <td className="table-td">
                      <span className="text-emerald-600 font-bold">{formatCurrency(agent.walletBalance)}</span>
                    </td>
                    <td className="table-td"><AgentStatusBadge status={agent.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {agent.status === 'pending' && (
                          <button
                            onClick={() => handleActivate(agent)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {agent.status === 'active' && (
                          <button
                            onClick={() => handleSuspend(agent)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Suspend"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400 text-sm">
                      No agents yet. Add your first agent.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Agent Slide-over */}
      {showAddPanel && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowAddPanel(false)}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div
            className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Add New Agent</h3>
              <button onClick={() => setShowAddPanel(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {formSuccess ? (
              <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                <CheckCircle className="h-14 w-14 text-emerald-500 mb-4" />
                <p className="text-lg font-bold text-slate-900">Agent Added!</p>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">{formSuccess}</p>
                <button
                  onClick={() => { setShowAddPanel(false); setFormSuccess(''); }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                    <input className="input" placeholder="Agent's full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                    <input className="input" type="email" placeholder="agent@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input className="input" placeholder="10-digit mobile" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                    <input className="input" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
                    <input className="input" placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Commission Rate % * <span className="text-slate-400 font-normal">(0–30)</span>
                    </label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      placeholder="e.g. 5"
                      value={form.commissionRate}
                      onChange={e => setForm(f => ({ ...f, commissionRate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password * <span className="text-slate-400 font-normal">(for agent login)</span></label>
                    <input className="input" type="password" placeholder="Set a login password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddPanel(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAgent}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Adding…' : 'Add Agent'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Details Slide-over */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelectedAgent(null)}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div
            className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAgent.agentCode} · {selectedAgent.city}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 flex-1">
              {/* Status + actions */}
              <div className="flex items-center justify-between">
                <AgentStatusBadge status={selectedAgent.status} />
                <div className="flex gap-2">
                  {selectedAgent.status === 'pending' && (
                    <button
                      onClick={() => handleActivate(selectedAgent)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Activate
                    </button>
                  )}
                  {selectedAgent.status === 'active' && (
                    <button
                      onClick={() => handleSuspend(selectedAgent)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Suspend
                    </button>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{selectedAgent.email}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                  <p className="text-sm font-medium text-slate-900">{selectedAgent.phone ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                  <p className="text-sm font-medium text-slate-900">{selectedAgent.city}, {selectedAgent.state}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Commission Rate</p>
                  <p className="text-sm font-bold text-orange-600">{selectedAgent.commissionRate}%</p>
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-500 flex items-center gap-1 mb-1"><ShoppingBag className="h-3 w-3" /> Total Orders</p>
                  <p className="text-xl font-bold text-blue-700">{selectedAgent.totalOrders}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3" /> Total Sales</p>
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedAgent.totalSales)}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-500 mb-1">Wallet Balance</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(selectedAgent.walletBalance)}</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-xs text-violet-500 mb-1">Total Earned</p>
                  <p className="text-xl font-bold text-violet-700">{formatCurrency(selectedAgent.totalEarned)}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="text-xs text-slate-400 space-y-1">
                <p>Joined: {formatDate(selectedAgent.createdAt)}</p>
                {selectedAgent.activatedAt && <p>Activated: {formatDate(selectedAgent.activatedAt)} by {selectedAgent.activatedBy}</p>}
              </div>

              {/* Recent orders */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 text-sm">Recent Orders</h4>
                {agentOrders(selectedAgent.id).slice(0, 5).length === 0 ? (
                  <p className="text-xs text-slate-400">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {agentOrders(selectedAgent.id).slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                        <div>
                          <p className="text-xs font-mono text-slate-600">#{order.id.toUpperCase()}</p>
                          <p className="text-xs text-slate-500">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-emerald-600">+{formatCurrency(order.agentCommission ?? 0)}</p>
                        </div>
                        {statusBadge(order.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
