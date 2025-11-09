import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, AlertCircle, Info, Megaphone, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBranch } from '../hooks/useBranch';

interface NewsItem {
  id: string;
  content: string;
  priority: 'normal' | 'high';
  branch_location: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function NewsTickerBar() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const { activeBranch } = useBranch();

  useEffect(() => {
    fetchActiveNews();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('news_ticker_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_items'
        },
        () => {
          fetchActiveNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBranch]);

  const fetchActiveNews = async () => {
    try {
      const now = new Date().toISOString();
      const branchName = typeof activeBranch === 'string' ? activeBranch : activeBranch?.name || 'calicut';

      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by branch - branch_location is now a single string
      const filteredNews = (data || []).filter(item =>
        item.branch_location === branchName || item.branch_location === 'global'
      );

      setNewsItems(filteredNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const getItemColors = (priority: string) => {
    if (priority === 'high') {
      return {
        bg: 'from-red-500/20 to-orange-500/20',
        border: 'border-red-400/40',
        icon: 'text-red-300',
        glow: 'shadow-red-500/20'
      };
    }
    return {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/40',
      icon: 'text-blue-300',
      glow: 'shadow-blue-500/20'
    };
  };

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40 backdrop-blur-xl border-b-2 border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center gap-4">
          {/* Live Badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 px-6 py-3 rounded-2xl shadow-xl shadow-red-500/30">
                <Radio className="w-6 h-6 text-white animate-pulse" />
                <span className="text-white font-black text-lg tracking-wide uppercase">Live News</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* News Ticker Container */}
          <div
            className="flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm border-2 border-white/20 shadow-lg relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              className="flex gap-8 py-4 px-6"
              animate={{
                x: isPaused ? 0 : [0, -2000]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear"
                }
              }}
            >
              {/* Duplicate items for seamless loop */}
              {[...newsItems, ...newsItems, ...newsItems].map((item, index) => {
                const colors = getItemColors(item.priority);

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className={`flex-shrink-0 flex items-center gap-4 px-6 py-3 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border} ${colors.glow} shadow-lg`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${colors.icon}`}>
                      <Megaphone size={20} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {item.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-500/30 text-red-200 text-xs font-bold rounded-full uppercase tracking-wide mr-2">
                            Urgent
                          </span>
                        )}
                        <p className="text-white font-bold text-base leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Gradient fade edges */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium"
        >
          Paused
        </motion.div>
      )}
    </div>
  );
}
