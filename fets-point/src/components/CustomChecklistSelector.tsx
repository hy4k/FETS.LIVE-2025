import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, CheckCircle, Calendar, Plus } from 'lucide-react';

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items_count?: number;
  created_at: string;
}

interface CustomChecklistSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  customTemplates: ChecklistTemplate[];
  onSelectTemplate: (template: ChecklistTemplate) => void;
  onCreateNew: () => void;
}

export function CustomChecklistSelector({
  isOpen,
  onClose,
  customTemplates,
  onSelectTemplate,
  onCreateNew
}: CustomChecklistSelectorProps) {
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
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-400 to-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">Select Custom Checklist</h2>
                <p className="text-black/70">Choose a checklist template to fill out</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-black" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            {customTemplates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {customTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-amber-50 hover:to-yellow-50 border-2 border-gray-200 hover:border-amber-400 rounded-xl transition-all text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-4 h-4" />
                        {template.items_count || 0} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Checklists</h3>
                <p className="text-gray-600 mb-6">
                  You haven't created any custom checklists yet.
                </p>
                <button
                  onClick={() => {
                    onCreateNew();
                    onClose();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black rounded-xl font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Checklist
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {customTemplates.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Or create a new custom checklist template
                </p>
                <button
                  onClick={() => {
                    onCreateNew();
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-amber-400 text-gray-900 rounded-xl font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
