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
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CODE</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CITY</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COUNTRY</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stations?.map((station) => (
                      <tr key={station.id} className={`hover:bg-gray-50 transition-colors ${!station.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-900 text-sm font-bold tracking-wider">
                            {station.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{station.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{station.city}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{station.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            station.isActive ? 'bg-[#00A651] text-white' : 'bg-red-100 text-red-800'
                          }`}>
                            {station.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleEdit(station)}
                              className="p-2 text-[#00A651] hover:bg-[#00A651]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {deleteConfirm === station.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(station.id)}
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
                                onClick={() => setDeleteConfirm(station.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Deactivate"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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

