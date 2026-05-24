/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Copy, Check, ExternalLink, Settings, Database, Code, RefreshCw } from 'lucide-react';

export default function SetupGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const sheetIdSample = '1UvHUyb-khosd01mzE9VsuzFJrZsCGNm6FK9q9yy03S8';

  const appsScriptCode = `const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

const TAB_ADMINS = 'admins';
const TAB_SUBJECTS = 'subjects';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data) {
  return jsonOut({ success:true, data:data });
}

function err(message) {
  return jsonOut({ success:false, error:message });
}

function verifyAdmin(username,password){
  const sheet = getSpreadsheet().getSheetByName(TAB_ADMINS);
  const rows = sheet
    .getRange(2,1,sheet.getLastRow()-1,2)
    .getValues();

  return rows.some(r =>
    String(r[0]).trim() === String(username).trim() &&
    String(r[1]).trim() === String(password).trim()
  );
}

function createToken(username){
  const token = Utilities.getUuid();
  CacheService
    .getScriptCache()
    .put('auth_' + token, username, 21600);
  return token;
}

function verifyToken(token){
  return CacheService
    .getScriptCache()
    .get('auth_' + token);
}

function getSubjectsList(){
  const sheet = getSpreadsheet()
    .getSheetByName(TAB_SUBJECTS);
  return sheet
    .getRange(2,1,sheet.getLastRow()-1,1)
    .getValues()
    .flat()
    .filter(Boolean);
}

function getLessonsForSubject(subject){
  const sheet = getSpreadsheet()
    .getSheetByName(TAB_SUBJECTS);
  const rows = sheet
    .getRange(2,1,sheet.getLastRow()-1,2)
    .getValues();

  const row = rows.find(r =>
    String(r[0]).trim() === String(subject).trim()
  );

  if(!row) return [];

  return String(row[1])
    .replace('[','')
    .replace(']','')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function ensureHeaders(sheet){
  const headers = [
    'ID','Subject','Lesson','Marks',
    'Year','Question','Answer','CreatedAt'
  ];

  if(sheet.getRange(1,1).getValue() !== 'ID'){
    sheet
      .getRange(1,1,1,headers.length)
      .setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function getNextId(sheet){
  if(sheet.getLastRow() < 2) return 1;
  const ids = sheet
    .getRange(2,1,sheet.getLastRow()-1,1)
    .getValues()
    .flat()
    .filter(Boolean)
    .map(Number);
  return ids.length ? Math.max(...ids)+1 : 1;
}

function addQuestion(payload){
  const sheet = getSpreadsheet()
    .getSheetByName(payload.subject);
  ensureHeaders(sheet);

  const row = [
    getNextId(sheet),
    payload.subject,
    payload.lesson,
    payload.marks,
    payload.year,
    payload.question,
    payload.answer,
    new Date().toISOString()
  ];

  sheet
    .getRange(sheet.getLastRow()+1,1,1,row.length)
    .setValues([row]);

  return row;
}

function getAllQuestions(){
  const ss = getSpreadsheet();
  const subjects = getSubjectsList();
  let all = [];

  subjects.forEach(subject => {
    const sheet = ss.getSheetByName(subject);
    if(!sheet || sheet.getLastRow() < 2) return;
    const rows = sheet
      .getRange(2,1,sheet.getLastRow()-1,8)
      .getValues();

    rows.forEach(r => {
      all.push({
        id:r[0],
        subject:r[1],
        lesson:r[2],
        marks:r[3],
        year:r[4],
        question:r[5],
        answer:r[6],
        createdAt:r[7]
      });
    });
  });

  return all.reverse();
}

function doGet(e){
  const params = e.parameter || {};
  if(!params.action){
    return HtmlService
      .createHtmlOutputFromFile('index')
      .setTitle('HSLCE Mastery Hub');
  }

  switch(params.action){
    case 'subjects':
      return ok({ subjects:getSubjectsList() });
    case 'lessons':
      return ok({ lessons:getLessonsForSubject(params.subject) });
    case 'questions':
      return ok({ questions:getAllQuestions() });
    default:
      return err('Invalid action');
  }
}

function doPost(e){
  const body = JSON.parse(e.postData.contents);
  switch(body.action){
    case 'login':
      const valid = verifyAdmin(body.username, body.password);
      if(!valid) return err('Invalid login');
      return ok({ token:createToken(body.username) });
    case 'add':
      if(!verifyToken(body.token)) return err('Unauthorized');
      return ok(addQuestion(body));
    default:
      return err('Invalid action');
  }
}`;

  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-sans font-medium text-amber-50 hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-sm">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif italic text-amber-50 tracking-wide">Setup Guide & Sheet Connection</h3>
            <p className="text-xs text-gray-500 mt-0.5">How to deploy Google Apps Script & configure live database sync</p>
          </div>
        </div>
        <div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-[#222] bg-[#0d0d0d] space-y-6 text-sm text-gray-300 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Google Sheet Structuring */}
            <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-sm border border-[#222]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full font-mono">1</span>
                <h4 className="font-serif italic tracking-wide text-amber-50">Prepare Google Sheets</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Create a new Google Sheet. You will need to setup at least 3 tabs inside it:
              </p>
              <ul className="space-y-2 text-xs font-mono pl-2 text-gray-300">
                <li className="flex items-start gap-1">
                  <span className="text-amber-500">●</span> 
                  <div>
                    <strong className="text-amber-100">admins</strong>: Create columns: <span className="text-gray-500">username</span>, <span className="text-gray-500">password</span>. Add your admin credentials on row 2 (e.g. <span className="text-amber-500">admin</span> / <span className="text-amber-100">admin123</span>).
                  </div>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-amber-500">●</span>
                  <div>
                    <strong className="text-amber-100">subjects</strong>: Create columns: <span className="text-gray-500">subject</span>, <span className="text-gray-500">lessons</span>. 
                    <br/>
                    <em className="text-xs text-amber-200 opacity-80 font-sans mt-1 block italic">
                      Example: Row 2 subject: <strong>Mathematics</strong>, lessons: <strong>[Quadratic Equations, Trigonometry, Circles]</strong>
                    </em>
                  </div>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-amber-500">●</span>
                  <div>
                    <strong className="text-amber-100">Mathematics, Science, etc.</strong>: App's script automatically creates standard header sheets to hold submitted questions matching the listed subjects.
                  </div>
                </li>
              </ul>
              
              <div className="mt-4 pt-3 border-t border-[#222] flex justify-between items-center text-xs">
                <span className="text-gray-500 font-sans">Sheet ID located in the URL:</span>
                <button
                  onClick={() => copyToClipboard(sheetIdSample, setCopiedId)}
                  className="px-2 py-1 bg-[#161616] border border-[#222] hover:border-amber-500/30 text-gray-300 text-[10px] rounded-sm flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedId ? <Check className="w-3 h-3 text-amber-500" /> : <Copy className="w-3 h-3" />}
                  Copy Sample ID
                </button>
              </div>
            </div>

            {/* Step 2: Deploying Code */}
            <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-sm border border-[#222]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full font-mono">2</span>
                <h4 className="font-serif italic tracking-wide text-amber-50">Deploy Apps Script Web App</h4>
              </div>
              <ol className="space-y-1.5 list-decimal pl-4 text-xs text-gray-400 leading-relaxed font-sans">
                <li>In Google Sheets, go to <strong className="text-gray-200">Extensions &gt; Apps Script</strong>.</li>
                <li>Delete any default code, and paste the generated backend code (on the right).</li>
                <li>Replace the <code className="text-amber-200 font-mono text-[11px]">SHEET_ID</code> variable with your real Spreadsheet ID.</li>
                <li>Click the <strong className="text-gray-200">Save</strong> disk icon.</li>
                <li>Click <strong className="text-amber-500">Deploy &gt; New deployment</strong>.</li>
                <li>Select type: <strong className="text-gray-200">Web app</strong>.</li>
                <li>Set Web App configurations:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-gray-300 font-sans">
                    <li>Execute as: <strong className="text-gray-200">Me (your-email)</strong></li>
                    <li>Who has access: <strong className="text-amber-500">Anyone</strong></li>
                  </ul>
                </li>
                <li>Click <strong className="text-amber-500">Deploy</strong>, authorize permissions, and copy the generated <strong className="text-gray-200">Web App URL</strong></li>
              </ol>
            </div>
          </div>

          {/* Script Code Block */}
          <div className="space-y-2 font-sans">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-mono">
                <Code className="w-3.5 h-3.5" /> Code.gs (Google Apps Script Code)
              </span>
              <button
                onClick={() => copyToClipboard(appsScriptCode, setCopiedScript)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-1.5 transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? 'Copied script!' : 'Copy backend code'}
              </button>
            </div>
            
            <div className="relative max-h-60 overflow-y-auto rounded-sm border border-[#222] bg-[#080808] font-mono text-xs text-gray-400 p-4">
              <pre className="whitespace-pre">{appsScriptCode}</pre>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed text-center italic mt-1 font-sans">
              *Note: Bypassing CORS is pre-configured into our application interface, ensuring fluid responses direct from Google servers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
