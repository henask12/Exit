'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { NotificationContainer } from '../components/ui/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole, useAssignPermissions } from '@/hooks/api/useRoles';
import { Role, Permission } from '@/lib/auth';
import { createRoleSchema, updateRoleSchema } from '@/lib/validations';
import { useFormValidation } from '@/hooks/useFormValidation';

export default function RoleManagement() {
  const { isChecking } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: permissions = [] } = usePermissions();
  
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPermissions = useAssignPermissions();

  const createValidation = useFormValidation(createRoleSchema);
  const updateValidation = useFormValidation(updateRoleSchema);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isAdmin: false,
  });

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createValidation.validate(formData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await createRole.mutateAsync(formData);
      addNotification('success', 'Role created successfully');
      setShowCreateModal(false);
      resetForm();
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to create role');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!updateValidation.validate(formData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        data: formData,
      });
      addNotification('success', 'Role updated successfully');
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
      updateValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to update role');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this role?')) return;
    try {
      await deleteRole.mutateAsync(id);
      addNotification('success', 'Role deactivated successfully');
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to deactivate role');
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole) return;
    try {
      await assignPermissions.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: selectedPermissions,
      });
      addNotification('success', 'Permissions assigned successfully');
      setShowPermissionsModal(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to assign permissions');
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      isAdmin: role.isAdmin,
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isAdmin: false,
    });
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="settings" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Role & Permission Management</h2>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + Add Role
          </Button>
        </div>

        {isLoadingRoles ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading roles...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Permissions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{role.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{role.description}</td>
                      <td className="px-4 py-3">
                        {role.isAdmin ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Admin</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {role.isAdmin ? 'All Permissions' : `${role.permissions?.length || 0} permissions`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!role.isAdmin && (
                            <>
                              <button
                                onClick={() => openPermissionsModal(role)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Permissions
                              </button>
                              <button
                                onClick={() => openEditModal(role)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </>
                          )}
                          {!role.isAdmin && (
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); createValidation.clearErrors(); }}
        title="Create New Role"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); createValidation.clearErrors(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createRole.isPending}>
              {createRole.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                createValidation.validateField('name', e.target.value);
              }}
              onBlur={() => createValidation.setFieldTouched('name')}
              required
            />
            {createValidation.getFieldError('name') && (
              <p className="text-xs text-red-600 mt-1">{createValidation.getFieldError('name')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                createValidation.validateField('description', e.target.value);
              }}
              onBlur={() => createValidation.setFieldTouched('description')}
              required
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] ${
                createValidation.getFieldError('description') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {createValidation.getFieldError('description') && (
              <p className="text-xs text-red-600 mt-1">{createValidation.getFieldError('description')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]"
            />
            <label htmlFor="isAdmin" className="text-sm font-semibold text-gray-700">Admin Role (has all permissions)</label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedRole(null); resetForm(); updateValidation.clearErrors(); }}
        title="Edit Role"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedRole(null); resetForm(); updateValidation.clearErrors(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateRole.isPending}>
              {updateRole.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                updateValidation.validateField('name', e.target.value);
              }}
              onBlur={() => updateValidation.setFieldTouched('name')}
              required
            />
            {updateValidation.getFieldError('name') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('name')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                updateValidation.validateField('description', e.target.value);
              }}
              onBlur={() => updateValidation.setFieldTouched('description')}
              required
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] ${
                updateValidation.getFieldError('description') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {updateValidation.getFieldError('description') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('description')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAdminEdit"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              disabled={selectedRole?.isAdmin}
              className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651] disabled:opacity-50"
            />
            <label htmlFor="isAdminEdit" className="text-sm font-semibold text-gray-700">
              Admin Role {selectedRole?.isAdmin && '(Cannot be modified)'}
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPermissionsModal}
        onClose={() => { setShowPermissionsModal(false); setSelectedRole(null); setSelectedPermissions([]); }}
        title={`Assign Permissions to ${selectedRole?.name || ''}`}
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowPermissionsModal(false); setSelectedRole(null); setSelectedPermissions([]); }}>
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions} disabled={assignPermissions.isPending}>
              {assignPermissions.isPending ? 'Assigning...' : `Assign ${selectedPermissions.length} Permissions`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 mb-6">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{category}</h4>
              <div className="space-y-2">
                {perms.map((perm) => (
                  <label key={perm.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, perm.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                      {perm.description && (
                        <p className="text-xs text-gray-500">{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}
