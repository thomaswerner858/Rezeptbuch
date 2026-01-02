
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dish } from '../types';
import { X, BookOpen } from 'lucide-react';

interface MatchOverlayProps {
  dish: Dish;
  onClose: () => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ dish, onClose }) => {
  const [showRecipe, setShowRecipe] = useState(false);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-md bg-transparent text-center"
      >
        {!showRecipe ? (
          <>
            <div className="font-script text-6xl text-rose-500 font-bold mb-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]" style={{ fontFamily: 'cursive' }}>
              It's a Match!
            </div>
            
            <div className="relative aspect-[4/5] w-full max-h-[55vh] rounded-3xl overflow-hidden border-4 border-white shadow-2xl mx-auto mb-6 bg-gray-900">
               <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
               <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-left">
                 <h2 className="text-4xl font-bold text-white mb-2">{dish.name}</h2>
                 {dish.recipe && (
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <BookOpen size={18} /> Rezept verfügbar
                    </div>
                 )}
               </div>
            </div>

            <div className="flex flex-col gap-3 px-4">
              {dish.recipe && (
                <button 
                  onClick={() => setShowRecipe(true)}
                  className="bg-white text-slate-900 py-3.5 px-6 rounded-full font-bold text-lg shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} />
                  Rezept ansehen
                </button>
              )}
              
              <button 
                onClick={onClose}
                className="bg-green-500 text-white py-3.5 px-6 rounded-full font-bold text-lg shadow-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                Super, lass uns essen!
              </button>
              
              <button 
                onClick={onClose}
                className="text-white/50 hover:text-white py-2 font-medium"
              >
                Noch etwas weitersuchen?
              </button>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-3xl w-full max-h-[80vh] overflow-hidden flex flex-col text-left border border-slate-700 shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-2xl font-bold text-white">{dish.name}</h3>
              <button onClick={() => setShowRecipe(false)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Rezept / Zubereitung</h4>
              <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                {dish.recipe}
              </p>
            </div>
            <div className="p-4 border-t border-slate-800 shrink-0">
              <button 
                onClick={() => setShowRecipe(false)}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold"
              >
                Zurück zum Match
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MatchOverlay;
