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
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from '@/hooks/api/useStations';
import { Station } from '@/lib/auth';
import { createStationSchema, updateStationSchema } from '@/lib/validations';
import { useFormValidation } from '@/hooks/useFormValidation';

export default function StationManagement() {
  const { isChecking } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { data: stations = [], isLoading } = useStations();
  
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  const createValidation = useFormValidation(createStationSchema);
  const updateValidation = useFormValidation(updateStationSchema);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createValidation.validate(formData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await createStation.mutateAsync(formData);
      addNotification('success', 'Station created successfully');
      setShowCreateModal(false);
      resetForm();
      createValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to create station');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;
    if (!updateValidation.validate(formData)) {
      addNotification('error', 'Please fix the form errors');
      return;
    }
    try {
      await updateStation.mutateAsync({
        id: selectedStation.id,
        data: formData,
      });
      addNotification('success', 'Station updated successfully');
      setShowEditModal(false);
      setSelectedStation(null);
      resetForm();
      updateValidation.clearErrors();
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to update station');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this station?')) return;
    try {
      await deleteStation.mutateAsync(id);
      addNotification('success', 'Station deactivated successfully');
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to deactivate station');
    }
  };

  const openEditModal = (station: Station) => {
    setSelectedStation(station);
    setFormData({
      code: station.code,
      name: station.name,
      city: station.city,
      country: station.country,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      city: '',
      country: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="settings" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Station Management</h2>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + Add Station
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading stations...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stations.map((station) => (
                    <tr key={station.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{station.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{station.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{station.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{station.country}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${station.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {station.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(station)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(station.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
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
        onClose={() => { setShowCreateModal(false); resetForm(); createValidation.clearErrors(); }}
        title="Create New Station"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); createValidation.clearErrors(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createStation.isPending}>
              {createStation.isPending ? 'Creating...' : 'Create Station'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
            <Input
              value={formData.code}
              onChange={(e) => {
                const upperCode = e.target.value.toUpperCase();
                setFormData({ ...formData, code: upperCode });
                createValidation.validateField('code', upperCode);
              }}
              onBlur={() => createValidation.setFieldTouched('code')}
              required
              maxLength={3}
              placeholder="e.g., ADD"
            />
            {createValidation.getFieldError('code') && (
              <p className="text-xs text-red-600 mt-1">{createValidation.getFieldError('code')}</p>
            )}
          </div>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
            <Input
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                createValidation.validateField('city', e.target.value);
              }}
              onBlur={() => createValidation.setFieldTouched('city')}
              required
            />
            {createValidation.getFieldError('city') && (
              <p className="text-xs text-red-600 mt-1">{createValidation.getFieldError('city')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => {
                setFormData({ ...formData, country: e.target.value });
                createValidation.validateField('country', e.target.value);
              }}
              onBlur={() => createValidation.setFieldTouched('country')}
              required
            />
            {createValidation.getFieldError('country') && (
              <p className="text-xs text-red-600 mt-1">{createValidation.getFieldError('country')}</p>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedStation(null); resetForm(); updateValidation.clearErrors(); }}
        title="Edit Station"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedStation(null); resetForm(); updateValidation.clearErrors(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateStation.isPending}>
              {updateStation.isPending ? 'Updating...' : 'Update Station'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
            <Input
              value={formData.code}
              onChange={(e) => {
                const upperCode = e.target.value.toUpperCase();
                setFormData({ ...formData, code: upperCode });
                updateValidation.validateField('code', upperCode);
              }}
              onBlur={() => updateValidation.setFieldTouched('code')}
              required
              maxLength={3}
            />
            {updateValidation.getFieldError('code') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('code')}</p>
            )}
          </div>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
            <Input
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                updateValidation.validateField('city', e.target.value);
              }}
              onBlur={() => updateValidation.setFieldTouched('city')}
              required
            />
            {updateValidation.getFieldError('city') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('city')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => {
                setFormData({ ...formData, country: e.target.value });
                updateValidation.validateField('country', e.target.value);
              }}
              onBlur={() => updateValidation.setFieldTouched('country')}
              required
            />
            {updateValidation.getFieldError('country') && (
              <p className="text-xs text-red-600 mt-1">{updateValidation.getFieldError('country')}</p>
            )}
          </div>
        </form>
      </Modal>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}
