import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistTemplateItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time_minutes: number;
  responsible_role: string;
  sort_order: number;
  answer_type?: string; // Legacy field
  question_type?: string; // New field - matches database schema
  dropdown_options?: string[]; // New field - for dropdown/radio options
  is_required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  is_active: boolean;
}

interface EditChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: ChecklistTemplate;
  items: ChecklistTemplateItem[];
  onSuccess: () => void;
}

export function EditChecklistModal({ isOpen, onClose, checklist, items, onSuccess }: EditChecklistModalProps) {
  const [formData, setFormData] = useState({
    name: checklist.name,
    description: checklist.description,
  });
  const [editItems, setEditItems] = useState<ChecklistTemplateItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditItems([...items].sort((a, b) => a.sort_order - b.sort_order));
  }, [items]);

  const addNewItem = () => {
    const newItem: ChecklistTemplateItem = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      priority: 'medium',
      estimated_time_minutes: 5,
      responsible_role: 'staff',
      sort_order: editItems.length + 1,
      question_type: 'checkbox',
      dropdown_options: [],
      is_required: true,
    };
    setEditItems([...editItems, newItem]);
  };

  const updateItem = (index: number, field: keyof ChecklistTemplateItem, value: any) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = editItems.filter((_, i) => i !== index);
    // Re-order remaining items
    setEditItems(updated.map((item, i) => ({ ...item, sort_order: i + 1 })));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Checklist name is required');
      return;
    }

    if (editItems.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    for (let i = 0; i < editItems.length; i++) {
      if (!editItems[i].title.trim()) {
        toast.error(`Question ${i + 1} title is required`);
        return;
      }
    }

    setIsSaving(true);

    try {
      // Update template
      const { error: templateError } = await supabase
        .from('checklist_templates')
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq('id', checklist.id);

      if (templateError) throw templateError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('template_id', checklist.id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const itemsToInsert = editItems.map((item, index) => ({
        template_id: checklist.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        estimated_time_minutes: item.estimated_time_minutes,
        responsible_role: item.responsible_role,
        sort_order: index + 1,
        question_type: item.question_type || item.answer_type || 'checkbox', // Use question_type, fallback to answer_type
        dropdown_options: item.dropdown_options || null, // Include dropdown options
        is_required: item.is_required,
      }));

      const { error: insertError } = await supabase
        .from('checklist_template_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast.success('Checklist updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-400/20 to-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Edit Checklist</h2>
                <p className="text-white/70">Modify checklist template and questions</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Template Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Checklist Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g., Pre-Exam Checklist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  placeholder="Brief description of this checklist"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Questions ({editItems.length})</h3>
                <button
                  onClick={addNewItem}
                  className="px-4 py-2 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 rounded-lg text-amber-300 font-medium transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {editItems.map((item, index) => (
                  <div key={item.id} className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-400/20 rounded-lg flex items-center justify-center text-amber-300 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(index, 'title', e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="Question title *"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                          placeholder="Description (optional)"
                        />

                        {/* Question Type Selector */}
                        <div>
                          <label className="block text-xs text-white/60 mb-1">Answer Type</label>
                          <select
                            value={item.question_type || item.answer_type || 'checkbox'}
                            onChange={(e) => updateItem(index, 'question_type', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="checkbox">Checkbox (Yes/No)</option>
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="number">Number</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="date">Date</option>
                            <option value="time">Time</option>
                          </select>
                        </div>

                        {/* Dropdown/Radio Options */}
                        {((item.question_type || item.answer_type) === 'dropdown' || (item.question_type || item.answer_type) === 'radio') && (
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Options (comma-separated)</label>
                            <input
                              type="text"
                              value={(item.dropdown_options || []).join(', ')}
                              onChange={(e) => updateItem(index, 'dropdown_options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              placeholder="e.g., Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Priority</label>
                            <select
                              value={item.priority}
                              onChange={(e) => updateItem(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Time (min)</label>
                            <input
                              type="number"
                              value={item.estimated_time_minutes}
                              onChange={(e) => updateItem(index, 'estimated_time_minutes', parseInt(e.target.value) || 5)}
                              min="1"
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Role</label>
                            <select
                              value={item.responsible_role}
                              onChange={(e) => updateItem(index, 'responsible_role', e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              <option value="admin">Admin</option>
                              <option value="technical">Technical</option>
                              <option value="staff">Staff</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="flex-shrink-0 p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {editItems.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-white/20 mb-3" />
                    <p className="text-white/60">No questions yet. Click "Add Question" to start.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 rounded-xl font-semibold text-black transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
