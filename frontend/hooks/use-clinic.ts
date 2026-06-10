import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicApi, type ClinicProfile } from '@/lib/clinic';

export function useClinicProfile() {
  return useQuery({ queryKey: ['clinic-profile'], queryFn: clinicApi.getProfile });
}

export function useUpdateClinicProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ClinicProfile, 'id'>) => clinicApi.updateProfile(data),
    onSuccess: (data) => qc.setQueryData(['clinic-profile'], data),
  });
}
