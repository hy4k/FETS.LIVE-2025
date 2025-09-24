import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Paperclip,
  Pin,
  Send,
  Smile,
  ThumbsUp,
  UploadCloud,
  Users,
  Video
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { supabase } from '../lib/supabase'

type PostMediaType = 'image' | 'video' | 'file'

interface PostMedia {
  id: string
  post_id: string
  path: string
  type: PostMediaType | null
}

interface PostAuthor {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  centre: string | null
  avatar_url: string | null
  is_admin: boolean | null
}

interface FeedPost {
  id: string
  author_id: string
  content: string
  centre: string | null
  visibility: string | null
  pinned: boolean | null
  created_at: string
  author?: PostAuthor | null
  media?: PostMedia[] | null
}

type ChatScope = 'global' | 'calicut' | 'cochin'

interface ChatAuthor {
  id: string
  full_name: string | null
  avatar_url: string | null
  centre: string | null
  role: string | null
}

interface ChatMessage {
  id: string
  room_id: string
  author_id: string
  text: string | null
  media_path: string | null
  created_at: string
  author?: ChatAuthor | null
}

interface StaffMember {
  id: string
  full_name: string | null
  role: string | null
  branch_assigned?: string | null
}

const ACCENT_COLOR = '#FFD633'
const STORAGE_BUCKET = 'fets-media'
const FEED_CHANNEL = 'fets-connect-feed'
const CHAT_CHANNEL = 'fets-connect-chat'
const STAFF_CHANNEL = 'fets-connect-staff'
const MAX_FEED_ITEMS = 50
const MAX_CHAT_MESSAGES = 50
const STAFF_LIST_LIMIT = 12

const CHAT_ROOM_LABEL: Record<ChatScope, string> = {
  global: 'Global',
  calicut: 'Calicut',
  cochin: 'Cochin'
}

const formatBranchLabel = (branch: 'global' | 'calicut' | 'cochin') => {
  if (branch === 'global') return 'Global Operations'
  return `${branch.charAt(0).toUpperCase()}${branch.slice(1)} Centre`
}

const mediaTypeFromFile = (file: File): PostMediaType => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

const buildStoragePath = (prefix: string, id: string, file: File) => {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
  const random = Math.random().toString(36).slice(2)
  const timestamp = Date.now()
  return `${prefix}/${id}/${timestamp}_${random}${ext ? `.${ext}` : ''}`
}

const getAvatar = (url?: string | null, name?: string | null, size = 80) => {
  if (url) return url
  const safe = name ? encodeURIComponent(name) : 'Team'
  return `https://ui-avatars.com/api/?name=${safe}&background=FACC15&color=1F2937&size=${size}`
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? '#'
}

