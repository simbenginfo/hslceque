/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: number;
  subject: string;
  lesson: string;
  marks: number;
  year: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface FilterState {
  subject: string;
  lesson: string;
  sortField: 'year' | 'marks' | 'lesson';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

export interface AdminSession {
  token: string;
  username: string;
  loginTime: string;
}

export interface NewQuestionPayload {
  subject: string;
  lesson: string;
  marks: number;
  year: number;
  question: string;
  answer: string;
}
