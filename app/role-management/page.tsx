'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { NotificationContainer } from '../components/ui/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole, useAssignPermissions } from '@/hooks/api/useRoles';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createRoleSchema, updateRoleSchema } from '@/lib/validations';
import { auth } from '@/lib/auth';

export default function RoleManagement() {
  const router = useRouter();
  const { isChecking } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPermissions = useAssignPermissions();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const createValidation = useFormValidation(createRoleSchema);
  const updateValidation = useFormValidation(updateRoleSchema);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isAdmin: false,
  });

  const [editForm, setEditForm] = useState({
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

  if (!auth.isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const handleCreate = async () => {
    if (!createValidation.validate(createForm)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    try {
      await createRole.mutateAsync(createForm);
      addNotification('success', 'Role Created', 'Role has been created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', isAdmin: false });
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', 'Create Failed', error.message || 'Failed to create role');
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description,
      isAdmin: role.isAdmin,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRole || !updateValidation.validate(editForm)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    try {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        data: editForm,
      });
      addNotification('success', 'Role Updated', 'Role has been updated successfully');
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      addNotification('error', 'Update Failed', error.message || 'Failed to update role');
    }
  };

  const handleOpenPermissions = (role: any) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p: any) => p.id) || []);
    setIsPermissionsModalOpen(true);
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole) return;

    try {
      await assignPermissions.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: selectedPermissions,
      });
      addNotification('success', 'Permissions Assigned', 'Permissions have been assigned successfully');
      setIsPermissionsModalOpen(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      addNotification('error', 'Assignment Failed', error.message || 'Failed to assign permissions');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole.mutateAsync(id);
      addNotification('success', 'Role Deactivated', 'Role has been deactivated successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      addNotification('error', 'Delete Failed', error.message || 'Failed to deactivate role');
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions?.reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="account-management" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role Management</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles?.map((role) => (
                      <tr key={role.id} className={!role.isActive ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{role.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role.isAdmin ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Standard</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {role.permissions?.length || 0} permissions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!role.isAdmin && (
                              <button
                                onClick={() => handleOpenPermissions(role)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Permissions
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(role)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            {deleteConfirm === role.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(role.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(role.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={role.isAdmin}
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
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateForm({ name: '', description: '', isAdmin: false });
          createValidation.clearErrors();
        }}
        title="Create Role"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateForm({ name: '', description: '', isAdmin: false });
                createValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createRole.isPending}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={createForm.name}
            onChange={(e) => {
              setCreateForm({ ...createForm, name: e.target.value });
              createValidation.setFieldTouched('name');
            }}
            onBlur={() => createValidation.setFieldTouched('name')}
            error={createValidation.getFieldError('name')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => {
                setCreateForm({ ...createForm, description: e.target.value });
                createValidation.setFieldTouched('description');
              }}
              onBlur={() => createValidation.setFieldTouched('description')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              rows={3}
              required
            />
            {createValidation.getFieldError('description') && (
              <p className="mt-1 text-sm text-red-600">{createValidation.getFieldError('description')}</p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={createForm.isAdmin}
              onChange={(e) => setCreateForm({ ...createForm, isAdmin: e.target.checked })}
              className="w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
            />
            <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-700">
              Admin Role (has all permissions automatically)
            </label>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
          updateValidation.clearErrors();
        }}
        title="Edit Role"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
                updateValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={updateRole.isPending}>
              Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => {
              setEditForm({ ...editForm, name: e.target.value });
              updateValidation.setFieldTouched('name');
            }}
            onBlur={() => updateValidation.setFieldTouched('name')}
            error={updateValidation.getFieldError('name')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => {
                setEditForm({ ...editForm, description: e.target.value });
                updateValidation.setFieldTouched('description');
              }}
              onBlur={() => updateValidation.setFieldTouched('description')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              rows={3}
              required
            />
            {updateValidation.getFieldError('description') && (
              <p className="mt-1 text-sm text-red-600">{updateValidation.getFieldError('description')}</p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsAdmin"
              checked={editForm.isAdmin}
              onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
              className="w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
            />
            <label htmlFor="editIsAdmin" className="ml-2 text-sm text-gray-700">
              Admin Role (has all permissions automatically)
            </label>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setSelectedRole(null);
          setSelectedPermissions([]);
        }}
        title={`Assign Permissions - ${selectedRole?.name}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsPermissionsModalOpen(false);
                setSelectedRole(null);
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions} isLoading={assignPermissions.isPending}>
              Assign Permissions
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
            <div key={category} className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
              <div className="space-y-2">
                {perms.map((perm: any) => (
                  <label key={perm.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-1 w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

