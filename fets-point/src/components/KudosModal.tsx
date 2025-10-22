
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, X } from 'lucide-react';

const KudosModal = ({
  isOpen,
  onClose,
  currentUserProfile,
  staffList,
  addKudos,
}) => {
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!receiverId || !message.trim() || !currentUserProfile) {
      toast.error('Please select a staff member and write a message.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addKudos({
        giver_id: currentUserProfile.id,
        receiver_id: receiverId,
        message: message,
      });
      onClose();
    } catch (error) {
      console.error('Error giving kudos:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-amber-500" /> Give Kudos
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="font-semibold text-slate-700">To</label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Select a staff member...</option>
              {staffList
                .filter((s) => s.id !== currentUserProfile?.id)
                .map((staff) => (
                  <option key={staff.id} value={staff.user_id}>
                    {staff.full_name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              rows="4"
              placeholder="For going above and beyond..."
            ></textarea>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-amber-500 text-white rounded-md font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Kudos'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default KudosModal;
