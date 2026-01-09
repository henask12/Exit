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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/api/useUsers';
import { useStations } from '@/hooks/api/useStations';
import { useRoles } from '@/hooks/api/useRoles';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createUserSchema, updateUserSchema } from '@/lib/validations';

export default function UserManagement() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: users, isLoading } = useUsers();
  const { data: stations } = useStations();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const createValidation = useFormValidation(createUserSchema);
  const updateValidation = useFormValidation(updateUserSchema);

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    stationId: 0,
    roleId: 0,
  });

  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    stationId: 0,
    roleId: 0,
    isActive: true,
  });

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleCreate = async () => {
    if (!createValidation.validate(createForm)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    try {
      await createUser.mutateAsync(createForm);
      addNotification('success', 'User Created', 'User has been created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({
        employeeId: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        stationId: 0,
        roleId: 0,
      });
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', 'Create Failed', error.message || 'Failed to create user');
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      stationId: user.stationId,
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser || !updateValidation.validate(editForm)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data: editForm,
      });
      addNotification('success', 'User Updated', 'User has been updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      addNotification('error', 'Update Failed', error.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const userToDelete = users?.find(u => u.id === id);
      await deleteUser.mutateAsync(id);
      addNotification('success', 'Deletion Successful', userToDelete ? `User ${userToDelete.firstName} ${userToDelete.lastName} has been permanently removed from the system.` : 'User has been permanently removed from the system.');
      setDeleteConfirm(null);
    } catch (error: any) {
      addNotification('error', 'Delete Failed', error.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      <Header activeTab="account-management" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">System Administration</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage system access and permissions for ground staff across all international stations.</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add New User</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ROLE</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATION</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LAST ACTIVE</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((user) => {
                      const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                      const colors = ['bg-blue-500', 'bg-orange-500', 'bg-red-500', 'bg-amber-600', 'bg-purple-500', 'bg-green-500'];
                      const colorIndex = user.id % colors.length;
                      const avatarColor = colors[colorIndex];
                      
                      return (
                        <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                                {initials}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              user.roleName === 'System Admin' ? 'bg-purple-100 text-purple-800' :
                              user.roleName === 'Supervisor' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.roleName || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {user.stationCode ? `${user.stationCode}-${user.stationName || ''}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.lastActive ? (
                              <span className="flex items-center gap-1">
                                {user.lastActive.includes('min') && <span className="w-2 h-2 bg-[#00A651] rounded-full"></span>}
                                {user.lastActive}
                              </span>
                            ) : (
                              'Never'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 text-[#00A651] hover:bg-[#00A651]/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {deleteConfirm === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Confirm"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Cancel"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              {users && users.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{users.length}</span> of <span className="font-semibold">{users.length}</span> users
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium bg-[#00A651] text-white rounded-lg">
                      1
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                      2
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                      3
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
          setCreateForm({
            employeeId: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            stationId: 0,
            roleId: 0,
          });
          createValidation.clearErrors();
        }}
        title="Create User"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateForm({
                  employeeId: '',
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  stationId: 0,
                  roleId: 0,
                });
                createValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createUser.isPending}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Employee ID"
            type="text"
            value={createForm.employeeId}
            onChange={(e) => {
              setCreateForm({ ...createForm, employeeId: e.target.value });
              createValidation.setFieldTouched('employeeId');
            }}
            onBlur={() => createValidation.setFieldTouched('employeeId')}
            error={createValidation.getFieldError('employeeId')}
            required
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => {
              setCreateForm({ ...createForm, email: e.target.value });
              createValidation.setFieldTouched('email');
            }}
            onBlur={() => createValidation.setFieldTouched('email')}
            error={createValidation.getFieldError('email')}
            required
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => {
              setCreateForm({ ...createForm, password: e.target.value });
              createValidation.setFieldTouched('password');
            }}
            onBlur={() => createValidation.setFieldTouched('password')}
            error={createValidation.getFieldError('password')}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={createForm.firstName}
              onChange={(e) => {
                setCreateForm({ ...createForm, firstName: e.target.value });
                createValidation.setFieldTouched('firstName');
              }}
              onBlur={() => createValidation.setFieldTouched('firstName')}
              error={createValidation.getFieldError('firstName')}
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={createForm.lastName}
              onChange={(e) => {
                setCreateForm({ ...createForm, lastName: e.target.value });
                createValidation.setFieldTouched('lastName');
              }}
              onBlur={() => createValidation.setFieldTouched('lastName')}
              error={createValidation.getFieldError('lastName')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              value={createForm.stationId}
              onChange={(e) => {
                setCreateForm({ ...createForm, stationId: Number(e.target.value) });
                createValidation.setFieldTouched('stationId');
              }}
              onBlur={() => createValidation.setFieldTouched('stationId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              required
            >
              <option value={0}>Select Station</option>
              {stations?.filter(s => s.isActive).map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
            {createValidation.getFieldError('stationId') && (
              <p className="mt-1 text-sm text-red-600">{createValidation.getFieldError('stationId')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={createForm.roleId}
              onChange={(e) => {
                setCreateForm({ ...createForm, roleId: Number(e.target.value) });
                createValidation.setFieldTouched('roleId');
              }}
              onBlur={() => createValidation.setFieldTouched('roleId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              required
            >
              <option value={0}>Select Role</option>
              {roles?.filter(r => r.isActive).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {createValidation.getFieldError('roleId') && (
              <p className="mt-1 text-sm text-red-600">{createValidation.getFieldError('roleId')}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          updateValidation.clearErrors();
        }}
        title="Edit User"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                updateValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={updateUser.isPending}>
              Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => {
              setEditForm({ ...editForm, email: e.target.value });
              updateValidation.setFieldTouched('email');
            }}
            onBlur={() => updateValidation.setFieldTouched('email')}
            error={updateValidation.getFieldError('email')}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={editForm.firstName}
              onChange={(e) => {
                setEditForm({ ...editForm, firstName: e.target.value });
                updateValidation.setFieldTouched('firstName');
              }}
              onBlur={() => updateValidation.setFieldTouched('firstName')}
              error={updateValidation.getFieldError('firstName')}
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={editForm.lastName}
              onChange={(e) => {
                setEditForm({ ...editForm, lastName: e.target.value });
                updateValidation.setFieldTouched('lastName');
              }}
              onBlur={() => updateValidation.setFieldTouched('lastName')}
              error={updateValidation.getFieldError('lastName')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              value={editForm.stationId}
              onChange={(e) => {
                setEditForm({ ...editForm, stationId: Number(e.target.value) });
                updateValidation.setFieldTouched('stationId');
              }}
              onBlur={() => updateValidation.setFieldTouched('stationId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              required
            >
              <option value={0}>Select Station</option>
              {stations?.filter(s => s.isActive).map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
            {updateValidation.getFieldError('stationId') && (
              <p className="mt-1 text-sm text-red-600">{updateValidation.getFieldError('stationId')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={editForm.roleId}
              onChange={(e) => {
                setEditForm({ ...editForm, roleId: Number(e.target.value) });
                updateValidation.setFieldTouched('roleId');
              }}
              onBlur={() => updateValidation.setFieldTouched('roleId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              required
            >
              <option value={0}>Select Role</option>
              {roles?.filter(r => r.isActive).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {updateValidation.getFieldError('roleId') && (
              <p className="mt-1 text-sm text-red-600">{updateValidation.getFieldError('roleId')}</p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

