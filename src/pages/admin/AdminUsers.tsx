import React, { useState, useMemo, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Search, Plus, Edit3, Trash2, UserX, UserCheck, Eye, Shield, Loader2 } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { dataLoaders, mutations, authService } from '../../lib/dataService';
import { toast } from '../../components/ui/Toast';
import type { User, UserRole } from '../../types';
import { formatDate } from '../../data/mockData';

const ADMIN_EMAIL = 'admin@askindia.shop';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  store_owner: 'Store Owner',
  service_provider: 'Service Provider',
  customer: 'Customer',
  agent: 'Agent',
  delivery_partner: 'Delivery Partner',
};

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'bg-amber-100 text-amber-700',
  store_owner: 'bg-emerald-100 text-emerald-700',
  service_provider: 'bg-violet-100 text-violet-700',
  customer: 'bg-sky-100 text-sky-700',
  agent: 'bg-orange-100 text-orange-700',
  delivery_partner: 'bg-indigo-100 text-indigo-700',
};

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'store_owner', label: 'Store Owner' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'customer', label: 'Customer' },
  { value: 'agent', label: 'Agent' },
  { value: 'delivery_partner', label: 'Delivery Partner' },
];

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  role: 'customer' as UserRole,
  password: '',
};

export const AdminUsers: React.FC = () => {
  const { suspendedUsers, userActivities, adminToggleSuspend } = useAppStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [formError, setFormError] = useState('');
  const [showActivityFor, setShowActivityFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load real user profiles from the backend
  const refresh = useCallback(async () => {
    try {
      const data = await dataLoaders.loadAllUsers();
      setUsers(data);
    } catch {
      toast.error('Could not load users. Please retry.');
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Stats
  const totalUsers = users.length;
  const storeOwners = users.filter(u => u.role === 'store_owner').length;
  const serviceProviders = users.filter(u => u.role === 'service_provider').length;
  const customers = users.filter(u => u.role === 'customer').length;

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  // Last activity per user
  const lastActivity = useMemo(() => {
    const map: Record<string, string> = {};
    userActivities.forEach(a => {
      if (!map[a.userId] || a.createdAt > map[a.userId]) {
        map[a.userId] = a.createdAt;
      }
    });
    return map;
  }, [userActivities]);

  // ── Create ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...defaultForm });
    setFormError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email and password are required.');
      return;
    }
    setBusy(true); setFormError('');
    const result = await authService.signUp({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      role: form.role,
      password: form.password,
    });
    setBusy(false);
    if (!result.success) {
      setFormError(result.error ?? 'Failed to create user.');
      return;
    }
    setCreateOpen(false);
    await refresh();
    toast.success(`${ROLE_LABELS[form.role]} "${form.name.trim()}" created`);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
      role: user.role,
      password: '',
    });
    setFormError('');
    setShowActivityFor(null);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setBusy(true); setFormError('');
    try {
      await mutations.adminUpdateUser(editUser.id, {
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        role: form.role,
      });
      setEditUser(null);
      await refresh();
      toast.success('User updated');
    } catch (e) {
      setFormError((e as Error).message || 'Failed to update user.');
    } finally {
      setBusy(false);
    }
  };

  // ── Delete / Suspend ──────────────────────────────────────────────────────

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await mutations.adminDeleteUser(user.id);
      await refresh();
      toast.success(`User "${user.name}" deleted`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete user.');
    }
  };

  const handleToggleSuspend = (user: User) => {
    const isSuspended = suspendedUsers.includes(user.id);
    if (!confirm(`${isSuspended ? 'Unsuspend' : 'Suspend'} user "${user.name}"?`)) return;
    adminToggleSuspend(user.id);
    toast.success(isSuspended ? `${user.name} unsuspended` : `${user.name} suspended`);
  };

  // ── Activity for edit modal ───────────────────────────────────────────────

  const userRecentActivity = useMemo(() => {
    if (!showActivityFor) return [];
    return [...userActivities]
      .filter(a => a.userId === showActivityFor)
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 10);
  }, [userActivities, showActivityFor]);

  // ── Shared form fields ────────────────────────────────────────────────────

  const renderFormFields = (includePassword: boolean, emailEditable = true) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            className="input w-full"
            placeholder="Jane Doe"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className="input w-full disabled:bg-slate-100 disabled:text-slate-400"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            disabled={!emailEditable}
            title={emailEditable ? undefined : 'Email cannot be changed'}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            className="input w-full"
            placeholder="9876543210"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input
            className="input w-full"
            placeholder="Mumbai"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <input
            className="input w-full"
            placeholder="Maharashtra"
            value={form.state}
            onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            className="input w-full"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {includePassword && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              className="input w-full"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
        )}
      </div>
      {formError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
      )}
    </div>
  );

  return (
    <AppLayout title="User Management">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage all platform users and their access</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex-shrink-0">
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: totalUsers, color: 'text-indigo-600' },
            { label: 'Store Owners', value: storeOwners, color: 'text-emerald-600' },
            { label: 'Service Providers', value: serviceProviders, color: 'text-violet-600' },
            { label: 'Customers', value: customers, color: 'text-sky-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={clsx('text-2xl font-bold', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter + Search bar */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  roleFilter === f.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9 w-full"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Users table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No users found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="table-th">User</th>
                    <th className="table-th">Role</th>
                    <th className="table-th hidden md:table-cell">City</th>
                    <th className="table-th hidden lg:table-cell">Phone</th>
                    <th className="table-th hidden lg:table-cell">Joined</th>
                    <th className="table-th hidden xl:table-cell">Last Active</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(user => {
                    const isSuspended = suspendedUsers.includes(user.id);
                    const isAdmin = user.email === ADMIN_EMAIL;
                    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        {/* User */}
                        <td className="table-td">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role badge */}
                        <td className="table-td">
                          <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', ROLE_BADGE[user.role])}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        {/* City */}
                        <td className="table-td hidden md:table-cell text-slate-600">
                          {user.city ?? '—'}
                        </td>
                        {/* Phone */}
                        <td className="table-td hidden lg:table-cell text-slate-600">
                          {user.phone ?? '—'}
                        </td>
                        {/* Joined */}
                        <td className="table-td hidden lg:table-cell text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        {/* Last Active */}
                        <td className="table-td hidden xl:table-cell text-slate-500">
                          {lastActivity[user.id] ? formatDate(lastActivity[user.id]) : '—'}
                        </td>
                        {/* Status */}
                        <td className="table-td">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-semibold',
                            isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="table-td">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit user"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {!isAdmin && (
                              <>
                                <button
                                  onClick={() => handleToggleSuspend(user)}
                                  className={clsx(
                                    'p-1.5 rounded-lg transition-colors',
                                    isSuspended
                                      ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  )}
                                  title={isSuspended ? 'Unsuspend user' : 'Suspend user'}
                                >
                                  {isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create User Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New User" size="lg">
        {renderFormFields(true)}
        <div className="flex gap-3 mt-6">
          <button onClick={() => setCreateOpen(false)} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={busy} className="btn-primary flex-1 justify-center disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create User
          </button>
        </div>
      </Modal>

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Edit User — ${editUser?.name ?? ''}`}
        size="lg"
      >
        {editUser && (
          <div className="space-y-5">
            {renderFormFields(false, false)}

            {/* View Activity toggle */}
            <div>
              <button
                onClick={() =>
                  setShowActivityFor(prev => (prev === editUser.id ? null : editUser.id))
                }
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showActivityFor === editUser.id ? 'Hide Activity' : 'View Activity'}
              </button>

              {showActivityFor === editUser.id && (
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2 bg-slate-50 border-b border-slate-100">
                    Last 10 Activities
                  </p>
                  {userRecentActivity.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No activity recorded yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                      {userRecentActivity.map(a => (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                          <span className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 font-medium capitalize">
                              {a.event.replace(/_/g, ' ')}
                            </p>
                            {a.page && (
                              <p className="text-xs text-slate-400 truncate">{a.page}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(a.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditUser(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={busy} className="btn-primary flex-1 justify-center disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
