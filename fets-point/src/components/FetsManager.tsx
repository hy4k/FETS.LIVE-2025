import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Newspaper,
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { NewsManager } from './NewsManager';
import { StaffManagement } from './StaffManagement';
import { ChecklistCreator } from './ChecklistCreator';
import { ViewChecklistModal } from './ViewChecklistModal';
import { EditChecklistModal } from './EditChecklistModal';

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  items_count?: number;
}

interface ChecklistInstance {
  id: string;
  template_id: string;
  name: string;
  category: string;
  exam_date: string;
  created_by: string;
  branch_location: string;
  completed_at: string | null;
  status: string;
  created_at: string;
  template?: ChecklistTemplate;
}

export function FetsManager() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'checklists' | 'news' | 'users'>('checklists');
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [checklistInstances, setChecklistInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreator, setShowCreator] = useState(false);
  const [viewingChecklist, setViewingChecklist] = useState<ChecklistTemplate | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [viewingInstance, setViewingInstance] = useState<ChecklistInstance | null>(null);
  const [viewingInstanceItems, setViewingInstanceItems] = useState<any[]>([]);

  // Safety check for profile
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white/70">Loading user profile...</p>
      </div>
    );
  }

  useEffect(() => {
    if (activeTab === 'checklists') {
      fetchChecklists();
      fetchChecklistInstances();
    }
  }, [activeTab]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        // Removed .eq('is_active', true) to show both active and inactive templates
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch item counts for each template
      const templatesWithCounts = await Promise.all(
        (data || []).map(async (template) => {
          const { count } = await supabase
            .from('checklist_template_items')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id);

          return {
            ...template,
            items_count: count || 0
          };
        })
      );

      setChecklists(templatesWithCounts);
    } catch (error: any) {
      console.error('Error fetching checklists:', error);
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_instances')
        .select(`
          *,
          template:checklist_templates(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching checklist instances:', error);
        throw error;
      }

      console.log('Fetched checklist instances:', data);
      setChecklistInstances(data || []);
    } catch (error: any) {
      console.error('Error fetching checklist instances:', error);
      toast.error('Failed to load recent submissions');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      console.log('🔍 Checking for submitted instances for template:', id);

      // Check if there are any submitted instances using this template
      const { data: instances, error: instancesError } = await supabase
        .from('checklist_instances')
        .select('id')
        .eq('template_id', id);

      if (instancesError) {
        console.error('❌ Error checking instances:', instancesError);
        throw instancesError;
      }

      // If there are submitted instances, prevent deletion
      if (instances && instances.length > 0) {
        toast.error(
          `Cannot delete template: ${instances.length} submitted checklist${instances.length > 1 ? 's' : ''} exist. ` +
          'You can deactivate the template instead to hide it from Command Centre.'
        );
        console.log(`⚠️ Cannot delete: ${instances.length} submitted instances found`);
        return;
      }

      // Confirm deletion
      if (!confirm('Are you sure you want to delete this checklist template? This action cannot be undone.')) return;

      console.log('🗑️ Deleting template and its items:', id);

      // First, delete all template items (no submitted instances exist)
      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('template_id', id);

      if (itemsError) {
        console.error('❌ Error deleting template items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Template items deleted');

      // Then delete the template itself
      const { error: templateError } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', id);

      if (templateError) {
        console.error('❌ Error deleting template:', templateError);
        throw templateError;
      }

      console.log('✅ Template deleted successfully');
      toast.success('Checklist template deleted successfully');
      fetchChecklists();
    } catch (error: any) {
      console.error('❌ Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleTemplateStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('checklist_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Template ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchChecklists();
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleViewChecklist = async (checklist: ChecklistTemplate) => {
    try {
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', checklist.id)
        .order('sort_order');

      if (error) throw error;

      setChecklistItems(data || []);
      setViewingChecklist(checklist);
    } catch (error: any) {
      console.error('Error fetching checklist items:', error);
      toast.error('Failed to load checklist items');
    }
  };

  const handleEditChecklist = async (checklist: ChecklistTemplate) => {
    try {
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('id, template_id, title, description, priority, estimated_time_minutes, responsible_role, sort_order, question_type, dropdown_options, is_required')
        .eq('template_id', checklist.id)
        .order('sort_order');

      if (error) throw error;

      console.log('📝 Loaded checklist items for editing:', data);
      setChecklistItems(data || []);
      setEditingChecklist(checklist);
    } catch (error: any) {
      console.error('❌ Error fetching checklist items:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to load checklist items');
    }
  };

  const handleViewInstance = async (instance: ChecklistInstance) => {
    try {
      console.log('👁️ Loading instance items for:', instance.id);
      console.log('Instance details:', instance);

      // Fetch instance items first
      const { data: items, error } = await supabase
        .from('checklist_instance_items')
        .select('*')
        .eq('instance_id', instance.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error loading instance items:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        toast.error(`Failed to load checklist details: ${error.message}`);
        return;
      }

      console.log(`✅ Fetched ${items?.length || 0} instance items`);

      // Fetch user profiles for completed_by fields
      if (items && items.length > 0) {
        const userIds = items
          .filter(item => item.completed_by)
          .map(item => item.completed_by);

        console.log(`👤 Found ${userIds.length} user IDs to fetch profiles for`);

        if (userIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('staff_profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (profileError) {
            console.error('⚠️ Error loading profiles:', profileError);
          } else {
            console.log(`✅ Loaded ${profiles?.length || 0} staff profiles`);
          }

          // Attach profile info to items
          const itemsWithProfiles = items.map(item => ({
            ...item,
            completed_by_profile: profiles?.find(p => p.id === item.completed_by)
          }));

          console.log('📋 Final items with profiles:', itemsWithProfiles);
          console.log('🔓 Opening modal - setting viewingInstance');
          setViewingInstance(instance);
          setViewingInstanceItems(itemsWithProfiles);
        } else {
          console.log('📋 Items without completed_by profiles:', items);
          console.log('🔓 Opening modal - setting viewingInstance');
          setViewingInstance(instance);
          setViewingInstanceItems(items);
        }
      } else {
        console.log('⚠️ No items found for this instance');
        console.log('🔓 Opening modal with empty items');
        setViewingInstance(instance);
        setViewingInstanceItems([]);
      }
    } catch (error: any) {
      console.error('❌ Critical error in handleViewInstance:', error);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Failed to load checklist');
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    if (!checklist || !checklist.name) return false;
    const matchesSearch = checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         checklist.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || checklist.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(checklists.filter(c => c && c.category).map(c => c.category)));

  const renderChecklistCard = (checklist: ChecklistTemplate) => {
    // Define color schemes for each category
    const categoryStyles = {
      'pre-exam': {
        gradient: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
        border: 'border-emerald-400/40',
        hoverBorder: 'hover:border-emerald-400/70',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
        badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
        buttonBg: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100',
        glow: 'shadow-emerald-500/20',
      },
      'post-exam': {
        gradient: 'from-purple-500/20 via-violet-500/20 to-indigo-500/20',
        border: 'border-purple-400/40',
        hoverBorder: 'hover:border-purple-400/70',
        iconBg: 'bg-gradient-to-br from-purple-400 to-indigo-500',
        badge: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
        buttonBg: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-100',
        glow: 'shadow-purple-500/20',
      },
      'custom': {
        gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
        border: 'border-amber-400/40',
        hoverBorder: 'hover:border-amber-400/70',
        iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100',
        glow: 'shadow-amber-500/20',
      },
    };

    const style = categoryStyles[checklist.category as keyof typeof categoryStyles] || categoryStyles['custom'];

    return (
      <motion.div
        key={checklist.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`relative overflow-hidden bg-gradient-to-br ${style.gradient} backdrop-blur-xl rounded-2xl p-6 border-2 ${style.border} ${style.hoverBorder} transition-all duration-300 ${style.glow} hover:shadow-2xl`}
      >
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${style.iconBg} opacity-10 rounded-bl-full`}></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                  <ClipboardList size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1 leading-tight">{checklist.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      checklist.is_active
                        ? 'bg-green-500/30 text-green-100 border border-green-400/50 shadow-green-500/20 shadow-sm'
                        : 'bg-red-500/30 text-red-100 border border-red-400/50 shadow-red-500/20 shadow-sm'
                    }`}>
                      {checklist.is_active ? '● Active' : '○ Inactive'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.badge} shadow-sm uppercase tracking-wide`}>
                      {checklist.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-4 line-clamp-2 leading-relaxed">{checklist.description}</p>
              <div className="flex items-center gap-4 text-sm text-white/70 bg-black/10 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <ClipboardList size={16} className="text-white/90" />
                  {checklist.items_count} items
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40"></span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar size={16} className="text-white/90" />
                  {new Date(checklist.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t-2 border-white/20">
            <button
              onClick={() => handleViewChecklist(checklist)}
              className={`flex-1 px-4 py-2.5 ${style.buttonBg} rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
            >
              <Eye size={16} />
              View
            </button>
            <button
              onClick={() => handleEditChecklist(checklist)}
              className={`flex-1 px-4 py-2.5 ${style.buttonBg} rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={() => toggleTemplateStatus(checklist.id, checklist.is_active)}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              title={checklist.is_active ? 'Deactivate' : 'Activate'}
            >
              {checklist.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
            {checklist.category === 'custom' && (
              <button
                onClick={() => deleteTemplate(checklist.id)}
                className="px-4 py-2.5 bg-red-500/30 hover:bg-red-500/40 rounded-xl text-red-100 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg border border-red-400/30"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderChecklistsTab = () => {
    const preExamChecklists = checklists.filter(c => c && c.category === 'pre-exam');
    const postExamChecklists = checklists.filter(c => c && c.category === 'post-exam');
    const customChecklists = checklists.filter(c => c && c.category === 'custom');

    return (
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Checklist Management</h2>
            <p className="text-white/70 mt-1">Manage pre-exam, post-exam, and custom checklists</p>
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Custom Checklist
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search checklists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Pre-Exam Checklists Section */}
        {(filterCategory === 'all' || filterCategory === 'pre-exam') && preExamChecklists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Section Header with Visual Divider */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-transparent rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-transparent backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-400/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <ClipboardList size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white tracking-tight">Pre-Exam Checklists</h3>
                    <p className="text-emerald-100/80 text-sm font-medium mt-1">Comprehensive pre-examination verification tasks</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-400/40">
                    <span className="text-2xl font-bold text-emerald-100">{preExamChecklists.length}</span>
                    <span className="text-emerald-200/70 text-xs ml-1">templates</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {preExamChecklists
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderChecklistCard)}
            </div>
          </motion.div>
        )}

        {/* Post-Exam Checklists Section */}
        {(filterCategory === 'all' || filterCategory === 'post-exam') && postExamChecklists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Section Header with Visual Divider */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/10 to-transparent rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-transparent backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-400/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white tracking-tight">Post-Exam Checklists</h3>
                    <p className="text-purple-100/80 text-sm font-medium mt-1">Post-examination completion and verification tasks</p>
                  </div>
                  <div className="px-4 py-2 bg-purple-500/20 rounded-xl border border-purple-400/40">
                    <span className="text-2xl font-bold text-purple-100">{postExamChecklists.length}</span>
                    <span className="text-purple-200/70 text-xs ml-1">templates</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {postExamChecklists
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderChecklistCard)}
            </div>
          </motion.div>
        )}

        {/* Custom Checklists Section */}
        {(filterCategory === 'all' || filterCategory === 'custom') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Section Header with Visual Divider */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-transparent backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-400/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <ClipboardList size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white tracking-tight">Custom Checklists</h3>
                    <p className="text-amber-100/80 text-sm font-medium mt-1">User-created custom verification and task templates</p>
                  </div>
                  <div className="px-4 py-2 bg-amber-500/20 rounded-xl border border-amber-400/40">
                    <span className="text-2xl font-bold text-amber-100">{customChecklists.length}</span>
                    <span className="text-amber-200/70 text-xs ml-1">templates</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400/30 border-t-amber-400 mx-auto shadow-lg"></div>
                  <p className="text-white/70 mt-6 text-lg font-medium">Loading checklists...</p>
                </div>
              ) : customChecklists.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-white/10">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                    <ClipboardList className="h-12 w-12 text-amber-300" />
                  </div>
                  <p className="text-white/80 text-xl font-bold mb-2">No custom checklists found</p>
                  <p className="text-white/50 text-sm">Click "Create Custom Checklist" to add your first template</p>
                </div>
              ) : (
                customChecklists
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(renderChecklistCard)
              )}
            </div>
          </motion.div>
        )}

        {/* Show message if no checklists at all */}
        {checklists.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl">
            <ClipboardList className="mx-auto h-16 w-16 text-white/20 mb-4" />
            <p className="text-white/60 text-lg font-semibold">No checklists found</p>
            <p className="text-white/40 mt-2">Create seed data or add custom checklists to get started</p>
          </div>
        )}

      {/* Recent Submissions */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-white mb-6">Recent Checklist Submissions</h3>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Checklist</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Exam Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Completed By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Completed At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {checklistInstances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{instance.template?.name || instance.name}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{new Date(instance.exam_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{instance.branch_location}</td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {instance.completed_at
                        ? new Date(instance.completed_at).toLocaleString()
                        : new Date(instance.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        instance.status === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {instance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewInstance(instance)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

  const tabs = [
    { id: 'checklists', label: 'Checklist Management', icon: ClipboardList },
    { id: 'news', label: 'News Manager', icon: Newspaper },
    { id: 'users', label: 'User Management', icon: Users }
  ];

  return (
    <div className="min-h-screen -mt-32 pt-48" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="h-6 bg-white/85 -mx-8 -mt-12 mb-8"></div>

      <div className="max-w-7xl mx-auto px-8 pb-12">
        {/* Premium Header with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="relative bg-gradient-to-r from-white/10 via-white/5 to-transparent backdrop-blur-2xl rounded-3xl p-8 border-2 border-white/20 shadow-2xl overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/10 to-pink-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition-transform duration-300">
                <Settings className="text-white" size={36} />
              </div>
              <div className="flex-1">
                <h1 className="text-6xl font-black tracking-tight text-white mb-2" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif", textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  FETS Manager
                </h1>
                <p className="text-xl text-white/90 font-semibold">
                  Centralized Administration & Control Center
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="text-3xl font-black text-white">{checklists.length}</div>
                  <div className="text-white/70 text-sm font-medium">Total Templates</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Tab Navigation with Enhanced Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-xl rounded-3xl p-3 border-2 border-white/30 shadow-2xl inline-flex gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white shadow-2xl shadow-amber-500/40'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className="tracking-wide">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'checklists' && renderChecklistsTab()}
            {activeTab === 'news' && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <NewsManager />
              </div>
            )}
            {activeTab === 'users' && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <StaffManagement />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Checklist Creator Modal */}
      <ChecklistCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onSuccess={() => {
          fetchChecklists();
          fetchChecklistInstances();
        }}
      />

      {/* View Checklist Modal */}
      {viewingChecklist && (
        <ViewChecklistModal
          isOpen={!!viewingChecklist}
          onClose={() => {
            setViewingChecklist(null);
            setChecklistItems([]);
          }}
          checklist={viewingChecklist}
          items={checklistItems}
        />
      )}

      {/* Edit Checklist Modal */}
      {editingChecklist && (
        <EditChecklistModal
          isOpen={!!editingChecklist}
          onClose={() => {
            setEditingChecklist(null);
            setChecklistItems([]);
          }}
          checklist={editingChecklist}
          items={checklistItems}
          onSuccess={() => {
            fetchChecklists();
            setEditingChecklist(null);
            setChecklistItems([]);
          }}
        />
      )}

      {/* View Instance Modal */}
      <AnimatePresence>
        {viewingInstance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewingInstance(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{viewingInstance.name}</h2>
                      <p className="text-white/80 text-sm">
                        Submitted on {new Date(viewingInstance.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingInstance(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Status and metadata */}
                <div className="mt-4 flex items-center gap-4 text-sm text-white/90 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Exam: {new Date(viewingInstance.exam_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="capitalize">{viewingInstance.branch_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="capitalize">{viewingInstance.category}</span>
                  </div>
                  {viewingInstance.completed_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Completed: {new Date(viewingInstance.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist items */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                <div className="space-y-3">
                  {viewingInstanceItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No items found in this checklist</p>
                    </div>
                  ) : (
                    viewingInstanceItems.map((item: any, index: number) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          item.is_completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {item.is_completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {index + 1}. {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}

                                {/* Show answer for non-checkbox questions */}
                                {item.notes && (
                                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                                    <p className="text-sm text-gray-900">{item.notes}</p>
                                  </div>
                                )}

                                {/* Show who completed it */}
                                {item.completed_by_profile && (
                                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <User className="w-3 h-3" />
                                    <span>Completed by: {item.completed_by_profile.full_name}</span>
                                  </div>
                                )}

                                {item.completed_at && (
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>at {new Date(item.completed_at).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {viewingInstanceItems.filter((item: any) => item.is_completed).length} / {viewingInstanceItems.length}
                    </span> tasks completed
                  </div>
                  <button
                    onClick={() => setViewingInstance(null)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FetsManager;
