import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Dish, SwipeDirection } from '../types';

interface SwipeCardProps {
  dish: Dish;
  onSwipe: (direction: SwipeDirection) => void;
  index: number; // 0 is top card
}

export interface SwipeCardHandle {
  triggerSwipe: (direction: SwipeDirection) => Promise<void>;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(({ dish, onSwipe, index }, ref) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  
  // Visual cues for like/dislike overlays
  const likeOpacity = useTransform(x, [20, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -20], [1, 0]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (direction: SwipeDirection) => {
      if (direction === SwipeDirection.RIGHT) {
        await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
        onSwipe(SwipeDirection.RIGHT);
      } else {
        await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
        onSwipe(SwipeDirection.LEFT);
      }
    }
  }));

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe(SwipeDirection.RIGHT);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe(SwipeDirection.LEFT);
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  // Only the top card is interactive
  const isTop = index === 0;

  return (
    <motion.div
      style={{
        x,
        rotate,
        zIndex: 100 - index,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 1, y: 0 }}
      className={`w-full h-full p-4 ${index > 2 ? 'hidden' : 'block'}`}
    >
      <div className="relative w-full h-full bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-800 flex flex-col">
        {/* Image Section */}
        <div className="relative flex-grow bg-slate-800">
          <img 
            src={dish.imageUrl} 
            alt={dish.name} 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
          
          {/* LIKE Stamp */}
          <motion.div 
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 transform -rotate-12 pointer-events-none bg-black/20 backdrop-blur-sm z-10"
          >
            <span className="text-green-500 font-bold text-4xl tracking-wider uppercase">YES</span>
          </motion.div>

          {/* NOPE Stamp */}
          <motion.div 
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 transform rotate-12 pointer-events-none bg-black/20 backdrop-blur-sm z-10"
          >
            <span className="text-red-500 font-bold text-4xl tracking-wider uppercase">NO</span>
          </motion.div>

          {/* Card Info */}
          <div className="absolute bottom-0 left-0 w-full p-6 text-white pointer-events-none z-10">
            <h2 className="text-4xl font-bold mb-2 shadow-black drop-shadow-md">{dish.name}</h2>
            {dish.isCustom && (
              <span className="inline-block bg-white/20 backdrop-blur-md text-xs font-semibold px-2 py-1 rounded-full border border-white/30 text-white">
                Custom Added
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default SwipeCard;