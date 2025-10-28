import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { StaffProfile } from '../types' // Assuming a shared types file

// --- Query Hook ---

const fetchStaff = async (): Promise<StaffProfile[]> => {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data || []
}

export const useStaff = () => {
  return useQuery<StaffProfile[], Error>({
    queryKey: ['staff'],
    queryFn: fetchStaff,
  })
}

// --- Mutation Hooks ---

const addStaff = async (newStaffData: Omit<StaffProfile, 'id' | 'created_at'> & { password?: string }) => {
  const { data, error } = await supabase.functions.invoke('create-staff-user', {
    body: newStaffData,
  })

  if (error) {
    // The function might return a specific error message in the response body
    throw new Error(data?.error || error.message)
  }
  return data
}

const updateStaff = async ({ id, ...updatedData }: Partial<StaffProfile> & { id: string }) => {
  const { data, error } = await supabase
    .from('staff_profiles')
    .update(updatedData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteStaff = async (staffId: string) => {
  // 1. Delete dependent records first to avoid foreign key violations.
  const tablesToDeleteFrom = ['roster_schedules', 'leave_requests', 'checklist_items']
  for (const table of tablesToDeleteFrom) {
    // These will not throw an error if the column doesn't exist, which is safe.
    await supabase.from(table).delete().eq('profile_id', staffId)
    await supabase.from(table).delete().eq('staff_profile_id', staffId)
    await supabase.from(table).delete().eq('assigned_to', staffId)
    await supabase.from(table).delete().eq('completed_by', staffId)
  }

  // 2. Now, delete the staff profile itself.
  const { error } = await supabase.from('staff_profiles').delete().eq('id', staffId)

  if (error) throw new Error(error.message)
  return staffId
}

export const useStaffMutations = () => {
  const queryClient = useQueryClient()

  const addStaffMutation = useMutation({
    mutationFn: addStaff,
    onSuccess: () => {
      toast.success('Staff member added successfully!')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => {
      toast.error(`Failed to add staff: ${error.message}`)
    },
  })

  const updateStaffMutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: (data) => {
      toast.success(`Staff member ${data.full_name} updated!`)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => {
      toast.error(`Failed to update staff: ${error.message}`)
    },
  })

  const deleteStaffMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast.success('Staff member deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => {
      toast.error(`Failed to delete staff: ${error.message}`)
    },
  })

  return {
    addStaff: addStaffMutation.mutateAsync,
    isAdding: addStaffMutation.isPending,
    updateStaff: updateStaffMutation.mutateAsync,
    isUpdating: updateStaffMutation.isPending,
    deleteStaff: deleteStaffMutation.mutateAsync,
    isDeleting: deleteStaffMutation.isPending,
  }
}