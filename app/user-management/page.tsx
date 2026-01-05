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
import { auth } from '@/lib/auth';

export default function UserManagement() {
  const router = useRouter();
  const { isChecking } = useAuth();
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
      await deleteUser.mutateAsync(id);
      addNotification('success', 'User Deactivated', 'User has been deactivated successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      addNotification('error', 'Delete Failed', error.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="account-management" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((user) => (
                      <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName} {user.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.stationCode || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.roleName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            {deleteConfirm === user.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(user.id)}
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
                                onClick={() => setDeleteConfirm(user.id)}
                                className="text-red-600 hover:text-red-900"
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

