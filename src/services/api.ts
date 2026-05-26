/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, NewQuestionPayload } from '../types';

// Let's seed some beautiful high-quality initial data for the local storage mode
const INITIAL_DEMO_SUBJECT_DATA: Record<string, string[]> = {
  'Mathematics': [
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Surface Areas and Volumes',
    'Statistics'
  ],
  'Science': [
    'Chemical Reactions and Equations',
    'Acids, Bases and Salts',
    'Metals and Non-metals',
    'Carbon and its Compounds',
    'Life Processes',
    'Control and Coordination',
    'Light - Reflection and Refraction',
    'Electricity'
  ],
  'Social Science': [
    'Rise of Nationalism in Europe',
    'Nationalism in India',
    'Resources and Development',
    'Forest and Wildlife Resources',
    'Federalism',
    'Gender, Religion and Caste',
    'Development',
    'Sectors of the Indian Economy'
  ],
  'English': [
    'A Letter to God',
    'Nelson Mandela: Long Walk to Freedom',
    'Two Stories about Flying',
    'From the Diary of Anne Frank',
    'Dust of Snow',
    'Fire and Ice',
    'The Midnight Visitor',
    'A Question of Trust'
  ]
};

const INITIAL_DEMO_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'Mathematics',
    lesson: 'Quadratic Equations',
    marks: 4,
    year: 2024,
    question: 'Solve the quadratic equation using the quadratic formula: $3x^2 - 5x + 2 = 0$. Show all steps clearly.',
    answer: 'Given equation: $$3x^2 - 5x + 2 = 0$$ \nHere, $a = 3$, $b = -5$, $c = 2$. \nUsing Quadratic Formula: \n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ \n$$x = \\frac{-(-5) \\pm \\sqrt{(-5)^2 - 4(3)(2)}}{2(3)}$$ \n$$x = \\frac{5 \\pm \\sqrt{25 - 24}}{6}$$ \n$$x = \\frac{5 \\pm 1}{6}$$ \nPossible roots: \n- $x_1 = \\frac{5 + 1}{6} = 1$ \n- $x_2 = \\frac{5 - 1}{6} = \\frac{4}{6} = \\frac{2}{3}$. \n\nTherefore, roots are $1$ and $\\frac{2}{3}$.',
    createdAt: new Date('2026-05-15T10:00:00Z').toISOString()
  },
  {
    id: 2,
    subject: 'Mathematics',
    lesson: 'Trigonometry',
    marks: 5,
    year: 2025,
    question: 'Prove that $(\\sin A + \\csc A)^2 + (\\cos A + \\sec A)^2 = 7 + \\tan^2 A + \\cot^2 A$.',
    answer: 'LHS $= (\\sin A + \\csc A)^2 + (\\cos A + \\sec A)^2$ \n$$= (\\sin^2 A + \\csc^2 A + 2\\sin A\\csc A) + (\\cos^2 A + \\sec^2 A + 2\\cos A\\sec A)$$ \nSince $\\sin A \\csc A = 1$ and $\\cos A \\sec A = 1$: \n$$= \\sin^2 A + \\csc^2 A + 2 + \\cos^2 A + \\sec^2 A + 2$$ \n$$= (\\sin^2 A + \\cos^2 A) + \\csc^2 A + \\sec^2 A + 4$$ \n$$= 1 + (1 + \\cot^2 A) + (1 + \\tan^2 A) + 4$$   [Using identity: $\\csc^2 A = 1 + \\cot^2 A$, $\\sec^2A = 1 + \\tan^2 A$] \n$$= 1 + 1 + \\cot^2 A + 1 + \\tan^2 A + 4$$ \n$$= 7 + \\tan^2 A + \\cot^2 A = \\text{RHS}$$. Hence Proved.',
    createdAt: new Date('2026-05-18T12:00:00Z').toISOString()
  },
  {
    id: 3,
    subject: 'Science',
    lesson: 'Chemical Reactions and Equations',
    marks: 3,
    year: 2023,
    question: 'Why is respiration considered an exothermic reaction? Explain with the chemical equation.',
    answer: 'Respiration is considered an exothermic reaction because energy is released during this process. During digestion, food is broken down into simple molecules like glucose. This glucose combines with oxygen in the cells of our body and releases energy. \n\nChemical Equation: \n$$\\text{C}_6\\text{H}_{12}\\text{O}_6 (aq) + 6\\text{O}_2 (g) \\rightarrow 6\\text{CO}_2 (g) + 6\\text{H}_2\\text{O} (l) + \\text{Energy (ATP)}$$',
    createdAt: new Date('2026-05-10T14:30:00Z').toISOString()
  },
  {
    id: 4,
    subject: 'Science',
    lesson: 'Electricity',
    marks: 5,
    year: 2024,
    question: 'Derive the expression for the equivalent resistance of three resistors $R_1$, $R_2$, and $R_3$ connected in parallel. Draw the circuit diagram representation in words.',
    answer: 'In a parallel combination, the potential difference ($V$) across each resistor is the same, whereas the total current ($I$) is the sum of currents through individual resistors: \n$$I = I_1 + I_2 + I_3$$ \n\nBy Ohm\'s law: \n$$I = \\frac{V}{R_p}$$ \n$$I_1 = \\frac{V}{R_1}, \\quad I_2 = \\frac{V}{R_2}, \\quad I_3 = \\frac{V}{R_3}$$ \n\nSubstituting these values: \n$$\\frac{V}{R_p} = \\frac{V}{R_1} + \\frac{V}{R_2} + \\frac{V}{R_3}$$ \nDividing both sides by $V$, we get: \n$$\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$$ \nWhere $R_p$ is the equivalent parallel resistance.',
    createdAt: new Date('2026-05-12T09:15:00Z').toISOString()
  },
  {
    id: 5,
    subject: 'Social Science',
    lesson: 'Nationalism in India',
    marks: 4,
    year: 2023,
    question: 'Discuss the impact of the Non-Cooperation Movement on the economic front in India.',
    answer: 'The effects of non-cooperation on the economic front were dramatic: \n1. Foreign goods were boycotted, liquor shops picketed, and foreign clothes burnt in huge bonfires. \n2. The import of foreign cloth halved between 1921 and 1922, its value dropping from Rs 102 crore to Rs 57 crore. \n3. In many places, merchants and traders refused to trade in foreign goods or finance foreign trade. \n4. As the boycott movement spread, people began discarding imported clothes and wearing only Indian ones, boosting production in Indian textile mills and handlooms.',
    createdAt: new Date('2026-05-08T11:00:00Z').toISOString()
  },
  {
    id: 6,
    subject: 'English',
    lesson: 'A Letter to God',
    marks: 2,
    year: 2025,
    question: 'Why did Lencho write a letter to God? How much money did he request and how much did he receive?',
    answer: 'Lencho wrote a letter to God because his entire cornfield was destroyed by a severe hailstorm, leaving him and his family on the verge of starvation. Having immense faith in God, he requested 100 pesos to sow his field again and support his family. He received only 70 pesos, which were collected and sent by the generous postmaster and post office employees.',
    createdAt: new Date('2026-05-20T15:45:00Z').toISOString()
  }
];

