/**
 * Comprehensive API Service Layer for Supabase Operations
 * Provides type-safe, reusable functions for all database operations
 */

import { supabase } from '../lib/supabase'
import type { Database, Tables, Inserts, Updates } from '../types/database.types'

// Helper type for query filters
export type QueryFilter<T> = Partial<T>

/**
 * Generic error handling wrapper
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Candidates Service
 */
export const candidatesService = {
  async getAll(filters?: {
    date?: string
    status?: string
    branch_location?: string
  }) {
    try {
      let query = supabase.from('candidates').select('*')

      if (filters?.date) {
        query = query.gte('exam_date', `${filters.date}T00:00:00Z`)
                     .lt('exam_date', `${filters.date}T23:59:59Z`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.branch_location && filters.branch_location !== 'global') {
        query = query.eq('branch_location', filters.branch_location)
      }

      const { data, error } = await query.order('exam_date', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch candidates', 'FETCH_ERROR', error)
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch candidate ${id}`, 'FETCH_ERROR', error)
    }
  },

  async create(candidate: Inserts<'candidates'>) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert(candidate as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create candidate', 'CREATE_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'candidates'>) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update candidate ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete candidate ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Incidents Service
 */
export const incidentsService = {
  async getAll(filters?: { status?: string; branch_location?: string }) {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          profiles:incidents_reported_by_fkey(full_name)
        `)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.branch_location && filters.branch_location !== 'global') {
        query = query.eq('branch_location', filters.branch_location)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch incidents', 'FETCH_ERROR', error)
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          profiles:incidents_reported_by_fkey(full_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch incident ${id}`, 'FETCH_ERROR', error)
    }
  },

  async create(incident: Inserts<'incidents'>) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create incident', 'CREATE_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'incidents'>) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update incident ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete incident ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Roster Schedules Service
 */
export const rosterService = {
  async getSchedules(filters?: { date?: string; profile_id?: string }) {
    try {
      let query = supabase
        .from('roster_schedules')
        .select(`
          *,
          profiles!roster_schedules_profile_id_fkey(full_name, role)
        `)

      if (filters?.date) {
        query = query.eq('date', filters.date)
      }

      if (filters?.profile_id) {
        query = query.eq('profile_id', filters.profile_id)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch roster schedules', 'FETCH_ERROR', error)
    }
  },

  async create(schedule: Inserts<'roster_schedules'>) {
    try {
      const { data, error } = await supabase
        .from('roster_schedules')
        .insert(schedule as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create roster schedule', 'CREATE_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'roster_schedules'>) {
    try {
      const { data, error } = await supabase
        .from('roster_schedules')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update roster schedule ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('roster_schedules')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete roster schedule ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Sessions Service
 */
export const sessionsService = {
  async getAll(filters?: { date?: string }) {
    try {
      let query = supabase.from('sessions').select('*')

      if (filters?.date) {
        query = query.eq('date', filters.date)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch sessions', 'FETCH_ERROR', error)
    }
  },

  async getById(id: number) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch session ${id}`, 'FETCH_ERROR', error)
    }
  },

  async create(session: Inserts<'sessions'>) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create session', 'CREATE_ERROR', error)
    }
  },

  async update(id: number, updates: Updates<'sessions'>) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update session ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: number) {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete session ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Staff Profiles Service
 */
export const staffService = {
  async getAll(filters?: { department?: string; status?: string }) {
    try {
      let query = supabase.from('staff_profiles').select('*')

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('full_name', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch staff profiles', 'FETCH_ERROR', error)
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch staff profile ${id}`, 'FETCH_ERROR', error)
    }
  },

  async create(staff: Inserts<'staff_profiles'>) {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .insert(staff as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create staff profile', 'CREATE_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'staff_profiles'>) {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update staff profile ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete staff profile ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Posts Service (for FetsConnect)
 */
export const postsService = {
  async getAll(filters?: { centre?: string; visibility?: string }) {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles(full_name),
          post_media(*),
          post_likes(count),
          post_comments(count)
        `)

      if (filters?.centre) {
        query = query.eq('centre', filters.centre)
      }

      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch posts', 'FETCH_ERROR', error)
    }
  },

  async create(post: Inserts<'posts'>) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(post as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create post', 'CREATE_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'posts'>) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update post ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete post ${id}`, 'DELETE_ERROR', error)
    }
  }
}

/**
 * Chat Messages Service
 */
export const chatService = {
  async getMessages(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch messages for room ${roomId}`, 'FETCH_ERROR', error)
    }
  },

  async sendMessage(message: Inserts<'chat_messages'>) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to send message', 'CREATE_ERROR', error)
    }
  },

  async getRooms() {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch chat rooms', 'FETCH_ERROR', error)
    }
  }
}

