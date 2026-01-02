
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dish } from '../types';
import { X, BookOpen, Utensils, Share2 } from 'lucide-react';

interface MatchOverlayProps {
  dish: Dish;
  onClose: () => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ dish, onClose }) => {
  const [showRecipe, setShowRecipe] = useState(false);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md h-full flex flex-col items-center justify-center overflow-hidden"
      >
        {!showRecipe ? (
          <div className="w-full flex flex-col h-full justify-center">
            <div className="text-center mb-6">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="inline-block px-4 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-bold uppercase tracking-widest mb-2"
              >
                Bingo!
              </motion.div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter shadow-green-500/20 drop-shadow-xl">
                MATCH!
              </h1>
            </div>
            
            <div className="relative aspect-[3/4] w-full max-h-[50vh] rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto mb-8 bg-slate-900 group">
               <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
               <div className="absolute bottom-0 inset-x-0 p-8">
                 <h2 className="text-4xl font-black text-white leading-none mb-2">{dish.name}</h2>
                 <p className="text-slate-300 text-sm font-medium opacity-80 uppercase tracking-widest">Perfekt für heute Abend</p>
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full px-6">
              {dish.recipe ? (
                <button 
                  onClick={() => setShowRecipe(true)}
                  className="bg-white text-slate-950 py-4 px-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <BookOpen size={24} strokeWidth={2.5} />
                  ZUM REZEPT
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="bg-green-500 text-white py-4 px-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Utensils size={24} strokeWidth={2.5} />
                  LASS UNS ESSEN!
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button 
                  onClick={onClose}
                  className="bg-slate-800 text-slate-200 py-3 px-4 rounded-xl font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Weiterschauen
                </button>
                <button 
                  className="bg-slate-800 text-slate-200 py-3 px-4 rounded-xl font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Dinner Match!', text: `Wir essen heute ${dish.name}!`, url: window.location.href });
                    }
                  }}
                >
                  <Share2 size={16} /> Teilen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-[2rem] w-full h-[85vh] overflow-hidden flex flex-col text-left border border-slate-800 shadow-2xl relative"
          >
            <div className="absolute top-4 right-4 z-10">
               <button 
                onClick={() => setShowRecipe(false)} 
                className="p-2 bg-slate-800/80 backdrop-blur-md rounded-full text-white border border-slate-700 hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-48 shrink-0 relative">
               <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
               <div className="absolute bottom-4 left-6">
                 <h3 className="text-3xl font-black text-white">{dish.name}</h3>
               </div>
            </div>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Zubereitung & Rezept</h4>
                <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {dish.recipe || "Keine Anleitung hinterlegt. Zeit zum Improvisieren!"}
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 shrink-0">
              <button 
                onClick={onClose}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-900/20 active:scale-95 transition-all"
              >
                ALLES KLAR, KOCHEN WIR!
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MatchOverlay;
