/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Battery, Wifi } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  // Live dynamic clock for mobile status bar mockup on PC
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center p-0 md:p-6 lg:p-8 overflow-x-hidden selection:bg-amber-500/20">
      {/* Decorative desktop wallpaper elements */}
      <div className="hidden md:block absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden md:block absolute -bottom-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* 
        Responsive Device Canvas:
        - Mobile View (< md): 100% full screen (w-full h-[100dvh] rounded-none border-0)
        - PC/Desktop View (md+): Centered Smartphone Bezel Mockup
      */}
      <div className="relative w-full h-[100dvh] md:w-[412px] md:h-[880px] md:max-h-[94vh] bg-black md:rounded-[48px] md:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.95)] md:border-[10px] md:border-slate-800 md:ring-1 md:ring-slate-700/60 flex flex-col overflow-hidden transition-all duration-300">
        
        {/* iPhone Dynamic Island / Speaker Pill on PC */}
        <div className="hidden md:flex absolute top-2.5 inset-x-0 z-50 justify-center pointer-events-none">
          <div className="h-4 w-28 bg-black rounded-full flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-slate-800" />
          </div>
        </div>

        {/* Smartphone Status Bar Mockup (Shown on PC frame, hidden on real mobile devices) */}
        <div className="hidden md:flex bg-[#8b0000] text-white/95 px-6 pt-2 pb-1.5 items-center justify-between text-[11px] font-semibold tracking-tight z-40 select-none shrink-0 border-b border-black/10">
          <span className="font-medium tracking-wide">{currentTime}</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="font-mono text-[9px] font-bold tracking-tight opacity-90">5G</span>
            <Wifi className="w-3 h-3 opacity-90" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-3.5 h-3.5 opacity-95" />
            </div>
          </div>
        </div>

        {/* Mobile Application Viewport Canvas */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
          {children}
        </div>

        {/* Smartphone Home Indicator Bar on PC */}
        <div className="hidden md:flex h-4.5 bg-white justify-center items-center pointer-events-none pb-1 shrink-0 border-t border-slate-100">
          <div className="w-32 h-1 bg-slate-400/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
