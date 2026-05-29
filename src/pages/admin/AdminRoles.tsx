import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Shield, ShieldCheck, Plus, Edit3, Trash2,
  ChevronDown, ChevronUp, Check, Eye, Lock, Users,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import type { Role } from '../../types';
import { SYSTEM_ROLES, ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '../../data/permissions';

const COLOR_SWATCHES = [
  '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6',
  '#f97316', '#ef4444', '#06b6d4', '#84cc16',
];

const ADMIN_EMAIL = 'admin@askindia.shop';

type FormState = { name: string; description: string; color: string; permissions: string[] };

const defaultForm: FormState = { name: '', description: '', color: '#4f46e5', permissions: [] };

// ── helpers ──────────────────────────────────────────────────────────────────

function useUserCounts() {
  const registeredUsers = useAppStore(s => s.registeredUsers);
  return {
    admin: registeredUsers.filter(u => u.email === ADMIN_EMAIL).length,
    store_owner: registeredUsers.filter(u => u.role === 'store_owner').length,
    service_provider: registeredUsers.filter(u => u.role === 'service_provider').length,
    customer: registeredUsers.filter(u => u.role === 'customer').length,
    agent: registeredUsers.filter(u => u.role === 'agent').length,
  };
}

const SYSTEM_ROLE_USER_KEY: Record<string, keyof ReturnType<typeof useUserCounts>> = {
  'role_admin': 'admin',
  'role_store_owner': 'store_owner',
  'role_service_provider': 'service_provider',
  'role_customer': 'customer',
  'role_agent': 'agent',
};

// ── Permission Matrix ─────────────────────────────────────────────────────────

interface PermMatrixProps {
  selected: string[];
  onChange: (perms: string[]) => void;
  readOnly?: boolean;
  expanded: string[];
  setExpanded: React.Dispatch<React.SetStateAction<string[]>>;
}

const PermMatrix: React.FC<PermMatrixProps> = ({ selected, onChange, readOnly, expanded, setExpanded }) => {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };

  const toggleCategory = (cat: string) => {
    setExpanded(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const catPerms = (cat: string) => ALL_PERMISSIONS.filter(p => p.category === cat);

  const selectAll = (cat: string) => {
    const keys = catPerms(cat).map(p => p.key);
    onChange([...new Set([...selected, ...keys])]);
  };

  const deselectAll = (cat: string) => {
    const keys = catPerms(cat).map(p => p.key);
    onChange(selected.filter(k => !keys.includes(k)));
  };

  return (
    <div className="space-y-2">
      {PERMISSION_CATEGORIES.map(cat => {
        const perms = catPerms(cat);
        const isOpen = expanded.includes(cat);
        const allSelected = perms.every(p => selected.includes(p.key));
        const someSelected = perms.some(p => selected.includes(p.key));

        return (
          <div key={cat} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-700">{cat}</span>
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  someSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                )}>
                  {perms.filter(p => selected.includes(p.key)).length}/{perms.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); selectAll(cat); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >All</button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deselectAll(cat); }}
                      className="text-xs text-slate-500 hover:underline"
                    >None</button>
                  </>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3">
                {perms.map(p => {
                  const checked = selected.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className={clsx('flex items-center gap-2 text-sm', readOnly ? 'cursor-default' : 'cursor-pointer')}
                    >
                      <span className={clsx(
                        'h-4 w-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors',
                        checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300',
                        readOnly && 'opacity-70'
                      )}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {!readOnly && (
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggle(p.key)}
                        />
                      )}
                      <span className={checked ? 'text-slate-800' : 'text-slate-500'}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Role Card ─────────────────────────────────────────────────────────────────

interface RoleCardProps {
  role: Role;
  userCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onView: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, userCount, onEdit, onDelete, onView }) => (
  <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{role.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{role.description}</p>
        </div>
      </div>
      <span className={clsx(
        'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
        role.isSystem ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
      )}>
        {role.isSystem ? 'System' : 'Custom'}
      </span>
    </div>

    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        {userCount} {userCount === 1 ? 'user' : 'users'}
      </span>
      <span className="text-slate-300">•</span>
      <span className="flex items-center gap-1">
        <Shield className="h-3.5 w-3.5" />
        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
      <button
        onClick={onView}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
      {!role.isSystem && onEdit && onDelete && (
        <>
          <span className="text-slate-200">|</span>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
          <span className="text-slate-200">|</span>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </>
      )}
      {role.isSystem && (
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Lock className="h-3 w-3" /> Read-only
        </span>
      )}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminRoles() {
  const customRoles = useAppStore(s => s.customRoles);
  const addCustomRole = useAppStore(s => s.addCustomRole);
  const updateCustomRole = useAppStore(s => s.updateCustomRole);
  const deleteCustomRole = useAppStore(s => s.deleteCustomRole);
  const userCounts = useUserCounts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewExpanded, setViewExpanded] = useState<string[]>([]);

  // ── open helpers ──

  const openCreate = () => {
    setForm(defaultForm);
    setExpandedCategories([]);
    setCreateOpen(true);
  };

  const openEdit = (role: Role) => {
    setForm({ name: role.name, description: role.description, color: role.color, permissions: [...role.permissions] });
    setExpandedCategories([]);
    setEditRole(role);
  };

  const openView = (role: Role) => {
    setViewRole(role);
    setViewExpanded([]);
  };

  const closeCreate = () => { setCreateOpen(false); setForm(defaultForm); };
  const closeEdit = () => { setEditRole(null); setForm(defaultForm); };

  // ── save ──

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editRole) {
      updateCustomRole(editRole.id, { name: form.name, description: form.description, color: form.color, permissions: form.permissions });
      closeEdit();
    } else {
      addCustomRole({ name: form.name, description: form.description, color: form.color, permissions: form.permissions });
      closeCreate();
    }
  };

  // ── user count for custom role (best-effort by name matching) ──

  const customRoleUserCount = (_role: Role) => 0; // custom roles are not assigned via UserRole enum yet

  const systemUserCount = (role: Role): number => {
    const key = SYSTEM_ROLE_USER_KEY[role.id];
    return key ? userCounts[key] : 0;
  };

  const isFormValid = form.name.trim().length > 0;

  // ── modal shared form body ──

  const FormBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role Name <span className="text-red-500">*</span></label>
          <input
            className="input w-full"
            placeholder="e.g. Content Moderator"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_SWATCHES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className="h-7 w-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: form.color === c ? '#1e1b4b' : 'transparent',
                  transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          className="input w-full resize-none"
          rows={2}
          placeholder="What can users with this role do?"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Permissions</label>
          <span className="text-xs text-indigo-600 font-medium">{form.permissions.length} selected</span>
        </div>
        <div className="max-h-72 overflow-y-auto pr-1">
          <PermMatrix
            selected={form.permissions}
            onChange={perms => setForm(f => ({ ...f, permissions: perms }))}
            expanded={expandedCategories}
            setExpanded={setExpandedCategories}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout title="Roles & Permissions">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
              Roles &amp; Permissions
            </h1>
            <p className="text-slate-500 mt-1">Define what each type of user can access and do on the platform.</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" /> Create Role
          </button>
        </div>

        {/* Info callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">System roles</span> are built-in and cannot be deleted. Create custom roles to assign granular permissions to specific users.
          </p>
        </div>

        {/* System Roles */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" /> System Roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SYSTEM_ROLES.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                userCount={systemUserCount(role)}
                onView={() => openView(role)}
              />
            ))}
          </div>
        </section>

        {/* Custom Roles */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" /> Custom Roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {customRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                userCount={customRoleUserCount(role)}
                onEdit={() => openEdit(role)}
                onDelete={() => deleteCustomRole(role.id)}
                onView={() => openView(role)}
              />
            ))}

            {/* Create card */}
            <button
              onClick={openCreate}
              className="card p-4 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors min-h-[140px] text-slate-400 hover:text-indigo-600"
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Create New Role</span>
            </button>
          </div>
          {customRoles.length === 0 && (
            <p className="text-xs text-slate-400 mt-2 ml-1">No custom roles yet. Click "Create New Role" to get started.</p>
          )}
        </section>

      </div>

      {/* ── Create Modal ── */}
      <Modal isOpen={createOpen} onClose={closeCreate} title="Create New Role" size="xl">
        {FormBody}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={closeCreate} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!isFormValid} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            Create Role
          </button>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editRole} onClose={closeEdit} title={`Edit Role: ${editRole?.name ?? ''}`} size="xl">
        {FormBody}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={closeEdit} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!isFormValid} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </div>
      </Modal>

      {/* ── View Permissions Modal ── */}
      <Modal
        isOpen={!!viewRole}
        onClose={() => setViewRole(null)}
        title={`${viewRole?.name ?? ''} — Permissions`}
        size="xl"
      >
        {viewRole && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: viewRole.color }} />
              <div>
                <p className="text-sm font-medium text-slate-800">{viewRole.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">{viewRole.permissions.length} permissions granted</p>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <PermMatrix
                selected={viewRole.permissions}
                onChange={() => {}}
                readOnly
                expanded={viewExpanded}
                setExpanded={setViewExpanded}
              />
            </div>
          </div>
        )}
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setViewRole(null)} className="btn-secondary">Close</button>
        </div>
      </Modal>

    </AppLayout>
  );
}