export default function FetsConnect() {
  const { user, profile } = useAuth()
  const { activeBranch, branchStatus } = useBranch()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [composerText, setComposerText] = useState('')
  const [composerFiles, setComposerFiles] = useState<File[]>([])
  const [posting, setPosting] = useState(false)

  const [chatScope, setChatScope] = useState<ChatScope>('global')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(true)
  const [sendingChat, setSendingChat] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(true)

  const chatInputRef = useRef<HTMLInputElement | null>(null)
  const activeRoomRef = useRef<string | null>(null)

  useEffect(() => {
    activeRoomRef.current = activeRoomId
  }, [activeRoomId])

  const isAuthenticated = Boolean(user)
  const branchLabel = useMemo(() => formatBranchLabel(activeBranch), [activeBranch])
  const pinnedPosts = useMemo(() => posts.filter(post => post.pinned), [posts])
  const branchMeta = activeBranch === 'global' ? undefined : branchStatus[activeBranch]

  const loadFeed = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setFeedLoading(true)

        let query = supabase
          .from('posts')
          .select(
            '*, author:users(id, full_name, email, role, centre, avatar_url, is_admin), media:post_media(*)'
          )
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(MAX_FEED_ITEMS)

        if (activeBranch === 'global') {
          query = query.eq('visibility', 'global')
        } else {
          query = query.or(`centre.eq.${activeBranch},visibility.eq.global`)
        }

        const { data, error } = await query

        if (error) throw error

        setPosts((data as FeedPost[]) ?? [])
      } catch (error) {
        console.error('FETS Connect: failed to load feed', error)
      } finally {
        if (showSpinner) setFeedLoading(false)
      }
    },
    [activeBranch]
  )

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    const channel = supabase
      .channel(FEED_CHANNEL)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () =>
        loadFeed(false)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_media' }, () =>
        loadFeed(false)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () =>
        loadFeed(false)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () =>
        loadFeed(false)
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [loadFeed])

  const handleComposerFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    setComposerFiles(prev => [...prev, ...Array.from(event.target.files ?? [])])
  }

  const handleCreatePost = async () => {
    const text = composerText.trim()

    if (!user || posting || (!text && composerFiles.length === 0)) return

    setPosting(true)
    try {
      const visibility = activeBranch === 'global' ? 'global' : 'centre'
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: text,
          centre: activeBranch,
          visibility,
          pinned: false
        })
        .select('*')
        .single()

      if (error) throw error

      const createdPost = data as FeedPost

      for (const file of composerFiles) {
        const path = buildStoragePath('posts', createdPost.id, file)
        const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })

        if (upload.error) {
          console.error('FETS Connect: failed to upload post media', upload.error)
          continue
        }

        const { error: mediaError } = await supabase.from('post_media').insert({
          post_id: createdPost.id,
          path,
          type: mediaTypeFromFile(file)
        })

        if (mediaError) {
          console.error('FETS Connect: failed to record media', mediaError)
        }
      }

      setComposerText('')
      setComposerFiles([])
      await loadFeed(false)
    } catch (error) {
      console.error('FETS Connect: failed to create post', error)
    } finally {
      setPosting(false)
    }
  }

  const loadChatMessages = useCallback(
    async (scope: ChatScope, showSpinner = true) => {
      try {
        if (showSpinner) setChatLoading(true)

        const roomName = CHAT_ROOM_LABEL[scope]
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('name', roomName)
          .maybeSingle()

        if (roomError) throw roomError

        if (!room) {
          setActiveRoomId(null)
          activeRoomRef.current = null
          setChatMessages([])
          return
        }

        setActiveRoomId(room.id)
        activeRoomRef.current = room.id

        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, author:users(id, full_name, avatar_url, centre, role)')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(MAX_CHAT_MESSAGES)

        if (error) throw error

        setChatMessages((data as ChatMessage[]) ?? [])
      } catch (error) {
        console.error('FETS Connect: failed to load chat messages', error)
        setChatMessages([])
      } finally {
        if (showSpinner) setChatLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadChatMessages(chatScope)
  }, [chatScope, loadChatMessages])

  useEffect(() => {
    const channel = supabase
      .channel(CHAT_CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const newMessage = payload.new as ChatMessage
          if (activeRoomRef.current && newMessage.room_id === activeRoomRef.current) {
            setChatMessages(prev => {
              if (prev.some(message => message.id === newMessage.id)) {
                return prev
              }
              return [newMessage, ...prev].slice(0, MAX_CHAT_MESSAGES)
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const handleSendMessage = useCallback(
    async (text?: string, file?: File) => {
      if (!user || sendingChat) return

      const trimmed = text?.trim() ?? ''

      if (!trimmed && !file) return

      setSendingChat(true)
      try {
        const roomName = CHAT_ROOM_LABEL[chatScope]
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('name', roomName)
          .maybeSingle()

        if (roomError) throw roomError
        if (!room) return

        let mediaPath: string | null = null

        if (file) {
          const path = buildStoragePath('chat', room.id, file)
          const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })

          if (upload.error) {
            console.error('FETS Connect: failed to upload chat media', upload.error)
          } else {
            mediaPath = path
          }
        }

        if (!mediaPath && !trimmed) return

        const { error } = await supabase.from('chat_messages').insert({
          room_id: room.id,
          author_id: user.id,
          text: trimmed || null,
          media_path: mediaPath
        })

        if (error) throw error

        if (chatInputRef.current) {
          chatInputRef.current.value = ''
        }

        await loadChatMessages(chatScope, false)
      } catch (error) {
        console.error('FETS Connect: failed to send chat message', error)
      } finally {
        setSendingChat(false)
      }
    },
    [chatScope, loadChatMessages, sendingChat, user]
  )

  const handleChatFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void handleSendMessage(undefined, file)
    }
    event.target.value = ''
  }

  const loadStaffMembers = useCallback(async () => {
    try {
      setStaffLoading(true)

      let query = supabase
        .from('profiles')
        .select('id, full_name, role, branch_assigned')
        .order('full_name', { ascending: true })
        .limit(STAFF_LIST_LIMIT)

      if (activeBranch !== 'global') {
        query = query.eq('branch_assigned', activeBranch)
      }

      const { data, error } = await query

      if (error) throw error

      setStaffMembers((data as StaffMember[]) ?? [])
    } catch (error) {
      console.error('FETS Connect: failed to load staff members', error)
      setStaffMembers([])
    } finally {
      setStaffLoading(false)
    }
  }, [activeBranch])

  useEffect(() => {
    loadStaffMembers()
  }, [loadStaffMembers])

  useEffect(() => {
    const channel = supabase
      .channel(STAFF_CHANNEL)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () =>
        loadStaffMembers()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [loadStaffMembers])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #eef2ff 100%)' }}
    >
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">FETS Connect</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <img
                  src={getAvatar(profile?.avatar_url, profile?.full_name)}
                  alt="Profile avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {profile?.full_name || 'Team Member'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(profile?.role || 'staff').toString()} ·{' '}
                    {profile?.centre || branchLabel}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50">
                  Create Post
                </button>
                <label className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 cursor-pointer inline-flex items-center justify-center gap-1">
                  <UploadCloud className="w-4 h-4" />
                  Upload
                  <input
                    multiple
                    type="file"
                    className="hidden"
                    onChange={handleComposerFileChange}
                  />
                </label>
                <button className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50">
                  Templates
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Online Staff</div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  {branchMeta?.staff_present ?? staffMembers.length}
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-auto">
                {staffLoading && (
                  <div className="text-sm text-gray-500 py-2">Loading staff...</div>
                )}

                {!staffLoading && staffMembers.length === 0 && (
                  <div className="text-sm text-gray-500 py-2">No staff found for this branch.</div>
                )}

                {!staffLoading &&
                  staffMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span className="relative flex items-center justify-center">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-800">
                          {member.full_name?.charAt(0) || '?'}
                        </span>
                        <span className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      </span>
                      <div className="text-sm text-gray-700">
                        <div className="font-medium leading-none">
                          {member.full_name || 'Team member'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(member.role || 'staff').toString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-2 space-y-4">
            <div className="sticky top-2 z-10 bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
              <div className="flex gap-3">
                <img
                  src={getAvatar(profile?.avatar_url, profile?.full_name)}
                  alt="Profile avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={composerText}
                    onChange={event => setComposerText(event.target.value)}
                    placeholder="Share a shift update, photo, or quick note..."
                    className="w-full resize-none border-0 focus:ring-0 text-gray-800 placeholder-gray-400"
                    rows={2}
                  />

                  {composerFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {composerFiles.map(file => (
                        <div
                          key={`${file.name}-${file.lastModified}`}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <label className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                        <Paperclip className="w-5 h-5" />
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleComposerFileChange}
                        />
                      </label>
                      <button className="p-2 rounded-xl hover:bg-gray-100">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-gray-100">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-gray-100">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      disabled={!isAuthenticated || posting || (!composerText.trim() && composerFiles.length === 0)}
                      onClick={handleCreatePost}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: ACCENT_COLOR, color: '#1F2937' }}
                    >
                      <Send className="w-4 h-4" />
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {feedLoading && (
              <div className="text-center py-10 text-gray-500">Loading feed…</div>
            )}

            {!feedLoading && posts.length === 0 && (
              <div className="text-center py-10 text-gray-500">No posts yet.</div>
            )}

            {!feedLoading &&
              posts.map(post => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-200"
                >
                  <header className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatar(post.author?.avatar_url, post.author?.full_name)}
                        className="w-10 h-10 rounded-full"
                        alt={post.author?.full_name || 'Author'}
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {post.author?.full_name || 'Team member'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(post.author?.role || 'staff').toString()} · {post.centre || 'Global'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      {post.pinned && <Pin className="w-4 h-4" />}
                      <time className="text-xs">
                        {new Date(post.created_at).toLocaleString()}
                      </time>
                    </div>
                  </header>

                  <div className="text-gray-800 whitespace-pre-wrap mb-3">{post.content}</div>

                  {Array.isArray(post.media) && post.media.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto rounded-xl mb-3">
                      {post.media.map(media => {
                        const url = media?.path ? getPublicUrl(media.path) : '#'
                        if (media?.type === 'image') {
                          return (
                            <img
                              key={media.id}
                              src={url}
                              alt="Post attachment"
                              className="w-44 h-44 rounded-xl object-cover"
                            />
                          )
                        }

                        if (media?.type === 'video') {
                          return (
                            <video
                              key={media.id}
                              src={url}
                              className="w-44 h-44 rounded-xl object-cover bg-black"
                              controls
                            />
                          )
                        }

                        return (
                          <a
                            key={media.id}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-600"
                          >
                            File attachment
                          </a>
                        )
                      })}
                    </div>
                  )}

                  <footer className="mt-3 flex items-center gap-3 text-gray-600">
                    <button className="px-3 py-1.5 rounded-xl hover:bg-gray-100 inline-flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      Like
                    </button>
                    <button className="px-3 py-1.5 rounded-xl hover:bg-gray-100 inline-flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </button>
                    <button className="px-3 py-1.5 rounded-xl hover:bg-gray-100 inline-flex items-center gap-1">
                      <Bookmark className="w-4 h-4" />
                      Save
                    </button>
                  </footer>
                </article>
              ))}
          </main>

          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
              <div className="font-semibold mb-3">Company News</div>
              <div className="space-y-3">
                {pinnedPosts.slice(0, 5).map(post => (
                  <div key={post.id} className="text-sm">
                    <div className="font-semibold text-gray-900 line-clamp-1">
                      {post.author?.full_name || 'Announcement'}
                    </div>
                    <div className="text-gray-700 line-clamp-2">{post.content}</div>
                  </div>
                ))}

                {pinnedPosts.length === 0 && (
                  <div className="text-sm text-gray-500">No announcements.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Public Chat</div>
                <select
                  value={chatScope}
                  onChange={event => setChatScope(event.target.value as ChatScope)}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option value="global">Global</option>
                  <option value="calicut">Calicut</option>
                  <option value="cochin">Cochin</option>
                </select>
              </div>

              <div className="space-y-3 max-h-72 overflow-auto pr-1">
                {chatLoading && (
                  <div className="text-sm text-gray-500 py-2">Loading messages…</div>
                )}

                {!chatLoading && chatMessages.length === 0 && (
                  <div className="text-sm text-gray-500 py-2">No messages yet.</div>
                )}

                {!chatLoading &&
                  chatMessages.map(message => (
                    <div key={message.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatar(message.author?.avatar_url, message.author?.full_name, 64)}
                          className="w-6 h-6 rounded-full"
                          alt={message.author?.full_name || 'Sender'}
                        />
                        <div className="font-medium text-gray-800">
                          {message.author?.full_name || 'Team member'}
                        </div>
                        <time className="text-xs text-gray-500 ml-auto">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </time>
                      </div>

                      {message.text && (
                        <div className="ml-8 text-gray-700 mt-1">{message.text}</div>
                      )}

                      {message.media_path && (
                        <a
                          href={getPublicUrl(message.media_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-8 text-blue-600 text-xs mt-1 inline-block"
                        >
                          Download attachment
                        </a>
                      )}
                    </div>
                  ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  placeholder="Message…"
                  className="flex-1 border rounded-xl px-3 py-2 text-sm"
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSendMessage((event.target as HTMLInputElement).value)
                    }
                  }}
                />
                <label
                  className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleChatFileChange} />
                </label>
                <button
                  className="p-2 rounded-xl hover:bg-gray-100"
                  title="Record voice note"
                  type="button"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: ACCENT_COLOR, color: '#1F2937' }}
                  onClick={() => void handleSendMessage(chatInputRef.current?.value)}
                  disabled={sendingChat}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
