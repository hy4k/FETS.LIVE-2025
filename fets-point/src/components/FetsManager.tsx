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
        .eq('is_active', true)
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
    if (!confirm('Are you sure you want to delete this checklist template?')) return;

    try {
      const { error } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Checklist template deleted successfully');
      fetchChecklists();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
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
        .select('*')
        .eq('template_id', checklist.id)
        .order('sort_order');

      if (error) throw error;

      setChecklistItems(data || []);
      setEditingChecklist(checklist);
    } catch (error: any) {
      console.error('Error fetching checklist items:', error);
      toast.error('Failed to load checklist items');
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         checklist.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || checklist.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(checklists.map(c => c.category)));

  const renderChecklistCard = (checklist: ChecklistTemplate) => (
    <motion.div
      key={checklist.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-amber-400/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{checklist.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              checklist.is_active
                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                : 'bg-red-500/20 text-red-300 border border-red-400/30'
            }`}>
              {checklist.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {checklist.category}
            </span>
          </div>
          <p className="text-white/70 text-sm mb-3">{checklist.description}</p>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1">
              <Shield size={14} />
              {checklist.category}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList size={14} />
              {checklist.items_count} questions
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(checklist.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={() => handleViewChecklist(checklist)}
          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Eye size={16} />
          View
        </button>
        <button
          onClick={() => handleEditChecklist(checklist)}
          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={() => toggleTemplateStatus(checklist.id, checklist.is_active)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {checklist.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
        </button>
        {checklist.category === 'custom' && (
          <button
            onClick={() => deleteTemplate(checklist.id)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );

  const renderChecklistsTab = () => {
    const preExamChecklists = checklists.filter(c => c.category === 'pre-exam');
    const postExamChecklists = checklists.filter(c => c.category === 'post-exam');
    const customChecklists = checklists.filter(c => c.category === 'custom');

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

        {/* Pre-Exam Checklists */}
        {(filterCategory === 'all' || filterCategory === 'pre-exam') && preExamChecklists.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ClipboardList size={20} className="text-green-300" />
              </div>
              Pre-Exam Checklists
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {preExamChecklists
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderChecklistCard)}
            </div>
          </div>
        )}

        {/* Post-Exam Checklists */}
        {(filterCategory === 'all' || filterCategory === 'post-exam') && postExamChecklists.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={20} className="text-purple-300" />
              </div>
              Post-Exam Checklists
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {postExamChecklists
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderChecklistCard)}
            </div>
          </div>
        )}

        {/* Custom Checklists */}
        {(filterCategory === 'all' || filterCategory === 'custom') && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <ClipboardList size={20} className="text-amber-300" />
              </div>
              Custom Checklists
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
                  <p className="text-white/60 mt-4">Loading checklists...</p>
                </div>
              ) : customChecklists.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <ClipboardList className="mx-auto h-16 w-16 text-white/20" />
                  <p className="text-white/60 mt-4">No custom checklists found</p>
                  <p className="text-white/40 text-sm mt-2">Click "Create Custom Checklist" to add one</p>
                </div>
              ) : (
                customChecklists
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(renderChecklistCard)
              )}
            </div>
          </div>
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
                      <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1">
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
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Settings className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                FETS Manager
              </h1>
              <p className="text-xl text-white/90 font-medium mt-1">
                Centralized Administration Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 inline-flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
    </div>
  );
}

export default FetsManager;
