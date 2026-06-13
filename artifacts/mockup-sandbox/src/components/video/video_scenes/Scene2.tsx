import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 9000),
      setTimeout(() => setPhase(5), 12000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-row items-center bg-[#0f172a] p-12 gap-16 z-20"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex-1 max-w-xl pl-8 relative z-30">
        <motion.div
          className="w-12 h-1 bg-[#2563eb] mb-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ transformOrigin: "left" }}
        />
        <motion.h2 
          className="text-[4vw] font-bold font-['Plus_Jakarta_Sans'] text-white leading-tight mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Register <br/><span className="text-[#2563eb]">Building</span>
        </motion.h2>
        <motion.p 
          className="text-[1.5vw] text-slate-400"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Launch your community portal in seconds.
        </motion.p>
      </div>

      <div className="flex-1 flex justify-center items-center relative h-full perspective-[1000px]">
        {/* Step 1: Building Info */}
        <motion.div 
          className="absolute w-[40vw] max-w-2xl bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl p-8"
          initial={{ opacity: 0, rotateY: 20, z: -200 }}
          animate={
            phase === 1 ? { opacity: 1, rotateY: 0, z: 0 } : 
            phase > 1 ? { opacity: 0, rotateY: -20, z: -100, x: -100 } : 
            { opacity: 0, rotateY: 20, z: -200 }
          }
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-sm font-bold">1</div>
            <div className="text-xl font-semibold">Building Details</div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="w-24 h-3 bg-slate-600 rounded"></div>
              <motion.div className="h-12 w-full bg-slate-800 rounded-lg border border-slate-700 relative overflow-hidden"
                animate={phase >= 1 ? { borderColor: '#2563eb' } : {}}
              >
                <motion.div className="absolute left-4 top-4 text-sm font-mono text-slate-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >Ocean Tower</motion.div>
              </motion.div>
            </div>
            
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <div className="w-16 h-3 bg-slate-600 rounded"></div>
                <div className="h-10 w-full bg-slate-800 rounded-lg border border-slate-700"></div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="w-16 h-3 bg-slate-600 rounded"></div>
                <div className="h-10 w-full bg-slate-800 rounded-lg border border-slate-700"></div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <div className="w-32 h-10 bg-[#2563eb] rounded-lg"></div>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Admin Account */}
        <motion.div 
          className="absolute w-[40vw] max-w-2xl bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl p-8"
          initial={{ opacity: 0, rotateY: 20, z: -200, x: 100 }}
          animate={
            phase === 2 ? { opacity: 1, rotateY: 0, z: 0, x: 0 } : 
            phase > 2 ? { opacity: 0, rotateY: -20, z: -100, x: -100 } : 
            { opacity: 0, rotateY: 20, z: -200, x: 100 }
          }
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
           <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-sm font-bold">2</div>
            <div className="text-xl font-semibold">Admin Account</div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="w-16 h-3 bg-slate-600 rounded"></div>
              <div className="h-10 w-full bg-slate-800 rounded-lg border border-slate-700"></div>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-3 bg-slate-600 rounded"></div>
              <div className="h-10 w-full bg-slate-800 rounded-lg border border-slate-700"></div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <motion.div 
                className="w-full h-12 bg-[#2563eb] rounded-lg relative overflow-hidden flex justify-center items-center"
                animate={phase === 3 ? { scale: 0.95 } : { scale: 1 }}
              >
                <div className="text-white font-medium">Create Portal</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Success */}
        <motion.div 
          className="absolute w-[40vw] max-w-2xl bg-[#1e293b] rounded-2xl border border-[#2563eb] shadow-[0_0_50px_rgba(37,99,235,0.2)] p-12 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            phase >= 4 ? { opacity: 1, scale: 1 } : 
            { opacity: 0, scale: 0.8 }
          }
          transition={{ duration: 0.6, type: "spring" }}
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Portal Created Successfully</h3>
          <p className="text-slate-400">oceantower.residentvoice.app</p>
        </motion.div>

      </div>
    </motion.div>
  );
}