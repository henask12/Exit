import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stationAPI } from '@/lib/auth';

export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: () => stationAPI.getAll(),
  });
}

export function useStation(id: number) {
  return useQuery({
    queryKey: ['stations', id],
    queryFn: () => stationAPI.getById(id),
    enabled: !!id,
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof stationAPI.update>[1] }) =>
      stationAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}

