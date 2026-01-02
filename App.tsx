
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, RefreshCw, UserCircle2 } from 'lucide-react';

import { USERS, STORAGE_KEYS } from './constants';
import { Dish, SwipeDirection, User } from './types';
import { storageService } from './services/storageService';

import Header from './components/Header';
import SwipeCard, { SwipeCardHandle } from './components/SwipeCard';
import ActionButtons from './components/ActionButtons';
import MatchOverlay from './components/MatchOverlay';
import AddDishModal from './components/AddDishModal';
import NoMatchView from './components/NoMatchView';
import MatchesList from './components/MatchesList';

type View = 'swipe' | 'matches';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('swipe');
  const [queue, setQueue] = useState<Dish[]>([]);
  const [matchedDish, setMatchedDish] = useState<Dish | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const topCardRef = useRef<SwipeCardHandle>(null);

  // Initialisierung: Nutzer aus LocalStorage laden
  useEffect(() => {
    const savedUserId = localStorage.getItem('dsm_active_user_id');
    if (savedUserId) {
      const user = USERS.find(u => u.id === savedUserId);
      if (user) setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const performSync = useCallback(async () => {
    if (!currentUser) return;
    setSyncing(true);
    try {
      await storageService.sync();
      const dishes = storageService.getQueueForUser(currentUser.id);
      setQueue(dishes);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setSyncing(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      performSync();
      const interval = setInterval(performSync, 15000);
      return () => clearInterval(interval);
    }
  }, [performSync, currentUser]);

  const matches = useMemo(() => {
    const allDishes = storageService.getDishes();
    return allDishes.filter(dish => storageService.checkForMatch(dish.id));
  }, [queue, matchedDish]);

  const handleSwipe = async (direction: SwipeDirection) => {
    if (!currentUser || queue.length === 0) return;

    const dish = queue[0];
    const isLike = direction === SwipeDirection.RIGHT;

    setQueue(prev => prev.slice(1));
    setIsSwiping(false);

    await storageService.castVote(currentUser.id, dish.id, isLike);

    if (isLike) {
      const isMatch = storageService.checkForMatch(dish.id);
      if (isMatch) {
        setMatchedDish(dish);
      }
    }
  };

  const handleButtonSwipe = async (direction: SwipeDirection) => {
    if (queue.length === 0 || isSwiping || !topCardRef.current) return;
    setIsSwiping(true);
    await topCardRef.current.triggerSwipe(direction);
  };

  const selectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('dsm_active_user_id', user.id);
  };

  const handleAddDish = async (name: string, recipe?: string, imageBase64?: string) => {
    const newDish = await storageService.addDish(name, recipe, imageBase64);
    setQueue(prev => [newDish, ...prev]);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-slate-400 font-medium">Lade App...</p>
    </div>
  );

  // Onboarding / User Selection Screen
  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-950 items-center justify-center p-8">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-900/40 rotate-12">
            <UserCircle2 size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Wer bist du?</h1>
          <p className="text-slate-400">Wähle dein Profil für die heutige Auswahl.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 w-full">
          {USERS.map(user => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className="flex items-center gap-6 p-6 bg-slate-900 border border-slate-800 rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95 text-left group"
            >
              <span className="text-5xl group-hover:scale-110 transition-transform">{user.avatar}</span>
              <div>
                <span className="block text-xl font-bold text-white">{user.name}</span>
                <span className="text-slate-500 text-sm">Bereit zum Swipen</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-950 relative shadow-2xl overflow-hidden border-x border-slate-900">
      
      <Header 
        currentUser={currentUser} 
        allUsers={USERS} 
        onSwitchUser={(id) => {
          const u = USERS.find(x => x.id === id);
          if (u) selectUser(u);
        }}
        onAddDish={() => setIsAddModalOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
        matchCount={matches.length}
      />

      <div className="absolute top-[70px] right-4 z-[40] flex items-center gap-2">
        {syncing ? (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            <RefreshCw size={10} className="animate-spin" /> Syncing
          </span>
        ) : (
          <button 
            onClick={performSync}
            className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors"
          >
            ● Live
          </button>
        )}
      </div>

      <main className="flex-grow relative w-full overflow-hidden flex flex-col">
        {currentView === 'swipe' ? (
          <div className="relative flex-grow w-full p-4">
            <div className="relative h-full w-full">
              {queue.length > 0 ? (
                queue.map((dish, index) => (
                  <SwipeCard 
                    key={dish.id} 
                    ref={index === 0 ? topCardRef : null}
                    dish={dish} 
                    index={index} 
                    onSwipe={handleSwipe}
                  />
                ))
              ) : (
                <div className="h-full flex flex-col">
                  <NoMatchView onAddDish={() => setIsAddModalOpen(true)} />
                  <button 
                    onClick={performSync}
                    className="mx-auto mt-4 px-6 py-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl text-slate-500 text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <RefreshCw size={14} /> Synchronisieren
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <MatchesList matches={matches} />
        )}
      </main>

      {currentView === 'swipe' && (
        <div className="bg-slate-950 z-10">
          <ActionButtons 
            disabled={queue.length === 0 || isSwiping}
            onDislike={() => handleButtonSwipe(SwipeDirection.LEFT)}
            onLike={() => handleButtonSwipe(SwipeDirection.RIGHT)}
            onAdd={() => setIsAddModalOpen(true)}
          />
        </div>
      )}

      <AnimatePresence>
        {matchedDish && (
          <MatchOverlay 
            dish={matchedDish} 
            onClose={() => setMatchedDish(null)} 
          />
        )}
      </AnimatePresence>

      <AddDishModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDish}
      />
    </div>
  );
}

export default App;
