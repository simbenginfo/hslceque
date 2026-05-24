/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Award, Layers, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Question } from '../types';

interface StatsDashboardProps {
  questions: Question[];
  subjects: string[];
}

export default function StatsDashboard({ questions, subjects }: StatsDashboardProps) {
  const totalQuestions = questions.length;
  const totalSubjects = subjects.length;

  // Calculate unique lessons across all questions plus initial mock configuration
  const uniqueLessonsMap = new Set<string>();
  questions.forEach(q => {
    if (q.lesson) {
      uniqueLessonsMap.add(`${q.subject}-${q.lesson}`);
    }
  });
  const totalLessons = uniqueLessonsMap.size || localStorage.getItem('hslc_hub_lessons_count') || 12;

  // Calculate Average Marks
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
  const avgMarks = totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(1) : '0.0';

  const stats = [
    {
      label: 'Questions Loaded',
      value: totalQuestions,
      prefix: '',
      icon: HelpCircle,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Active Subjects',
      value: totalSubjects,
      prefix: '',
      icon: BookOpen,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25'
    },
    {
      label: 'Unique Lessons',
      value: totalLessons,
      prefix: '',
      icon: Layers,
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/25'
    },
    {
      label: 'Average Marks',
      value: avgMarks,
      prefix: '',
      icon: Award,
      color: 'text-amber-100 bg-amber-500/10 border-amber-500/25'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div 
            key={idx}
            className="bg-[#111] border border-[#222] rounded-sm p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-gray-500 font-sans">
                {stat.label}
              </span>
              <div className={`p-2 rounded-sm border ${stat.color.split(' ')[1]} ${stat.color.split(' ')[2]}`}>
                <Icon className={`w-4 h-4 ${stat.color.split(' ')[0]}`} />
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-2xl sm:text-3xl font-serif italic text-amber-50 tracking-wide">
                {stat.value}
              </span>
              {stat.prefix && (
                <span className="text-xs text-gray-500 font-mono ml-1">{stat.prefix}</span>
              )}
            </div>
            
            <div className="mt-2 text-[10px] text-gray-600 font-mono flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>VERIFIED STREAM</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
