/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Search, Filter, SortAsc, SortDesc, Calendar, Award, 
  Layers, Download, PlusCircle, LogIn, LogOut, CheckCircle2, 
  X, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal, 
  HelpCircle, Sparkles, Plus, AlertCircle, FileSpreadsheet, Eye
} from 'lucide-react';
import { AppScriptService } from './services/api';
import { Question, FilterState, AdminSession, NewQuestionPayload } from './types';
import StatsDashboard from './components/StatsDashboard';
import QuestionCard from './components/QuestionCard';
import LatexRenderer from './components/LatexRenderer';

// Helper to transform LaTeX formula characters into a single line inline dollar format for table previews
const getBriefText = (text: string): string => {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\$\$/g, '$')
    .replace(/\\\[/g, '$')
    .replace(/\\\]/g, '$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
};

// Helper to split text by paragraph and render lists / ordinary text using LatexRenderer directly
const renderText = (text: string) => {
  return text.split('\n').map((paragraph, i) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    
    // Basic formatting of lists or formulae
    if (trimmed.startsWith('-') || trimmed.startsWith('●') || trimmed.startsWith('*')) {
      return (
        <li key={i} className="ml-4 list-disc text-slate-300 py-0.5 leading-relaxed">
          <LatexRenderer text={trimmed.substring(1).trim()} />
        </li>
      );
    }
    
    if (trimmed.match(/^\d+\./)) {
      return (
        <div key={i} className="pl-2 py-0.5 text-slate-300 leading-relaxed font-sans text-xs">
          <LatexRenderer text={trimmed} />
        </div>
      );
    }

    return (
      <p key={i} className="text-slate-300 leading-relaxed py-1 text-xs font-sans">
        <LatexRenderer text={trimmed} />
      </p>
    );
  });
};

