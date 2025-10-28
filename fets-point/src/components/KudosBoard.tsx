import React from 'react';
import { Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const KudosBoard = ({ kudos, isLoading, error }) => {
  if (isLoading) return <p className="text-center p-8 text-slate-500">Loading Kudos...</p>;
  if (error) return <p className="text-center p-8 text-red-500">Error loading kudos. Please try again later.</p>;

  return (
    <div className="p-8 space-y-6">
      {kudos.map((kudo) => (
        <motion.div
          key={kudo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-300 to-amber-400 p-6 rounded-xl shadow-lg text-slate-800"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/50 p-3 rounded-full">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg">
                <span className="font-bold">{kudo.giver?.full_name}</span> gave
                kudos to{' '}
                <span className="font-bold">{kudo.receiver?.full_name}</span>
              </p>
              <p className="mt-2 text-xl font-semibold italic">
                `"{kudo.message}"`
              </p>
              <p className="text-right text-xs text-slate-700 mt-4">
                {formatDistanceToNow(new Date(kudo.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default KudosBoard;
