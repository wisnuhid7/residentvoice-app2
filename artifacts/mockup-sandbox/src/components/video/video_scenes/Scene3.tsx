import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 8000),
      setTimeout(() => setPhase(5), 12000),
      setTimeout(() => setPhase(6), 16000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col bg-[#0f172a] z-30 overflow-hidden"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute top-12 left-12 z-40">
        <motion.h2 
          className="text-[3.5vw] font-bold font-['Plus_Jakarta_Sans'] text-white leading-tight drop-shadow-lg"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Building <span className="text-[#2563eb]">Admin</span>
        </motion.h2>
        <motion.p className="text-[1.2vw] text-slate-300 drop-shadow-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Complete control over your community.
        </motion.p>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-[75vw] flex items-center justify-center p-8 mt-16">
        <motion.div 
          className="w-full h-full max-h-[80vh] bg-[#1e293b] rounded-3xl border border-white/10 shadow-2xl flex overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Sidebar mock */}
          <div className="w-64 bg-[#0f172a]/50 border-r border-white/5 p-6 flex flex-col gap-4">
            <div className="h-8 w-32 bg-white/10 rounded mb-8"></div>
            {['Dashboard', 'Residents', 'Issues', 'Announcements'].map((item, i) => (
              <motion.div 
                key={i} 
                className={`h-10 w-full rounded-lg px-4 flex items-center ${i === 0 && phase < 3 ? 'bg-[#2563eb]/20 text-[#2563eb]' : 'text-slate-400'}`}
                animate={
                  (i === 2 && phase >= 3 && phase < 4) ? { backgroundColor: 'rgba(37,99,235,0.2)' } :
                  (i === 3 && phase >= 4) ? { backgroundColor: 'rgba(37,99,235,0.2)' } : {}
                }
              >
                <div className="w-4 h-4 rounded bg-current opacity-50 mr-3"></div>
                <div className="text-sm font-medium">{item}</div>
              </motion.div>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 p-8 bg-[#1e293b] relative">
            
            {/* Dashboard View */}
            <motion.div 
              className="absolute inset-8"
              initial={{ opacity: 1, y: 0 }}
              animate={phase >= 3 ? { opacity: 0, y: -20, pointerEvents: 'none' } : { opacity: 1, y: 0 }}
            >
              <div className="h-8 w-48 bg-white/20 rounded mb-8"></div>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { label: "Total Residents", value: "248" },
                  { label: "Open Issues", value: "12", highlight: true },
                  { label: "Active Resolutions", value: "3" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    className="bg-[#0f172a]/50 p-6 rounded-xl border border-white/5"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 + (i * 0.1) }}
                  >
                    <div className="text-sm text-slate-400 mb-2">{stat.label}</div>
                    <div className={`text-4xl font-bold ${stat.highlight ? 'text-red-400' : 'text-white'}`}>{stat.value}</div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className="bg-[#0f172a]/50 rounded-xl border border-white/5 h-64 p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <div className="h-6 w-32 bg-white/10 rounded mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 w-48 bg-white/10 rounded"></div>
                      </div>
                      <div className="w-20 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-12 h-2 bg-green-400 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Issues View */}
            <motion.div 
              className="absolute inset-8"
              initial={{ opacity: 0, y: 20, pointerEvents: 'none' }}
              animate={phase >= 3 && phase < 4 ? { opacity: 1, y: 0, pointerEvents: 'auto' } : phase >= 4 ? { opacity: 0, y: -20, pointerEvents: 'none' } : { opacity: 0, y: 20 }}
            >
               <div className="h-8 w-48 bg-white/20 rounded mb-8"></div>
               <div className="bg-[#0f172a]/50 rounded-xl border border-white/5 p-6 h-[400px]">
                  {/* Issue detail mockup */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="h-6 w-64 bg-white/20 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-red-400/50 rounded"></div>
                    </div>
                    <motion.div 
                      className="h-10 w-32 bg-[#2563eb] rounded-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    ></motion.div>
                  </div>
                  <div className="h-32 w-full bg-white/5 rounded-lg mb-4"></div>
               </div>
            </motion.div>
            
            {/* Announcements View */}
            <motion.div 
              className="absolute inset-8"
              initial={{ opacity: 0, y: 20, pointerEvents: 'none' }}
              animate={phase >= 4 ? { opacity: 1, y: 0, pointerEvents: 'auto' } : { opacity: 0, y: 20 }}
            >
               <div className="h-8 w-48 bg-white/20 rounded mb-8"></div>
               <div className="bg-[#0f172a]/50 rounded-xl border border-white/5 p-8 max-w-xl mx-auto mt-12">
                  <div className="h-6 w-48 bg-white/20 rounded mb-6"></div>
                  <div className="h-10 w-full bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-32 w-full bg-white/10 rounded-lg mb-6"></div>
                  <motion.div 
                    className="h-12 w-full bg-[#2563eb] rounded-lg relative overflow-hidden"
                    animate={phase >= 5 ? { scale: 0.98, opacity: 0.8 } : {}}
                  ></motion.div>
                  
                  {phase >= 6 && (
                    <motion.div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-medium shadow-xl"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      Announcement Posted!
                    </motion.div>
                  )}
               </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}