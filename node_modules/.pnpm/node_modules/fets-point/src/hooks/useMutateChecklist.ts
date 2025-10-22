import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface UpdateChecklistPayload {
  id: string
  isCompleted: boolean
  completedBy: string | null
}

/**
 * Updates a single checklist item's completion status.
 * @param {UpdateChecklistPayload} payload - The data for the checklist item update.
 */
const updateChecklistItem = async ({ id, isCompleted, completedBy }: UpdateChecklistPayload) => {
  const { data, error } = await supabase
    .from('checklist_items')
    .update({
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? completedBy : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export function useMutateChecklist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateChecklistItem,
    onSuccess: () => {
      toast.success('Checklist item updated!')
      // When a mutation is successful, invalidate the query for incomplete checklist items
      // This will cause any component using `useChecklist` to re-fetch and update its UI.
      queryClient.invalidateQueries({ queryKey: ['checklist', 'incomplete'] })
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`)
    },
  })
}