export class AppScriptService {
  private static STORAGE_KEY_URL = 'hslc_hub_webapp_url';
  private static STORAGE_KEY_QUESTIONS = 'hslc_hub_questions_local';
  private static STORAGE_KEY_SUBJECTS = 'hslc_hub_subjects_local';
  private static STORAGE_KEY_MODE = 'hslc_hub_mode'; // 'live' | 'demo'
  private static DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwZyqb1eO1Xn19jTYNAwHlLrILeSVnTt3Y2MGBr_vQqQN5weVe7YBxWqhE2NHiI2DvrbA/exec';

  static getWebAppUrl(): string {
    const saved = localStorage.getItem(this.STORAGE_KEY_URL);
    if (saved === null) {
      return this.DEFAULT_WEBAPP_URL;
    }
    return saved;
  }

  static setWebAppUrl(url: string) {
    if (url) {
      localStorage.setItem(this.STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.setItem(this.STORAGE_KEY_URL, '');
    }
  }

  static getMode(): 'live' | 'demo' {
    const saved = localStorage.getItem(this.STORAGE_KEY_MODE);
    if (saved === 'demo') {
      return 'demo';
    }
    if (saved === 'live') {
      return 'live';
    }
    // Default to 'live' if we have a valid web app URL
    return this.getWebAppUrl() ? 'live' : 'demo';
  }

  static setMode(mode: 'live' | 'demo') {
    localStorage.setItem(this.STORAGE_KEY_MODE, mode);
  }

  // Initialize Local Storage with beautiful demo content if not populated
  static initializeLocalData() {
    if (!localStorage.getItem(this.STORAGE_KEY_QUESTIONS)) {
      localStorage.setItem(this.STORAGE_KEY_QUESTIONS, JSON.stringify(INITIAL_DEMO_QUESTIONS));
    }
    if (!localStorage.getItem(this.STORAGE_KEY_SUBJECTS)) {
      localStorage.setItem(this.STORAGE_KEY_SUBJECTS, JSON.stringify(INITIAL_DEMO_SUBJECT_DATA));
    }
  }

  // Fetch all available subjects
  static async getSubjects(): Promise<string[]> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = `${this.getWebAppUrl()}?action=subjects`;
        const res = await fetch(url, { redirect: 'follow' });
        const json = await res.json();
        if (json.success && json.data && json.data.subjects) {
          return json.data.subjects;
        }
        throw new Error(json.error || 'Failed to parse subjects');
      } catch (err) {
        console.error('Error fetching live subjects, falling back to local list:', err);
        // Fallback to locally stored subjects
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    const subjectsMap = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SUBJECTS) || '{}');
    return Object.keys(subjectsMap);
  }

  // Fetch all lessons for a given subject
  static async getLessons(subject: string): Promise<string[]> {
    if (!subject) return [];

    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = `${this.getWebAppUrl()}?action=lessons&subject=${encodeURIComponent(subject)}`;
        const res = await fetch(url, { redirect: 'follow' });
        const json = await res.json();
        if (json.success && json.data && json.data.lessons) {
          return json.data.lessons;
        }
        throw new Error(json.error || 'Failed to parse lessons');
      } catch (err) {
        console.error(`Error fetching live lessons for ${subject}:`, err);
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    const subjectsMap = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SUBJECTS) || '{}');
    return subjectsMap[subject] || [];
  }

  // Fetch all questions
  static async getQuestions(): Promise<Question[]> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = `${this.getWebAppUrl()}?action=questions`;
        const res = await fetch(url, { redirect: 'follow' });
        const json = await res.json();
        if (json.success && json.data && json.data.questions) {
          // Format questions dates and parse IDs
          return json.data.questions.map((q: any) => ({
            id: Number(q.id),
            subject: String(q.subject),
            lesson: String(q.lesson),
            marks: Number(q.marks),
            year: Number(q.year),
            question: String(q.question),
            answer: String(q.answer),
            createdAt: q.createdAt ? String(q.createdAt) : new Date().toISOString()
          }));
        }
        throw new Error(json.error || 'Failed to parse questions');
      } catch (err) {
        console.error('Error fetching live questions, falling back:', err);
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUESTIONS) || '[]');
  }

  // Admin login request
  static async login(username: string, password: string): Promise<string> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = this.getWebAppUrl();
        // Send as standard request body without standard headers to bypass CORS configuration blocks preflight
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'login',
            username,
            password
          })
        });
        const json = await response.json();
        if (json.success && json.data && json.data.token) {
          return json.data.token;
        }
        throw new Error(json.error || 'Invalid credentials');
      } catch (err: any) {
        console.error('AppScript Login Error:', err);
        throw new Error(err.message || 'Login failed due to connection error');
      }
    }

    // Local Storage Mode: Verify using default demo credentials 'admin' & 'password'
    if (username.trim().toLowerCase() === 'admin' && password.trim() === 'admin123') {
      const mockToken = 'mock-session-token-' + Math.random().toString(36).substring(2);
      return mockToken;
    } else {
      throw new Error('Invalid credentials. Use admin / admin123 for local demo mode.');
    }
  }

  // Add question
  static async addQuestion(token: string, payload: NewQuestionPayload): Promise<Question> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = this.getWebAppUrl();
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'add',
            token,
            ...payload
          })
        });
        const json = await response.json();
        if (json.success && json.data) {
          const q = json.data;
          // Format output match
          return {
            id: Number(q[0] || 0),
            subject: String(q[1] || payload.subject),
            lesson: String(q[2] || payload.lesson),
            marks: Number(q[3] || payload.marks),
            year: Number(q[4] || payload.year),
            question: String(q[5] || payload.question),
            answer: String(q[6] || payload.answer),
            createdAt: String(q[7] || new Date().toISOString())
          };
        }
        throw new Error(json.error || 'Failed to add question to Sheets');
      } catch (err: any) {
        console.error('AppScript Add Question Error:', err);
        throw new Error(err.message || 'Error occurred while saving question to Google Sheet.');
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    const questions: Question[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUESTIONS) || '[]');
    
    // Add custom lesson/subject dynamically to local storage subject schema if new
    const subjectsMap = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SUBJECTS) || '{}');
    if (!subjectsMap[payload.subject]) {
      subjectsMap[payload.subject] = [];
    }
    if (!subjectsMap[payload.subject].includes(payload.lesson)) {
      subjectsMap[payload.subject].push(payload.lesson);
      localStorage.setItem(this.STORAGE_KEY_SUBJECTS, JSON.stringify(subjectsMap));
    }

    const nextId = questions.length ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion: Question = {
      id: nextId,
      subject: payload.subject,
      lesson: payload.lesson,
      marks: Number(payload.marks),
      year: Number(payload.year),
      question: payload.question,
      answer: payload.answer,
      createdAt: new Date().toISOString()
    };

    questions.push(newQuestion);
    localStorage.setItem(this.STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
    return newQuestion;
  }

  // Edit/Update question
  static async editQuestion(token: string, id: number, payload: NewQuestionPayload): Promise<Question> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = this.getWebAppUrl();
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'update',
            token,
            id,
            ...payload
          })
        });
        const json = await response.json();
        if (json.success && json.data) {
          const q = json.data;
          return {
            id: Number(q[0] || id),
            subject: String(q[1] || payload.subject),
            lesson: String(q[2] || payload.lesson),
            marks: Number(q[3] || payload.marks),
            year: Number(q[4] || payload.year),
            question: String(q[5] || payload.question),
            answer: String(q[6] || payload.answer),
            createdAt: String(q[7] || new Date().toISOString())
          };
        }
        
        // Fallback retry with action: 'edit' in case that is defined in the Apps Script
        const responseEdit = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'edit',
            token,
            id,
            ...payload
          })
        });
        const jsonEdit = await responseEdit.json();
        if (jsonEdit.success && jsonEdit.data) {
          const q = jsonEdit.data;
          return {
            id: Number(q[0] || id),
            subject: String(q[1] || payload.subject),
            lesson: String(q[2] || payload.lesson),
            marks: Number(q[3] || payload.marks),
            year: Number(q[4] || payload.year),
            question: String(q[5] || payload.question),
            answer: String(q[6] || payload.answer),
            createdAt: String(q[7] || new Date().toISOString())
          };
        }
        throw new Error(json.error || jsonEdit.error || 'Failed to update question in Sheets');
      } catch (err: any) {
        console.error('AppScript Edit Question Error:', err);
        throw new Error(err.message || 'Error occurred while saving updated question to Google Sheet.');
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    const questions: Question[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUESTIONS) || '[]');
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) {
      throw new Error('Question not found');
    }

    // Add custom lesson/subject dynamically to local storage subject schema if new
    const subjectsMap = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SUBJECTS) || '{}');
    if (!subjectsMap[payload.subject]) {
      subjectsMap[payload.subject] = [];
    }
    if (!subjectsMap[payload.subject].includes(payload.lesson)) {
      subjectsMap[payload.subject].push(payload.lesson);
      localStorage.setItem(this.STORAGE_KEY_SUBJECTS, JSON.stringify(subjectsMap));
    }

    const updatedQuestion: Question = {
      ...questions[index],
      subject: payload.subject,
      lesson: payload.lesson,
      marks: Number(payload.marks),
      year: Number(payload.year),
      question: payload.question,
      answer: payload.answer
    };

    questions[index] = updatedQuestion;
    localStorage.setItem(this.STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
    return updatedQuestion;
  }

  // Delete question
  static async deleteQuestion(token: string, id: number): Promise<boolean> {
    const mode = this.getMode();
    if (mode === 'live') {
      try {
        const url = this.getWebAppUrl();
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'delete',
            token,
            id
          })
        });
        const json = await response.json();
        if (json.success) {
          return true;
        }
        throw new Error(json.error || 'Failed to delete question from Sheets');
      } catch (err: any) {
        console.error('AppScript Delete Question Error:', err);
        throw new Error(err.message || 'Error occurred while deleting question from Google Sheet.');
      }
    }

    // Local Storage Mode
    this.initializeLocalData();
    const questions: Question[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUESTIONS) || '[]');
    const filtered = questions.filter(q => q.id !== id);
    if (filtered.length === questions.length) {
      throw new Error('Question not found');
    }
    localStorage.setItem(this.STORAGE_KEY_QUESTIONS, JSON.stringify(filtered));
    return true;
  }
}
