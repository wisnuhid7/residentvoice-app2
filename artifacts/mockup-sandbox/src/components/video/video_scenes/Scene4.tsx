import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 9000),
      setTimeout(() => setPhase(5), 13000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex bg-[#0f172a] z-40"
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h2 className="text-[4vw] font-bold font-['Plus_Jakarta_Sans'] text-white leading-tight">
            Resident <span className="text-[#2563eb]">Portal</span>
          </motion.h2>
          <p className="text-[1.5vw] text-slate-400">Everything in one place.</p>
        </motion.div>

        {/* Mobile App Mockup */}
        <motion.div 
          className="w-[320px] h-[650px] bg-[#1e293b] rounded-[40px] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.8 }}
        >
          {/* Header */}
          <div className="h-20 bg-[#0f172a] flex items-end px-6 pb-4">
            <div className="h-5 w-32 bg-white/20 rounded"></div>
          </div>
          
          <div className="flex-1 p-6 space-y-6 relative overflow-hidden bg-[#0f172a]">
            
            {/* Dashboard feed */}
            <motion.div 
              className="absolute inset-0 p-6 space-y-4"
              animate={phase >= 2 ? { x: -320, opacity: 0 } : { x: 0, opacity: 1 }}
            >
              <div className="h-32 w-full bg-[#2563eb]/20 rounded-2xl border border-[#2563eb]/30 p-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#2563eb] rounded-full blur-xl opacity-50"></div>
                <div className="h-4 w-16 bg-[#2563eb]/50 rounded mb-2"></div>
                <div className="h-6 w-3/4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 w-full bg-white/10 rounded"></div>
              </div>
              
              <div className="h-24 w-full bg-slate-800 rounded-2xl p-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-white/20 rounded"></div>
                    <div className="h-3 w-full bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#2563eb] rounded-full shadow-lg flex items-center justify-center"
                animate={phase === 1 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="w-6 h-1 bg-white rounded absolute"></div>
                <div className="w-1 h-6 bg-white rounded absolute"></div>
              </motion.div>
            </motion.div>

            {/* Report Issue Form */}
            <motion.div 
              className="absolute inset-0 p-6 bg-[#0f172a]"
              initial={{ x: 320, opacity: 0 }}
              animate={phase >= 2 && phase < 4 ? { x: 0, opacity: 1 } : phase >= 4 ? { x: -320, opacity: 0 } : { x: 320, opacity: 0 }}
            >
               <div className="h-6 w-32 bg-white/20 rounded mb-6"></div>
               <div className="space-y-4">
                 <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
                    <div className="h-12 w-full bg-slate-800 rounded-xl border border-red-500/50"></div>
                 </div>
                 <div className="h-32 w-full bg-slate-800 rounded-xl"></div>
                 <motion.div 
                    className="h-12 w-full bg-[#2563eb] rounded-xl mt-4"
                    animate={phase >= 3 ? { scale: 0.95 } : {}}
                 ></motion.div>
               </div>
            </motion.div>

            {/* Voting View */}
            <motion.div 
              className="absolute inset-0 p-6 bg-[#0f172a]"
              initial={{ x: 320, opacity: 0 }}
              animate={phase >= 4 ? { x: 0, opacity: 1 } : { x: 320, opacity: 0 }}
            >
               <div className="h-6 w-48 bg-white/20 rounded mb-6"></div>
               <div className="bg-slate-800 rounded-2xl p-5 mb-4 border border-blue-500/20">
                 <div className="h-5 w-3/4 bg-white/20 rounded mb-3"></div>
                 <div className="h-3 w-full bg-white/10 rounded mb-2"></div>
                 <div className="h-3 w-5/6 bg-white/10 rounded mb-6"></div>
                 
                 <div className="flex gap-4">
                   <motion.div 
                      className="flex-1 h-10 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center"
                      animate={phase >= 5 ? { backgroundColor: 'rgba(34,197,94,0.4)' } : {}}
                   >
                     <div className="w-8 h-2 bg-green-400 rounded"></div>
                   </motion.div>
                   <div className="flex-1 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                     <div className="w-8 h-2 bg-red-400 rounded"></div>
                   </div>
                 </div>
               </div>
            </motion.div>

          </div>

          {/* Tab bar */}
          <div className="h-16 bg-[#1e293b] border-t border-slate-700 flex items-center justify-around px-4">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full ${i===0 && phase < 2 ? 'bg-[#2563eb]/50' : i===2 && phase >= 4 ? 'bg-[#2563eb]/50' : 'bg-slate-700'}`}></div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}