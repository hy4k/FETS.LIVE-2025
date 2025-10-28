import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Clock, Shield, Calendar } from 'lucide-react';

interface ChecklistTemplateItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time_minutes: number;
  responsible_role: string;
  sort_order: number;
  answer_type: string;
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

interface ViewChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: ChecklistTemplate;
  items: ChecklistTemplateItem[];
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  high: 'bg-red-500/20 text-red-300 border-red-400/30',
};

export function ViewChecklistModal({ isOpen, onClose, checklist, items }: ViewChecklistModalProps) {
  if (!isOpen) return null;

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

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
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-400/20 to-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{checklist.name}</h2>
                <p className="text-white/70">{checklist.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {checklist.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    checklist.is_active
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {checklist.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    {items.length} Questions
                  </span>
                </div>
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
            <div className="space-y-4">
              {sortedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-400/20 rounded-lg flex items-center justify-center text-amber-300 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-white text-lg">{item.title}</h4>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${PRIORITY_COLORS[item.priority]}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-white/70 mb-3">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {item.estimated_time_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield size={14} />
                          {item.responsible_role}
                        </span>
                        <span className="flex items-center gap-1">
                          {item.is_required ? (
                            <>
                              <CheckCircle size={14} className="text-green-400" />
                              <span className="text-green-400">Required</span>
                            </>
                          ) : (
                            <>
                              <Circle size={14} />
                              Optional
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60">No questions in this checklist</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Created {new Date(checklist.created_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
