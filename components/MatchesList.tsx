
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dish } from '../types';
import { BookOpen, UtensilsCrossed, ChevronRight } from 'lucide-react';
import MatchOverlay from './MatchOverlay';

interface MatchesListProps {
  matches: Dish[];
}

const MatchesList: React.FC<MatchesListProps> = ({ matches }) => {
  const [selectedMatch, setSelectedMatch] = useState<Dish | null>(null);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
        <div className="bg-slate-900/50 p-8 rounded-full mb-6 border border-slate-800 shadow-xl">
          <UtensilsCrossed size={48} className="text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet</h2>
        <p className="text-slate-400 max-w-[240px]">
          Keep swiping! Once you both like the same dish, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
        <span className="text-green-500">✨</span> Eure Matches von heute
      </h2>
      
      <div className="grid grid-cols-1 gap-3">
        {matches.map((dish, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={dish.id}
            onClick={() => setSelectedMatch(dish)}
            className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-3 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-800/50"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700">
              <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-white leading-tight">{dish.name}</h3>
              {dish.recipe && (
                <div className="flex items-center gap-1.5 text-blue-400 text-xs mt-1 font-medium">
                  <BookOpen size={14} />
                  Rezept verfügbar
                </div>
              )}
            </div>
            <ChevronRight className="text-slate-600" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMatch && (
          <MatchOverlay 
            dish={selectedMatch} 
            onClose={() => setSelectedMatch(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchesList;