export default function App() {
  // Connection and Mode Configuration States
  const [dbMode, setDbMode] = useState<'live' | 'demo'>(AppScriptService.getMode());
  const [webAppUrl, setWebAppUrl] = useState<string>(AppScriptService.getWebAppUrl());
  const [configCounter, setConfigCounter] = useState(0);

  // Database core state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [lessonsList, setLessonsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Visitor filter state
  const [filters, setFilters] = useState<FilterState>({
    subject: 'all',
    lesson: 'all',
    sortField: 'year',
    sortOrder: 'desc',
    searchQuery: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Admin entry modal visibility state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Authentication status
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal / Add Question states
  const [newSubject, setNewSubject] = useState('');
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState(false);
  const [newLesson, setNewLesson] = useState('');
  const [isAddingCustomLesson, setIsAddingCustomLesson] = useState(false);
  const [newQuestionPayload, setNewQuestionPayload] = useState<NewQuestionPayload>({
    subject: '',
    lesson: '',
    marks: 4,
    year: 2026,
    question: '',
    answer: ''
  });
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active expanded row of visitor questions list
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Synchronize dynamic connection states
  const handleConfigChange = () => {
    setDbMode(AppScriptService.getMode());
    setWebAppUrl(AppScriptService.getWebAppUrl());
    setConfigCounter(prev => prev + 1);
    setCurrentPage(1);
  };

  // Restore authenticated session from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('hslc_hub_admin_session');
    if (saved) {
      try {
        setAdminSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('hslc_hub_admin_session');
      }
    }
  }, []);

  // Fetch core subjects and initial questions
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorText(null);
      try {
        const [loadedSubjects, loadedQuestions] = await Promise.all([
          AppScriptService.getSubjects(),
          AppScriptService.getQuestions()
        ]);
        setSubjectsList(loadedSubjects);
        setQuestions(loadedQuestions);
      } catch (err: any) {
        console.error('Core data load failed:', err);
        setErrorText('Failed to sync. Please verify connection credentials, or toggle Demo mode in settings below.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [configCounter]);

  // Load subject specific lessons when selected subject changes
  useEffect(() => {
    async function loadLessons() {
      if (!filters.subject || filters.subject === 'all') {
        setLessonsList([]);
        setFilters(f => ({ ...f, lesson: 'all' }));
        return;
      }
      try {
        const lessons = await AppScriptService.getLessons(filters.subject);
        setLessonsList(lessons);
        setFilters(f => ({ ...f, lesson: 'all' }));
      } catch (err) {
        console.error('Failed to list lessons:', err);
      }
    }
    loadLessons();
  }, [filters.subject, configCounter]);

  // Update lessons choices inside the Add Question panel on subject change
  const [adminLessonsList, setAdminLessonsList] = useState<string[]>([]);
  useEffect(() => {
    async function loadAdminLessons() {
      if (!newQuestionPayload.subject || isAddingCustomSubject) {
        setAdminLessonsList([]);
        return;
      }
      try {
        const lessons = await AppScriptService.getLessons(newQuestionPayload.subject);
        setAdminLessonsList(lessons);
        // Default select first lesson if available
        if (lessons.length > 0) {
          setNewQuestionPayload(p => ({ ...p, lesson: lessons[0] }));
        } else {
          setNewQuestionPayload(p => ({ ...p, lesson: '' }));
        }
      } catch (err) {
        console.error('Failed to list admin lessons:', err);
      }
    }
    loadAdminLessons();
  }, [newQuestionPayload.subject, isAddingCustomSubject, configCounter]);

  // Handle visitor logins
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Complete both username and password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const generatedToken = await AppScriptService.login(loginUsername, loginPassword);
      const newSession: AdminSession = {
        token: generatedToken,
        username: loginUsername.trim(),
        loginTime: new Date().toISOString()
      };
      setAdminSession(newSession);
      localStorage.setItem('hslc_hub_admin_session', JSON.stringify(newSession));
      // Reset forms
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Verification failed. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logouts
  const handleLogout = () => {
    setAdminSession(null);
    localStorage.removeItem('hslc_hub_admin_session');
  };

  // Submit questions
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSession?.token) {
      setSubmitError('Unauthorized. Login first.');
      return;
    }

    // Determine final values of subject and lesson
    const finalSubject = isAddingCustomSubject ? newSubject.trim() : newQuestionPayload.subject;
    const finalLesson = isAddingCustomLesson ? newLesson.trim() : newQuestionPayload.lesson;

    if (!finalSubject) {
      setSubmitError('Please specify or select a valid Subject.');
      return;
    }
    if (!finalLesson) {
      setSubmitError('Please specify or select a valid Lesson.');
      return;
    }
    if (!newQuestionPayload.question.trim()) {
      setSubmitError('Question body cannot be empty.');
      return;
    }
    if (!newQuestionPayload.answer.trim()) {
      setSubmitError('Answer body cannot be empty.');
      return;
    }

    setIsSubmittingQuestion(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const activePayload: NewQuestionPayload = {
        subject: finalSubject,
        lesson: finalLesson,
        marks: Number(newQuestionPayload.marks),
        year: Number(newQuestionPayload.year),
        question: newQuestionPayload.question.trim(),
        answer: newQuestionPayload.answer.trim()
      };

      const added = await AppScriptService.addQuestion(adminSession.token, activePayload);

      // Append real added question to state list
      setQuestions(prev => [added, ...prev]);

      // Refresh filters / subjects listings if newly introduced custom elements occurred
      if (isAddingCustomSubject && !subjectsList.includes(finalSubject)) {
        setSubjectsList(prev => [...prev, finalSubject]);
      }

      setSubmitSuccess(`Question successfully created with ID #${added.id}! Saved to sheet spreadsheet.`);
      
      // Reset parts of form
      setNewQuestionPayload(prev => ({
        ...prev,
        question: '',
        answer: ''
      }));
      setNewSubject('');
      setNewLesson('');
      setIsAddingCustomSubject(false);
      setIsAddingCustomLesson(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to feed question.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Filtering + Sorting Computation Block
  const filteredAndSortedQuestions = useMemo(() => {
    let result = [...questions];

    // Filter by subject
    if (filters.subject !== 'all') {
      result = result.filter(q => q.subject === filters.subject);
    }

    // Filter by lesson
    if (filters.lesson !== 'all') {
      result = result.filter(q => q.lesson === filters.lesson);
    }

    // Search query matched in question body, answer, or lesson text
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.answer.toLowerCase().includes(query) ||
        q.lesson.toLowerCase().includes(query)
      );
    }

    // Sorting implementation
    result.sort((a, b) => {
      let valA: any = a[filters.sortField];
      let valB: any = b[filters.sortField];

      // Handle string versus number checks
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) {
        return filters.sortOrder === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return filters.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [questions, filters]);

  // Paginated questions list computation
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedQuestions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedQuestions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedQuestions.length / itemsPerPage) || 1;

  // Watch totals and reset current page to 1 if filter criteria returns less items
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Export database as JSON
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(filteredAndSortedQuestions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `hslc_questions_${filters.subject}_${filters.lesson || 'all'}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      console.error('JSON export error:', e);
    }
  };

  // Export database as CSV file
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Subject', 'Lesson', 'Marks', 'Year', 'Question', 'Answer', 'CreatedAt'];
      
      const csvRows = [
        headers.join(','), // Header row
        ...filteredAndSortedQuestions.map(q => {
          return [
            q.id,
            `"${q.subject.replace(/"/g, '""')}"`,
            `"${q.lesson.replace(/"/g, '""')}"`,
            q.marks,
            q.year,
            `"${q.question.replace(/"/g, '""').replace(/\n/g, ' ')}"`, // Sanitize carriage returns
            `"${q.answer.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${q.createdAt || ''}"`
          ].join(',');
        })
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `hslc_questions_${filters.subject}_${filters.lesson || 'all'}.csv`;
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', exportFileDefaultName);
      link.click();
    } catch (e) {
      console.error('CSV export error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col font-sans relative antialiased selection:bg-amber-500/30 selection:text-amber-250">
      
      {/* Decorative Gradients for Futuristic Accent */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-[#222] bg-[#0c0c0c]/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-sm flex items-center justify-center text-black font-bold">H</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif italic text-lg tracking-wide text-amber-50">HSLCE <span className="font-sans not-italic text-xs text-gray-500 uppercase tracking-widest ml-1">Mastery Hub</span></h1>
                <span className="px-2 py-0.5 bg-[#161616] border border-[#222] text-amber-500 font-mono text-[9px] font-medium tracking-widest rounded-sm">
                  v2026
                </span>
              </div>
              <p className="text-xs text-gray-500 font-sans">Question Management & Visitor Learning Portal</p>
            </div>
          </div>

          {/* Quick Stats Summary / Indicators */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-[#222] rounded-sm text-xs">
              <span className={`w-2 h-2 rounded-full ${dbMode === 'live' ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'}`} />
              <span className="text-gray-400 font-mono text-[11px] uppercase tracking-wider">
                {dbMode === 'live' ? 'Live connected' : 'Demo mode'}
              </span>
            </div>

            {/* Admin State Indicator */}
            {adminSession ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden md:inline font-sans">
                  Hello, <strong className="text-amber-100">{adminSession.username}</strong>
                </span>
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-3 py-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all rounded-sm text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Feed Question
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-[#161616] border border-[#222] hover:bg-[#202020] hover:text-amber-50 text-gray-300 text-xs rounded-sm flex items-center gap-1.5 transition-colors font-sans uppercase tracking-[0.1em]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-4 py-2 border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all rounded-sm text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Stats Dashboard */}
        <StatsDashboard 
          questions={questions} 
          subjects={subjectsList} 
        />

        {/* Question Explorer Header Section */}
        <div className="border-b border-[#222] flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-serif italic text-amber-50 tracking-wide uppercase">Question Explorer</h2>
            <span className="ml-2 px-2 py-0.5 bg-[#111] border border-[#222] text-xs rounded-sm font-mono text-amber-500">
              {filteredAndSortedQuestions.length} {filteredAndSortedQuestions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>

          {/* Core Export Actions directly available */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono mr-1 hidden md:inline uppercase tracking-wider">Export Visible:</span>
            <button
              onClick={handleExportCSV}
              disabled={filteredAndSortedQuestions.length === 0}
              className="p-1 px-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-gray-300 hover:text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export as spreadsheet CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filteredAndSortedQuestions.length === 0}
              className="p-1 px-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-gray-300 hover:text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export raw JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>

        {/* Dynamic Question Explorer Layout */}
        <div className="space-y-6">
          <div className="space-y-6">
                
                {/* Advanced Multi-filtering Suite */}
                <div className="bg-[#111] border border-[#222] p-5 rounded-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      <span className="font-serif italic tracking-wide text-sm text-amber-50">Filter Syllabi criteria</span>
                    </div>
                    <button
                      onClick={() => setFilters({
                        subject: 'all',
                        lesson: 'all',
                        sortField: 'year',
                        sortOrder: 'desc',
                        searchQuery: ''
                      })}
                      className="text-xs text-amber-500 hover:text-amber-400 font-mono transition-colors uppercase tracking-wider"
                    >
                      Clear Filters
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Choose Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-gray-500 block font-medium uppercase tracking-wider">Select Subject:</label>
                      <div className="relative">
                        <select
                          value={filters.subject}
                          onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value, lesson: 'all' }))}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-500 appearance-none pr-10 cursor-pointer"
                        >
                          <option value="all">📚 All Subjects ({subjectsList.length})</option>
                          {subjectsList.map((subj, index) => (
                            <option key={index} value={subj}>
                              {subj}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Choose Lesson */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-gray-500 block font-medium uppercase tracking-wider">Select Lesson:</label>
                      <div className="relative">
                        <select
                          value={filters.lesson}
                          disabled={filters.subject === 'all'}
                          onChange={(e) => setFilters(f => ({ ...f, lesson: e.target.value }))}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-500 appearance-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="all">📖 All Lessons ({lessonsList.length || '0'})</option>
                          {lessonsList.map((les, index) => (
                            <option key={index} value={les}>
                              {les}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-600">
                          <Layers className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Choose Sort Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-gray-500 block font-medium uppercase tracking-wider">Sort Criteria:</label>
                      <div className="relative">
                        <select
                          value={filters.sortField}
                          onChange={(e) => setFilters(f => ({ ...f, sortField: e.target.value as any }))}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-400 focus:outline-none focus:border-amber-500 appearance-none pr-10 cursor-pointer"
                        >
                          <option value="year">📅 Sort by Year</option>
                          <option value="marks">🏆 Sort by Marks</option>
                          <option value="lesson">🏷️ Sort by LessonName</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-600">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Toggle Sort Order */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-gray-500 block font-medium uppercase tracking-wider">Order Direction:</label>
                      <button
                        onClick={() => setFilters(f => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                        className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs font-medium text-gray-300 hover:text-amber-50 hover:border-amber-500/30 flex items-center justify-between text-left transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-amber-500" /> : <SortDesc className="w-4 h-4 text-amber-500" />}
                          {filters.sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-gray-600">toggle</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Search Bar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-500 block font-medium uppercase tracking-wider">Search Questions:</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search formulas, historical acts, theorems, words, or lesson names..."
                        value={filters.searchQuery}
                        onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                        className="w-full bg-[#0d0d0d] pl-10 pr-4 py-2.5 border border-[#222] rounded-sm font-sans text-xs text-gray-200 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                      />
                      {filters.searchQuery && (
                        <button
                          onClick={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-amber-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Data Table (Desktop) / Cards Grid (Mobile) Container */}
                {isLoading ? (
                  <div className="min-h-60 bg-[#111] border border-[#222] rounded-sm flex flex-col items-center justify-center p-10 space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Syncing sheets database questions stream...</span>
                  </div>
                ) : (filters.subject === 'all' || filters.lesson === 'all') ? (
                  <div className="min-h-[320px] bg-[#111] border border-[#222] rounded-sm flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-full text-amber-500/80">
                      <BookOpen className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="max-w-md space-y-2">
                      <h4 className="text-sm font-serif italic text-amber-200">Select Subject & Lesson to Load Questions</h4>
                      <p className="text-xs leading-relaxed text-gray-400">
                        To maintain a clear and focused study session, please select a specific <strong className="text-amber-500 font-semibold">Subject</strong> and <strong className="text-amber-500 font-semibold">Lesson/Chapter</strong> from the criteria dropdowns above to retrieve the respective past exam questions.
                      </p>
                    </div>
                  </div>
                ) : filteredAndSortedQuestions.length === 0 ? (
                  <div className="min-h-60 bg-[#111] border border-[#222] rounded-sm flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-full text-amber-500">
                      <Search className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <h4 className="text-sm font-serif italic text-amber-200">No HSLC Questions Found</h4>
                      <p className="text-xs leading-relaxed text-gray-500">
                        Adjust your subject, lesson filter, or type query. To test feeding your first question, click the "Admin Feed Panel" tab.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Card grid view on mobile devices, beautiful detailed tabular view on desktop screens */}
                    
                    {/* View Switch / Status Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                      <span>Showing {Math.min(filteredAndSortedQuestions.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredAndSortedQuestions.length, currentPage * itemsPerPage)} of {filteredAndSortedQuestions.length} entries</span>
                      
                      <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-[#0c0c0c] border border-[#222] rounded-sm px-1.5 py-0.5 text-[11px] text-gray-300 focus:outline-none cursor-pointer"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>

                    {/* TABLE: DESKTOP ONLY */}
                    <div className="hidden lg:block overflow-hidden bg-[#111] border border-[#222] rounded-sm">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-[#0c0c0c] border-b border-[#222] text-gray-400 font-sans uppercase tracking-wider font-semibold">
                            <th className="py-4.5 px-6 shrink-0 text-center">ID</th>
                            <th className="py-4.5 px-4 w-32">Subject</th>
                            <th className="py-4.5 px-4 w-44">Lesson</th>
                            <th className="py-4.5 px-4 text-center">Year</th>
                            <th className="py-4.5 px-4 text-center">Marks</th>
                            <th className="py-4.5 px-4">Exam Question</th>
                            <th className="py-4.5 px-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] text-gray-300">
                          {paginatedQuestions.map((q) => {
                            const isExpanded = expandedRowId === q.id;
                            return (
                              <React.Fragment key={q.id}>
                                <tr 
                                  className={`hover:bg-[#161616] transition-colors group cursor-pointer ${isExpanded ? 'bg-amber-500/5' : ''}`}
                                  onClick={() => setExpandedRowId(isExpanded ? null : q.id)}
                                >
                                  {/* ID column */}
                                  <td className="py-4 px-6 text-center font-mono text-gray-500 font-semibold group-hover:text-amber-554 transition-colors">
                                    #{q.id}
                                  </td>
                                  
                                  {/* Subject column */}
                                  <td className="py-4 px-4 font-semibold">
                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] rounded-sm uppercase font-mono tracking-wider">
                                      {q.subject}
                                    </span>
                                  </td>

                                  {/* Lesson Name */}
                                  <td className="py-4 px-4">
                                    <span className="text-gray-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis block max-w-44 font-sans" title={q.lesson}>
                                      {q.lesson}
                                    </span>
                                  </td>

                                  {/* Year Column */}
                                  <td className="py-4 px-4 text-center font-mono text-gray-300">
                                    {q.year}
                                  </td>

                                  {/* Marks Column */}
                                  <td className="py-4 px-4 text-center font-mono font-bold text-amber-400">
                                    {q.marks}M
                                  </td>

                                  {/* Question Brief Text */}
                                  <td className="py-4 px-4">
                                    <div className="text-gray-400 line-clamp-1 pr-6 tracking-wide text-xs max-w-md xl:max-w-2xl overflow-hidden text-ellipsis whitespace-nowrap">
                                      <LatexRenderer text={getBriefText(q.question)} />
                                    </div>
                                  </td>

                                  {/* Expand Button action column */}
                                  <td className="py-4 px-6 text-right">
                                    <button 
                                      className="p-1.5 hover:bg-[#1a1a1a] rounded-sm text-amber-500 hover:text-amber-405 flex items-center gap-1 ml-auto transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-mono leading-none">{isExpanded ? 'Collapse' : 'Reveal'}</span>
                                    </button>
                                  </td>
                                </tr>

                                {/* Collapsible Row Model Solution */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={7} className="bg-[#0c0c0c] p-0">
                                      <div className="p-6 border-l-2 border-amber-500 bg-[#0a0a0a]/50 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div>
                                            <span className="text-[10px] uppercase font-mono font-medium text-gray-500 block mb-1 tracking-wider">Full Exam Question:</span>
                                            <div className="text-amber-50 font-medium text-sm leading-relaxed font-sans space-y-1">
                                              {renderText(q.question)}
                                            </div>
                                          </div>
                                          <div className="bg-[#090909] p-5 rounded-sm border border-[#222] space-y-2">
                                            <span className="text-[10px] uppercase font-mono text-amber-500 block border-b border-[#222] pb-1 font-bold tracking-wider">
                                              ✓ Standard Evaluation Answer:
                                            </span>
                                            <div className="text-gray-400 text-xs leading-relaxed font-sans space-y-1">
                                              {renderText(q.answer)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE GRIDS AND CARDS: SHOWS ACCORDION ON TABLETS AND MOBILE */}
                    <div className="lg:hidden space-y-4.5">
                      {paginatedQuestions.map((q, idx) => (
                        <QuestionCard 
                          key={q.id} 
                          question={q} 
                          index={idx} 
                        />
                      ))}
                    </div>

                    {/* PAGINATION CONTROLS PANEL */}
                    <div className="bg-[#111] border border-[#222] rounded-sm p-4 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                        disabled={currentPage === 1}
                        className="px-3.5 py-2 bg-[#0c0c0c] hover:bg-[#1a1a1a] text-gray-300 text-xs font-semibold rounded-sm border border-[#222] flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                      </button>

                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const pageNum = i + 1;
                          const isCurrent = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-sm flex items-center justify-center font-semibold transition-all ${
                                isCurrent 
                                  ? 'bg-amber-500 text-black font-bold border border-amber-450' 
                                  : 'bg-[#0c0c0c] hover:bg-[#1a1a1a] text-gray-400 hover:text-amber-50 border border-[#222]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <div className="sm:hidden font-mono text-xs text-gray-500">
                        Page {currentPage} / {totalPages}
                      </div>

                      <button
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3.5 py-2 bg-[#0c0c0c] hover:bg-[#1a1a1a] text-gray-300 text-xs font-semibold rounded-sm border border-[#222] flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

          </div>
        </div>

        {/* Dynamic Admin workspace deactivated for overlay modal */}
        {false && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >

                {/* LOGIN PORTAL PROMPT IF STALE / NONE AUTHENTICATED */}
                {!adminSession ? (
                  <div className="max-w-md mx-auto bg-[#111] border border-[#222] rounded-sm p-6 sm:p-8 space-y-6 text-center animate-fadeIn">
                    <div className="mx-auto h-12 w-12 rounded-sm bg-amber-500/10 border border-amber-450/20 flex items-center justify-center text-amber-500">
                      <LogIn className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-serif italic text-lg font-bold text-amber-50 tracking-wide">Admin Authentication Required</h3>
                      <p className="text-xs text-gray-400 font-sans">Log in to feed exam questions directly to the spreadsheet.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 text-left font-sans">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Username</label>
                        <input
                          type="text"
                          placeholder="e.g. admin"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-200 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-200 placeholder-gray-655 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {loginError && (
                        <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-300 text-xs rounded-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        {isLoggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                        <span>Verify Session</span>
                      </button>
                    </form>

                    <div className="pt-4 border-t border-[#222] text-left bg-[#0c0c0c] p-4 rounded-sm text-[11px] text-gray-500 font-sans italic leading-relaxed">
                      *Note: If using Live Mode, credentials must match rows entered under the 'admins' Google sheet tab!
                    </div>
                  </div>
                ) : (
                  
                  /* FULL REGISTER FEED QUESTION WORKSPACE PORTAL */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT PANEL: FEED ENTRY FORM */}
                    <div className="lg:col-span-7 bg-[#111] border border-[#222] rounded-sm p-6 space-y-5">
                      <div className="flex items-center justify-between border-b border-[#222] pb-3">
                        <div>
                          <h3 className="font-serif italic text-base text-amber-50 tracking-wide">Feed Exam Question</h3>
                          <p className="text-xs text-gray-400 font-sans">Fill standard criteria to record a new sheet row.</p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-semibold tracking-wider uppercase rounded-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Authorized
                        </span>
                      </div>

                      <form onSubmit={handleAddQuestion} className="space-y-4">
                        
                        {/* Subject Selector row fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Choose or Custom Subject toggle */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-mono font-medium text-gray-400">Subject</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCustomSubject(!isAddingCustomSubject);
                                  setNewQuestionPayload(p => ({ ...p, subject: '' }));
                                }}
                                className="text-[10px] text-amber-500 hover:text-amber-454 font-mono underline"
                              >
                                {isAddingCustomSubject ? 'Select Existing' : '+ Add Custom'}
                              </button>
                            </div>

                            {isAddingCustomSubject ? (
                              <input
                                type="text"
                                placeholder="Enter custom subject (e.g. History)"
                                value={newSubject}
                                onChange={(e) => {
                                  setNewSubject(e.target.value);
                                  setNewQuestionPayload(p => ({ ...p, subject: e.target.value }));
                                }}
                                className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-amber-50 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                                required
                              />
                            ) : (
                              <select
                                value={newQuestionPayload.subject}
                                onChange={(e) => setNewQuestionPayload(p => ({ ...p, subject: e.target.value, lesson: '' }))}
                                className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                                required
                              >
                                <option value="">-- Choose Subject --</option>
                                {subjectsList.map((subj, index) => (
                                  <option key={index} value={subj}>{subj}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Choose or Custom Lesson toggle */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-mono font-medium text-gray-400">Lesson / Chapter</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCustomLesson(!isAddingCustomLesson);
                                  setNewQuestionPayload(p => ({ ...p, lesson: '' }));
                                }}
                                className="text-[10px] text-amber-500 hover:text-amber-454 font-mono underline"
                              >
                                {isAddingCustomLesson ? 'Select Existing' : '+ Add Custom'}
                              </button>
                            </div>

                            {isAddingCustomLesson ? (
                              <input
                                type="text"
                                placeholder="Enter custom lesson/unit name"
                                value={newLesson}
                                onChange={(e) => {
                                  setNewLesson(e.target.value);
                                  setNewQuestionPayload(p => ({ ...p, lesson: e.target.value }));
                                }}
                                className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-amber-50 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                                required
                              />
                            ) : (
                              <select
                                value={newQuestionPayload.lesson}
                                disabled={!newQuestionPayload.subject || isAddingCustomSubject}
                                onChange={(e) => setNewQuestionPayload(p => ({ ...p, lesson: e.target.value }))}
                                className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50"
                                required
                              >
                                <option value="">-- Select Lesson --</option>
                                {adminLessonsList.map((les, index) => (
                                  <option key={index} value={les}>{les}</option>
                                ))}
                              </select>
                            )}
                          </div>

                        </div>

                        {/* Marks and Year row input fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Marks Selection counter */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-mono font-medium text-gray-405">Marks Evaluation Allocation</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-sans">
                              {[1, 2, 3, 4, 5, 6].map((mk) => (
                                <button
                                  type="button"
                                  key={mk}
                                  onClick={() => setNewQuestionPayload(p => ({ ...p, marks: mk }))}
                                  className={`py-2 text-xs font-mono font-bold rounded-sm border transition-all ${
                                    newQuestionPayload.marks === mk
                                      ? 'bg-amber-500 border-amber-400 text-black shadow'
                                      : 'bg-[#0d0d0d] hover:bg-[#111] border-[#222] text-gray-400 hover:text-amber-50'
                                  }`}
                                >
                                  {mk}M
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Year select input dropdown/number input */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-mono font-medium text-gray-405">Syllabus Exam Year</label>
                            <input
                              type="number"
                              min={2018}
                              max={2030}
                              value={newQuestionPayload.year}
                              onChange={(e) => setNewQuestionPayload(p => ({ ...p, year: Number(e.target.value) }))}
                              className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-200 focus:outline-none focus:border-amber-500 font-mono"
                              required
                            />
                          </div>

                        </div>

                        {/* Question Input Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-medium text-gray-405">Exam Question Text</label>
                          <textarea
                            rows={3}
                            placeholder="Type the full exam prompt clearly including any values or directions..."
                            value={newQuestionPayload.question}
                            onChange={(e) => setNewQuestionPayload(p => ({ ...p, question: e.target.value }))}
                            className="w-full bg-[#0d0d0d] border border-[#222] p-3 rounded-sm text-xs text-gray-200 placeholder-gray-650 focus:outline-none focus:border-amber-500 resize-y"
                            required
                          />
                        </div>

                        {/* Model Solution Input Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-medium text-gray-405">Official Model standard Answer / Key steps</label>
                          <textarea
                            rows={4}
                            placeholder="Type step by step solution formulas, derivations or historical explanations. Use Enter for new lines..."
                            value={newQuestionPayload.answer}
                            onChange={(e) => setNewQuestionPayload(p => ({ ...p, answer: e.target.value }))}
                            className="w-full bg-[#0d0d0d] border border-[#222] p-3 rounded-sm text-xs text-gray-300 placeholder-gray-650 focus:outline-none focus:border-amber-500 resize-y font-sans"
                            required
                          />
                        </div>

                        {/* Status elements messages */}
                        {submitError && (
                          <div className="p-3.5 bg-rose-950/25 border border-rose-900/50 text-rose-350 text-xs rounded-sm flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {submitSuccess && (
                          <div className="p-3.5 bg-emerald-950/25 border border-emerald-900/50 text-emerald-300 text-xs rounded-sm flex items-start gap-2.5 animate-fadeIn">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{submitSuccess}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingQuestion}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                          {isSubmittingQuestion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>Record Question to Google Sheet</span>
                        </button>

                      </form>
                    </div>

                    {/* RIGHT PANEL: LIVE MODEL CARD PREVIEW */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-[#111] border border-[#222] rounded-sm p-4 flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> Real-time preview card
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Mock Output layout</span>
                      </div>

                      {/* Display QuestionCard */}
                      <QuestionCard 
                        question={{
                          id: 999,
                          subject: isAddingCustomSubject ? (newSubject || 'Custom Subject') : (newQuestionPayload.subject || 'Mathematics'),
                          lesson: isAddingCustomLesson ? (newLesson || 'Custom Lesson') : (newQuestionPayload.lesson || 'Trigonometry'),
                          marks: Number(newQuestionPayload.marks),
                          year: Number(newQuestionPayload.year),
                          question: newQuestionPayload.question || 'This is where your exam question prompt text appears. Start typing on the left form to see it render.',
                          answer: newQuestionPayload.answer || 'This is where your beautiful evaluation steps and explanation scheme answers render when revealed.',
                          createdAt: new Date().toISOString()
                        }}
                        index={0}
                      />
                    </div>

                  </div>
                )}

              </motion.div>
            )}

      </main>

      {/* State-of-the-art Admin Portal Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Ambient Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-5xl bg-[#0f0f0f] border border-[#222] rounded-sm p-6 sm:p-8 overflow-hidden z-10 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6"
            >
              {/* Modal Banner Header */}
              <div className="flex items-center justify-between border-b border-[#222] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-amber-500 rounded-sm flex items-center justify-center text-black font-bold font-sans">A</div>
                  <div>
                    <h3 className="font-serif italic text-base sm:text-lg text-amber-50 tracking-wide font-medium">HSLC Administrative Board Portal</h3>
                    <p className="text-xs text-gray-400 font-sans">Feed new curricula, test keys and parameters directly to the synced spreadsheet</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-1.5 bg-[#161616] hover:bg-[#202020] text-gray-400 hover:text-amber-50 rounded-sm border border-[#222] transition-colors flex items-center justify-center cursor-pointer"
                  title="Close dashboard"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Authentication Status Router inside the Modal */}
              {!adminSession ? (
                /* LOGIN FORM IN THE MODAL */
                <div className="max-w-md mx-auto w-full py-6 space-y-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-sm bg-amber-500/10 border border-amber-450/20 flex items-center justify-center text-amber-500">
                    <LogIn className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-50 uppercase tracking-widest font-mono">Verification Required</h4>
                    <p className="text-xs text-gray-400 font-sans">Authorized admins must enter credentials linked with the master sheet.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4 text-left font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. admin"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-200 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-200 placeholder-gray-655 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {loginError && (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-300 text-xs rounded-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      {isLoggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                      <span>Verify Session</span>
                    </button>
                  </form>

                  <div className="pt-4 border-t border-[#222] text-left bg-[#0c0c0c] p-4 rounded-sm text-[11px] text-gray-500 font-sans italic leading-relaxed">
                    *Note: If using Live Mode, credentials must match rows entered under the 'admins' Google sheet tab!
                  </div>
                </div>
              ) : (
                /* FEED QUESTION FORM IN THE MODAL */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
                  
                  {/* LEFT COLUMN: THE FORM */}
                  <div className="lg:col-span-12 xl:col-span-7 bg-[#111] border border-[#222] rounded-sm p-4 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-[#222] pb-3">
                      <div>
                        <h4 className="font-serif italic text-base text-amber-50 tracking-wide">Record New Question</h4>
                        <p className="text-xs text-gray-400 font-sans">Fill standard criteria to record a new sheet row.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-semibold tracking-wider uppercase rounded-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Authorized
                      </span>
                    </div>

                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      
                      {/* Subject Selector row fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Choose or Custom Subject toggle */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-medium text-gray-400">Subject</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCustomSubject(!isAddingCustomSubject);
                                setNewQuestionPayload(p => ({ ...p, subject: '' }));
                              }}
                              className="text-[10px] text-amber-500 hover:text-amber-444 font-mono underline cursor-pointer"
                            >
                              {isAddingCustomSubject ? 'Select Existing' : '+ Add Custom'}
                            </button>
                          </div>

                          {isAddingCustomSubject ? (
                            <input
                              type="text"
                              placeholder="Enter custom subject (e.g. History)"
                              value={newSubject}
                              onChange={(e) => {
                                setNewSubject(e.target.value);
                                setNewQuestionPayload(p => ({ ...p, subject: e.target.value }));
                              }}
                              className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-amber-50 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                              required
                            />
                          ) : (
                            <select
                              value={newQuestionPayload.subject}
                              onChange={(e) => setNewQuestionPayload(p => ({ ...p, subject: e.target.value, lesson: '' }))}
                              className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-505 cursor-pointer"
                              required
                            >
                              <option value="">-- Choose Subject --</option>
                              {subjectsList.map((subj, index) => (
                                <option key={index} value={subj}>{subj}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Choose or Custom Lesson toggle */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-medium text-gray-400">Lesson / Chapter</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCustomLesson(!isAddingCustomLesson);
                                setNewQuestionPayload(p => ({ ...p, lesson: '' }));
                              }}
                              className="text-[10px] text-amber-500 hover:text-amber-444 font-mono underline cursor-pointer"
                            >
                              {isAddingCustomLesson ? 'Select Existing' : '+ Add Custom'}
                            </button>
                          </div>

                          {isAddingCustomLesson ? (
                            <input
                              type="text"
                              placeholder="Enter custom lesson/unit name"
                              value={newLesson}
                              onChange={(e) => {
                                setNewLesson(e.target.value);
                                setNewQuestionPayload(p => ({ ...p, lesson: e.target.value }));
                              }}
                              className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-amber-50 placeholder-gray-650 focus:outline-none focus:border-amber-500"
                              required
                            />
                          ) : (
                            <select
                              value={newQuestionPayload.lesson}
                              disabled={!newQuestionPayload.subject || isAddingCustomSubject}
                              onChange={(e) => setNewQuestionPayload(p => ({ ...p, lesson: e.target.value }))}
                              className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-505 cursor-pointer disabled:opacity-50"
                              required
                            >
                              <option value="">-- Select Lesson --</option>
                              {adminLessonsList.map((les, index) => (
                                <option key={index} value={les}>{les}</option>
                              ))}
                            </select>
                          )}
                        </div>

                      </div>

                      {/* Marks and Year row input fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Marks Selection counter */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-medium text-gray-450 block">Marks Evaluation Allocation</label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-sans">
                            {[1, 2, 3, 4, 5, 6].map((mk) => (
                              <button
                                type="button"
                                key={mk}
                                onClick={() => setNewQuestionPayload(p => ({ ...p, marks: mk }))}
                                className={`py-2 text-xs font-mono font-bold rounded-sm border transition-all cursor-pointer ${
                                  newQuestionPayload.marks === mk
                                    ? 'bg-amber-500 border-amber-400 text-black shadow'
                                    : 'bg-[#0d0d0d] hover:bg-[#111] border-[#222] text-gray-400 hover:text-amber-50'
                                }`}
                              >
                                {mk}M
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Year select input dropdown/number input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-medium text-gray-455 block">Syllabus Exam Year</label>
                          <input
                            type="number"
                            min={2018}
                            max={2030}
                            value={newQuestionPayload.year}
                            onChange={(e) => setNewQuestionPayload(p => ({ ...p, year: Number(e.target.value) }))}
                            className="w-full bg-[#0d0d0d] border border-[#222] p-2.5 rounded-sm text-xs text-gray-250 font-mono focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                      </div>

                      {/* Question Input Textarea */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-medium text-gray-455 block">Exam Question Text</label>
                        <textarea
                          rows={3}
                          placeholder="Type the full exam prompt clearly including any values or directions..."
                          value={newQuestionPayload.question}
                          onChange={(e) => setNewQuestionPayload(p => ({ ...p, question: e.target.value }))}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-3 rounded-sm text-xs text-gray-255 focus:outline-none focus:border-amber-505 resize-y"
                          required
                        />
                      </div>

                      {/* Model Solution Input Textarea */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-medium text-gray-455 block">Official Model standard Answer / Key steps</label>
                        <textarea
                          rows={4}
                          placeholder="Type step by step solution formulas, derivations or historical explanations. Use Enter for new lines..."
                          value={newQuestionPayload.answer}
                          onChange={(e) => setNewQuestionPayload(p => ({ ...p, answer: e.target.value }))}
                          className="w-full bg-[#0d0d0d] border border-[#222] p-3 rounded-sm text-xs text-gray-300 focus:outline-none focus:border-amber-505 resize-y font-sans"
                          required
                        />
                      </div>

                      {/* Status elements messages */}
                      {submitError && (
                        <div className="p-3.5 bg-rose-950/25 border border-rose-900/50 text-rose-350 text-xs rounded-sm flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {submitSuccess && (
                        <div className="p-3.5 bg-emerald-950/25 border border-emerald-900/50 text-emerald-300 text-xs rounded-sm flex items-start gap-2.5 animate-fadeIn">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{submitSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingQuestion}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        {isSubmittingQuestion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Record Question to Google Sheet</span>
                      </button>

                    </form>
                  </div>

                  {/* RIGHT COLUMN: PREVIEW */}
                  <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                    <div className="bg-[#111] border border-[#222] rounded-sm p-4 flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <Eye className="w-3.5 h-3.5" /> Real-time preview card
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Mock Output layout</span>
                    </div>

                    {/* Display QuestionCard */}
                    <QuestionCard 
                      question={{
                        id: 999,
                        subject: isAddingCustomSubject ? (newSubject || 'Custom Subject') : (newQuestionPayload.subject || 'Mathematics'),
                        lesson: isAddingCustomLesson ? (newLesson || 'Custom Lesson') : (newQuestionPayload.lesson || 'Trigonometry'),
                        marks: Number(newQuestionPayload.marks),
                        year: Number(newQuestionPayload.year),
                        question: newQuestionPayload.question || 'This is where your exam question prompt text appears. Start typing on the left form to see it render.',
                        answer: newQuestionPayload.answer || 'This is where your beautiful evaluation steps and explanation scheme answers render when revealed.',
                        createdAt: new Date().toISOString()
                      }}
                      index={0}
                    />
                  </div>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Footer */}
      <footer className="border-t border-[#222] bg-[#0c0c0c] py-6 px-4 md:px-6 text-center mt-12 text-gray-505 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 HSLC Mastery Hub. All learning resources secure.</span>
          <div className="flex gap-4">
            <span className="hover:text-amber-500 transition-colors cursor-pointer">Terms of Assessment</span>
            <span>•</span>
            <span className="hover:text-amber-500 transition-colors cursor-pointer">Model Curriculum Guidelines</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
