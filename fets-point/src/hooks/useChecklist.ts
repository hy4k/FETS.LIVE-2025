import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { ChecklistItem } from '../types' // Assuming types are defined in src/types.ts

const fetchIncompleteChecklistItems = async () => {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*, assigned_to:staff_profiles(full_name)')
    .is('completed_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as ChecklistItem[]
}

export function useChecklist() {
  return useQuery({
    queryKey: ['checklist', 'incomplete'],
    queryFn: fetchIncompleteChecklistItems,
  })
}