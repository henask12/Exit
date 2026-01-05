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
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from '@/hooks/api/useStations';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createStationSchema, updateStationSchema } from '@/lib/validations';
import { auth } from '@/lib/auth';

export default function StationManagement() {
  const router = useRouter();
  const { isChecking } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: stations, isLoading } = useStations();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const createValidation = useFormValidation(createStationSchema);
  const updateValidation = useFormValidation(updateStationSchema);

  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    city: '',
    country: '',
  });

  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    city: '',
    country: '',
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
      await createStation.mutateAsync({
        ...createForm,
        code: createForm.code.toUpperCase(),
      });
      addNotification('success', 'Station Created', 'Station has been created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ code: '', name: '', city: '', country: '' });
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', 'Create Failed', error.message || 'Failed to create station');
    }
  };

  const handleEdit = (station: any) => {
    setSelectedStation(station);
    setEditForm({
      code: station.code,
      name: station.name,
      city: station.city,
      country: station.country,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedStation || !updateValidation.validate(editForm)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    try {
      await updateStation.mutateAsync({
        id: selectedStation.id,
        data: {
          ...editForm,
          code: editForm.code.toUpperCase(),
        },
      });
      addNotification('success', 'Station Updated', 'Station has been updated successfully');
      setIsEditModalOpen(false);
      setSelectedStation(null);
    } catch (error: any) {
      addNotification('error', 'Update Failed', error.message || 'Failed to update station');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStation.mutateAsync(id);
      addNotification('success', 'Station Deactivated', 'Station has been deactivated successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      addNotification('error', 'Delete Failed', error.message || 'Failed to deactivate station');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="master-data" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Station Management</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Station
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stations?.map((station) => (
                      <tr key={station.id} className={!station.isActive ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{station.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.city}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            station.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {station.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(station)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            {deleteConfirm === station.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(station.id)}
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
                                onClick={() => setDeleteConfirm(station.id)}
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
          setCreateForm({ code: '', name: '', city: '', country: '' });
          createValidation.clearErrors();
        }}
        title="Create Station"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateForm({ code: '', name: '', city: '', country: '' });
                createValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createStation.isPending}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Code (3 characters)"
            value={createForm.code}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().slice(0, 3);
              setCreateForm({ ...createForm, code: value });
              createValidation.setFieldTouched('code');
            }}
            onBlur={() => createValidation.setFieldTouched('code')}
            error={createValidation.getFieldError('code')}
            maxLength={3}
            required
          />
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
          <Input
            label="City"
            value={createForm.city}
            onChange={(e) => {
              setCreateForm({ ...createForm, city: e.target.value });
              createValidation.setFieldTouched('city');
            }}
            onBlur={() => createValidation.setFieldTouched('city')}
            error={createValidation.getFieldError('city')}
            required
          />
          <Input
            label="Country"
            value={createForm.country}
            onChange={(e) => {
              setCreateForm({ ...createForm, country: e.target.value });
              createValidation.setFieldTouched('country');
            }}
            onBlur={() => createValidation.setFieldTouched('country')}
            error={createValidation.getFieldError('country')}
            required
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStation(null);
          updateValidation.clearErrors();
        }}
        title="Edit Station"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedStation(null);
                updateValidation.clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={updateStation.isPending}>
              Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Code (3 characters)"
            value={editForm.code}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().slice(0, 3);
              setEditForm({ ...editForm, code: value });
              updateValidation.setFieldTouched('code');
            }}
            onBlur={() => updateValidation.setFieldTouched('code')}
            error={updateValidation.getFieldError('code')}
            maxLength={3}
            required
          />
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
          <Input
            label="City"
            value={editForm.city}
            onChange={(e) => {
              setEditForm({ ...editForm, city: e.target.value });
              updateValidation.setFieldTouched('city');
            }}
            onBlur={() => updateValidation.setFieldTouched('city')}
            error={updateValidation.getFieldError('city')}
            required
          />
          <Input
            label="Country"
            value={editForm.country}
            onChange={(e) => {
              setEditForm({ ...editForm, country: e.target.value });
              updateValidation.setFieldTouched('country');
            }}
            onBlur={() => updateValidation.setFieldTouched('country')}
            error={updateValidation.getFieldError('country')}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

