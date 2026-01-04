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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/api/useUsers';
import { useStations } from '@/hooks/api/useStations';
import { useRoles } from '@/hooks/api/useRoles';
import { User } from '@/lib/auth';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { useFormValidation } from '@/hooks/useFormValidation';

export default function UserManagement() {
  const { isChecking } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { data: stations = [] } = useStations();
  const { data: roles = [] } = useRoles();
  
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const createValidation = useFormValidation(createUserSchema);
  const updateValidation = useFormValidation(updateUserSchema);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createValidation.validate(formData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await createUser.mutateAsync(formData);
      addNotification('success', 'User created successfully');
      setShowCreateModal(false);
      resetForm();
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to create user');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const updateData = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      stationId: formData.stationId,
      roleId: formData.roleId,
      isActive: formData.isActive,
    };
    if (!updateValidation.validate(updateData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data: updateData,
      });
      addNotification('success', 'User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      updateValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await deleteUser.mutateAsync(id);
      addNotification('success', 'User deactivated successfully');
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to deactivate user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      employeeId: user.employeeId,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      stationId: user.stationId,
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      stationId: 0,
      roleId: 0,
      isActive: true,
    });
  };

  const activeStations = stations.filter((s) => s.isActive);
  const activeRoles = roles.filter((r) => r.isActive);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="settings" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + Add User
          </Button>
        </div>

        {isLoadingUsers ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Station</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{user.employeeId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.stationCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.roleName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Deactivate
                          </button>
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
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New User"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
            <Input
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Station</label>
            <select
              value={formData.stationId}
              onChange={(e) => setFormData({ ...formData, stationId: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]"
            >
              <option value={0}>Select Station</option>
              {activeStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]"
            >
              <option value={0}>Select Role</option>
              {activeRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
        title="Edit User"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
            <Input value={formData.employeeId} disabled className="bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                updateValidation.validateField('email', e.target.value);
              }}
              onBlur={() => updateValidation.setFieldTouched('email')}
              required
            />
            {updateValidation.getFieldError('email') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('email')}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  updateValidation.validateField('firstName', e.target.value);
                }}
                onBlur={() => updateValidation.setFieldTouched('firstName')}
                required
              />
              {updateValidation.getFieldError('firstName') && (
                <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('firstName')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  updateValidation.validateField('lastName', e.target.value);
                }}
                onBlur={() => updateValidation.setFieldTouched('lastName')}
                required
              />
              {updateValidation.getFieldError('lastName') && (
                <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('lastName')}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Station</label>
            <select
              value={formData.stationId}
              onChange={(e) => {
                setFormData({ ...formData, stationId: Number(e.target.value) });
                updateValidation.validateField('stationId', Number(e.target.value));
              }}
              onBlur={() => updateValidation.setFieldTouched('stationId')}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] ${
                updateValidation.getFieldError('stationId') ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value={0}>Select Station</option>
              {activeStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
            {updateValidation.getFieldError('stationId') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('stationId')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => {
                setFormData({ ...formData, roleId: Number(e.target.value) });
                updateValidation.validateField('roleId', Number(e.target.value));
              }}
              onBlur={() => updateValidation.setFieldTouched('roleId')}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651] ${
                updateValidation.getFieldError('roleId') ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value={0}>Select Role</option>
              {activeRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {updateValidation.getFieldError('roleId') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('roleId')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active</label>
          </div>
        </form>
      </Modal>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}