/**
 * Profiles Service
 */
export const profilesService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch profiles', 'FETCH_ERROR', error)
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch profile ${id}`, 'FETCH_ERROR', error)
    }
  },

  async update(id: string, updates: Updates<'profiles'>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update profile ${id}`, 'UPDATE_ERROR', error)
    }
  }
}

/**
 * Vault Service (Resource Centre)
 */
export const vaultService = {
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('vault_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch vault categories', 'FETCH_ERROR', error)
    }
  },

  async createCategory(category: any) {
    try {
      const { data, error } = await supabase
        .from('vault_categories')
        .insert(category as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create vault category', 'CREATE_ERROR', error)
    }
  },

  async updateCategory(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('vault_categories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update vault category ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async deleteCategory(id: string) {
    try {
      const { error } = await supabase
        .from('vault_categories')
        .delete()
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete vault category ${id}`, 'DELETE_ERROR', error)
    }
  },

  async getItems(filters?: { category_id?: string; type?: string; searchQuery?: string }) {
    try {
      let query = supabase
        .from('vault')
        .select('*')
        .eq('is_deleted', false)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch vault items', 'FETCH_ERROR', error)
    }
  },

  async getItemById(id: string) {
    try {
      const { data, error } = await supabase
        .from('vault')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to fetch vault item ${id}`, 'FETCH_ERROR', error)
    }
  },

  async createItem(item: any) {
    try {
      const { data, error } = await supabase
        .from('vault')
        .insert(item as any)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to create vault item', 'CREATE_ERROR', error)
    }
  },

  async updateItem(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('vault')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to update vault item ${id}`, 'UPDATE_ERROR', error)
    }
  },

  async deleteItem(id: string) {
    try {
      const { error } = await supabase
        .from('vault')
        .update({ is_deleted: true, updated_at: new Date().toISOString() } as any)
        .eq('id', id)

      if (error) throw new ApiError(error.message, error.code, error.details)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Failed to delete vault item ${id}`, 'DELETE_ERROR', error)
    }
  },

  async getPins(userId: string) {
    try {
      const { data, error } = await supabase
        .from('vault_item_pins')
        .select('*')
        .eq('user_id', userId)

      if (error) throw new ApiError(error.message, error.code, error.details)
      return data || []
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to fetch vault pins', 'FETCH_ERROR', error)
    }
  },

  async togglePin(itemId: string, userId: string) {
    try {
      // Check if pin exists
      const { data: existingPin } = await supabase
        .from('vault_item_pins')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingPin) {
        // Remove pin
        const { error } = await supabase
          .from('vault_item_pins')
          .delete()
          .eq('id', existingPin.id)

        if (error) throw new ApiError(error.message, error.code, error.details)
        return { pinned: false }
      } else {
        // Add pin
        const { error } = await supabase
          .from('vault_item_pins')
          .insert({ item_id: itemId, user_id: userId } as any)

        if (error) throw new ApiError(error.message, error.code, error.details)
        return { pinned: true }
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Failed to toggle vault pin', 'UPDATE_ERROR', error)
    }
  }
}
