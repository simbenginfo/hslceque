/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Copy, Check, FileText, Share2, Award, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Question } from '../types';
import LatexRenderer from './LatexRenderer';

interface QuestionCardProps {
  key?: any;
  question: Question;
  index: number;
  isAdmin?: boolean;
  onEdit?: (question: Question) => void;
  onDelete?: (id: number) => void;
}

export default function QuestionCard({ question, index, isAdmin, onEdit, onDelete }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = () => {
    const textToCopy = `Question [${question.subject} - ${question.lesson}] (${question.year}, ${question.marks} Marks):
Q: ${question.question}
A: ${question.answer}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f0f0f] border border-[#222] rounded-sm overflow-hidden hover:border-amber-500/30 transition-all duration-200">
      {/* Card Header Area */}
      <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#222]">
        <div className="space-y-2">
          {/* Metadata badges container */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 bg-amber-950/30 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-medium rounded-sm uppercase tracking-wider">
              {question.subject}
            </span>
            <span className="px-2.5 py-1 bg-[#161616] border border-[#222] text-gray-300 font-sans text-xs font-medium rounded-sm">
              {question.lesson}
            </span>
            
            <div className="flex items-center gap-1.2 ml-2 text-[11px] text-gray-500 font-mono">
              <Calendar className="w-3.5 h-3.5 text-gray-600" />
              <span>{question.year}</span>
            </div>

            <div className="flex items-center gap-1 ml-2 text-[11px] text-gray-500 font-mono">
              <Award className="w-3.5 h-3.5 text-gray-600" />
              <span>{question.marks} Marks</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
            <Clock className="w-3 h-3 text-gray-600" />
            <span>ID: #{question.id}</span>
            {question.createdAt && (
              <>
                <span className="mx-1 text-gray-700">•</span>
                <span className="text-gray-500">Created: {new Date(question.createdAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-start">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-amber-200 rounded-sm transition-all border border-[#222] flex items-center justify-center cursor-pointer"
            title="Copy Question Details"
          >
            {copied ? <Check className="w-4 h-4 text-amber-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {isAdmin && (
            <>
              {/* Edit Button */}
              <button
                onClick={() => onEdit && onEdit(question)}
                className="p-2 bg-[#111] hover:bg-[#1a1a1a] text-amber-500 hover:text-amber-400 rounded-sm transition-all border border-amber-500/20 flex items-center justify-center cursor-pointer"
                title="Edit Question"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {/* Delete with inline confirmation */}
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-[#1c1212] border border-red-900/50 p-1 rounded-sm">
                  <span className="text-[10px] text-red-400 font-mono px-1">Delete?</span>
                  <button
                    onClick={() => {
                      if (onDelete) onDelete(question.id);
                      setConfirmDelete(false);
                    }}
                    className="p-1 px-2.5 bg-red-650 hover:bg-red-500 text-white rounded-sm text-[10px] uppercase font-mono font-bold cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="p-1 px-2 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 rounded-sm text-[10px] uppercase font-mono cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 bg-[#111] hover:bg-[#1a1a1a] text-red-500 hover:text-red-400 rounded-sm transition-all border border-red-500/15 flex items-center justify-center cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Card Content (Question body) */}
      <div className="p-6 space-y-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-gray-550 block mb-1">Exam Question</span>
          <div className="mt-1.5 font-serif text-amber-50 font-normal text-md leading-relaxed">
            <LatexRenderer text={question.question} />
          </div>
        </div>

        {/* Action button to reveal solution */}
        <div className="pt-2">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={`w-full py-2.5 px-4 rounded-sm font-medium text-xs flex items-center justify-center gap-2 border transition-all duration-200 uppercase tracking-widest ${
              showAnswer 
                ? 'bg-[#161616] border-[#333] text-gray-300 shadow-inner'
                : 'bg-amber-500 hover:bg-amber-400 border-amber-500/20 text-black font-semibold'
            }`}
          >
            {showAnswer ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Standard Solution
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Reveal Model Solution
              </>
            )}
          </button>
        </div>

        {/* Answer Reveal Area */}
        {showAnswer && (
          <div className="mt-4 p-5 bg-[#0a0a0a] border border-[#222] rounded-sm space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider font-mono text-amber-500 flex items-center gap-1.5 font-semibold">
                <FileText className="w-3.5 h-3.5" /> Official Model Answer Scheme
              </span>
              <span className="text-[10px] font-mono text-gray-650">Approved criteria</span>
            </div>
            
            <div className="space-y-1 overflow-x-auto text-gray-350 font-sans text-sm">
              <LatexRenderer text={question.answer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
