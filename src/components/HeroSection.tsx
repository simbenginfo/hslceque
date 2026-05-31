/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Home, Compass, BookOpen } from 'lucide-react';

interface HeroSectionProps {
  onHome: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalQuestions: number;
}

export default function HeroSection({ onHome, onRefresh, isLoading, totalQuestions }: HeroSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden bg-gradient-to-br from-[#0e0e0e] via-[#111] to-[#16120e] border border-amber-500/10 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl"
    >
      {/* Decorative background glow elements */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-[150px] h-[150px] bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
      
      {/* Sparkle decorative lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      
      <div className="max-w-4xl space-y-4 relative z-10">
        
        {/* Pathway Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-mono font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>🚀 Your Pathway to Academic Excellence</span>
        </div>
        
        {/* Motivating Title */}
        <h1 className="text-2xl sm:text-4xl font-serif italic text-amber-50 tracking-wide font-medium leading-tight">
          Unlock Your Potential, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-sans not-italic font-bold">
            Master the HSLCE Exams
          </span>
        </h1>
        
        {/* Catchy Motivation Paragraph */}
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-sans max-w-3xl">
          Success isn't about memorizing everything; it's about pattern recognition, deep understanding, and consistent daily practice. 
          Step by step, question by question, you are crafting your future. Study the standard evaluation models, practice with active recall, 
          and push your limits—every single effort you invest today is a seed for tomorrow's triumph!
        </p>

        {/* Dynamic Metric Indicator */}
        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-gray-500">
          <span className="flex items-center gap-1.5 text-amber-500/80">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{totalQuestions || 0} Synced Questions Ready</span>
          </span>
          <span className="hidden sm:inline text-[#222]">•</span>
          <span>Updated in Real-Time via Administrative board sheet</span>
        </div>

      </div>

      {/* Action Suite (Home & Refresh) */}
      <div className="pt-2 border-t border-[#222]/60 flex flex-wrap items-center gap-3 relative z-10 justify-between">
        
        {/* Student Advice Tagline */}
        <p className="text-xs italic text-gray-500 font-serif">
          "Believe you can and you're halfway there." — Theodore Roosevelt
        </p>

        {/* Action Button Group */}
        <div className="flex items-center gap-2">
          {/* Home Button */}
          <button
            onClick={onHome}
            className="px-4 py-2 bg-[#121212] hover:bg-[#181818] text-gray-300 hover:text-amber-400 border border-[#262626] hover:border-amber-500/30 transition-all rounded-sm text-xs uppercase tracking-widest font-mono flex items-center gap-2 cursor-pointer shadow-md"
            title="Reset to home and clear all search/filter filters"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home Portal</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black disabled:bg-[#1c1c1c] disabled:text-gray-600 border border-amber-600 disabled:border-transparent transition-all rounded-sm text-xs uppercase tracking-widest font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md"
            title="Refresh questions from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Hub'}</span>
          </button>
        </div>

      </div>

    </motion.div>
  );
}
