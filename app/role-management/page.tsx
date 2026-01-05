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
  const [searchQuery, setSearchQuery] = useState('');

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
    isActive: true,
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
      isActive: role.isActive !== undefined ? role.isActive : true,
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

  const handleDeactivate = async (role: any) => {
    try {
      await updateRole.mutateAsync({
        id: role.id,
        data: {
          name: role.name,
          description: role.description,
          isAdmin: role.isAdmin,
          isActive: false,
        } as any,
      });
      addNotification('success', 'Role Deactivated', 'Role has been deactivated successfully');
    } catch (error: any) {
      addNotification('error', 'Deactivate Failed', error.message || 'Failed to deactivate role');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole.mutateAsync(id);
      addNotification('success', 'Role Deleted', 'Role has been permanently deleted');
      setDeleteConfirm(null);
    } catch (error: any) {
      addNotification('error', 'Delete Failed', error.message || 'Failed to delete role');
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
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      <Header activeTab="account-management" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Role Management</h1>
            <p className="text-gray-600 text-sm sm:text-base mb-4">Manage user roles and access permissions for station staff.</p>
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by role name or permission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-[#00A651] text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div></div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ROLE NAME</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DESCRIPTION</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ASSIGNED USERS</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LAST MODIFIED</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles?.filter((role) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return role.name.toLowerCase().includes(query) ||
                             role.description?.toLowerCase().includes(query) ||
                             role.permissions?.some((p: any) => p.name?.toLowerCase().includes(query));
                    }).map((role, index) => {
                      const roleColors = [
                        { bg: 'bg-blue-500', text: 'text-white' },
                        { bg: 'bg-purple-500', text: 'text-white' },
                        { bg: 'bg-orange-500', text: 'text-white' },
                        { bg: 'bg-green-500', text: 'text-white' },
                        { bg: 'bg-red-500', text: 'text-white' },
                        { bg: 'bg-indigo-500', text: 'text-white' },
                      ];
                      const colorIndex = index % roleColors.length;
                      const roleColor = roleColors[colorIndex];
                      const roleInitial = role.name.charAt(0).toUpperCase();
                      const assignedUsersCount = Math.floor(Math.random() * 50) + 1; // Mock data
                      const visibleAvatars = Math.min(3, assignedUsersCount);
                      const lastModified = (role as any).updatedAt 
                        ? new Date((role as any).updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A';

                      return (
                        <tr key={role.id} className={`hover:bg-gray-50 transition-colors ${!role.isActive ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${roleColor.bg} rounded-full flex items-center justify-center ${roleColor.text} font-bold text-sm flex-shrink-0`}>
                                {roleInitial}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{role.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{role.description || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {Array.from({ length: visibleAvatars }).map((_, i) => {
                                  const avatarColors = ['bg-blue-500', 'bg-gray-400', 'bg-purple-500', 'bg-orange-500'];
                                  return (
                                    <div
                                      key={i}
                                      className={`w-8 h-8 ${avatarColors[i % avatarColors.length]} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold`}
                                    >
                                      {String.fromCharCode(65 + i)}
                                    </div>
                                  );
                                })}
                              </div>
                              {assignedUsersCount > visibleAvatars && (
                                <span className="text-sm text-gray-600">+{assignedUsersCount - visibleAvatars} others</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lastModified}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(role)}
                                className="p-2 text-[#00A651] hover:bg-[#00A651]/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {!role.isAdmin && (
                                <button
                                  onClick={() => handleOpenPermissions(role)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Assign Permission"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeactivate(role)}
                                disabled={!role.isActive || role.isAdmin}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Deactivate"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                              {!role.isAdmin && (
                                <button
                                  onClick={() => {
                                    setDeleteConfirm(role.id);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {roles && roles.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">1</span> to <span className="font-semibold">{Math.min(3, roles.length)}</span> of <span className="font-semibold">{roles.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
            />
            <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
              Active Role
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Role"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirm !== null) {
                  handleDelete(deleteConfirm);
                }
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900 mb-1">Are you sure you want to delete this role?</p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The role will be permanently removed from the system.
              </p>
              {deleteConfirm && roles?.find(r => r.id === deleteConfirm) && (
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Role: <span className="text-gray-700">{roles.find(r => r.id === deleteConfirm)?.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

