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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 8;

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
      const nextCode = getNextStationCode();
      setCreateForm({ code: nextCode, name: '', city: '', country: '' });
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

  // Filter stations based on search query
  const filteredStations = stations?.filter((station) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      station.code?.toLowerCase().includes(query) ||
      station.name?.toLowerCase().includes(query) ||
      station.city?.toLowerCase().includes(query) ||
      station.country?.toLowerCase().includes(query)
    );
  }) || [];

  // Pagination calculations
  const totalStations = filteredStations.length;
  const totalPages = Math.ceil(totalStations / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStations = filteredStations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Auto-increment station code
  const getNextStationCode = () => {
    if (!stations || stations.length === 0) return '001';
    
    // Extract numeric codes and find the highest
    const numericCodes = stations
      .map((s) => {
        const match = s.code?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => n > 0);
    
    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
    const nextCode = maxCode + 1;
    
    // Format as 3-digit code (001, 002, etc.)
    return nextCode.toString().padStart(3, '0');
  };

  const handleOpenCreateModal = () => {
    const nextCode = getNextStationCode();
    setCreateForm({ code: nextCode, name: '', city: '', country: '' });
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      <Header activeTab="master-data" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Station Management</h1>
            <Button onClick={handleOpenCreateModal}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Station
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by code, name, city, or country..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent text-sm"
              />
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CODE</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CITY</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COUNTRY</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStations.map((station) => (
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
              {stations && stations.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, totalStations)}</span> of <span className="font-semibold">{totalStations}</span> stations
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-[#00A651] text-white'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-gray-500">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
          const nextCode = getNextStationCode();
          setCreateForm({ code: nextCode, name: '', city: '', country: '' });
          createValidation.clearErrors();
        }}
        title="Create Station"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                const nextCode = getNextStationCode();
                setCreateForm({ code: nextCode, name: '', city: '', country: '' });
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

