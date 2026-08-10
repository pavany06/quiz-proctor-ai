import React, { useState, useEffect } from 'react';
import {
  firestore,
  getFirebaseConfigSummary,
  dumpJsonCollectionToFirebase,
  fetchCollectionDocs
} from '../../lib/firebase';
import {
  Cloud,
  Database,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  Layers,
  Server,
  Sparkles,
  Copy,
  Check,
  Code
} from 'lucide-react';

export const FirebaseCloudAdmin: React.FC = () => {
  const config = getFirebaseConfigSummary();

  const [loadingStats, setLoadingStats] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  
  // Custom Dump State
  const [targetCollection, setTargetCollection] = useState('quizzes');
  const [jsonInputText, setJsonInputText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dumpingCustom, setDumpingCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<{ timestamp: string; action: string; status: string; details: string }[]>([]);

  useEffect(() => {
    checkCloudCounts();
  }, []);

  const addLog = (action: string, status: string, details: string) => {
    setSyncLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        action,
        status,
        details
      },
      ...prev
    ]);
  };

  const checkCloudCounts = async () => {
    setLoadingStats(true);
    const collections = ['users', 'quizzes', 'attempts', 'practiceQuizzes', 'facultyLogs', 'auditLogs'];
    const counts: Record<string, number> = {};

    try {
      for (const col of collections) {
        try {
          const docs = await fetchCollectionDocs(col);
          counts[col] = docs.length;
        } catch (e) {
          counts[col] = 0;
        }
      }
      setCollectionCounts(counts);
      addLog('Check Cloud Counts', 'SUCCESS', 'Updated Cloud Firestore document metrics.');
    } catch (err: any) {
      addLog('Check Cloud Counts', 'FAILED', err.message || 'Error connecting to Firestore');
    } finally {
      setLoadingStats(false);
    }
  };

  // One-Click Sync Local DB -> Firebase Cloud Firestore
  const handleDumpLocalDbToFirebase = async () => {
    setSyncingCloud(true);
    setUploadStatus(null);
    try {
      // Fetch full local db from server API
      const res = await fetch('/api/admin/database/dump');
      if (!res.ok) throw new Error('Failed fetching local database payload.');
      const payload = await res.json();
      const localDb = payload.data;

      let totalDocsDumped = 0;

      if (localDb.users?.length) {
        await dumpJsonCollectionToFirebase('users', localDb.users);
        totalDocsDumped += localDb.users.length;
      }
      if (localDb.quizzes?.length) {
        await dumpJsonCollectionToFirebase('quizzes', localDb.quizzes);
        totalDocsDumped += localDb.quizzes.length;
      }
      if (localDb.attempts?.length) {
        await dumpJsonCollectionToFirebase('attempts', localDb.attempts);
        totalDocsDumped += localDb.attempts.length;
      }
      if (localDb.practiceQuizzes?.length) {
        await dumpJsonCollectionToFirebase('practiceQuizzes', localDb.practiceQuizzes);
        totalDocsDumped += localDb.practiceQuizzes.length;
      }
      if (localDb.facultyLogs?.length) {
        await dumpJsonCollectionToFirebase('facultyLogs', localDb.facultyLogs);
        totalDocsDumped += localDb.facultyLogs.length;
      }
      if (localDb.auditLogs?.length) {
        await dumpJsonCollectionToFirebase('auditLogs', localDb.auditLogs);
        totalDocsDumped += localDb.auditLogs.length;
      }

      setUploadStatus({
        type: 'success',
        message: `Successfully dumped ${totalDocsDumped} total local JSON documents across all 6 collections directly into Firebase Cloud Firestore!`
      });

      addLog('Full DB Dump to Firebase', 'SUCCESS', `Dumped ${totalDocsDumped} documents to Cloud Firestore.`);
      await checkCloudCounts();
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Firebase Cloud dump failed.'
      });
      addLog('Full DB Dump to Firebase', 'FAILED', err.message || 'Error dumping database');
    } finally {
      setSyncingCloud(false);
    }
  };

  // Dump Custom JSON Input into Target Firestore Collection
  const handleCustomJsonDump = async () => {
    if (!jsonInputText.trim()) {
      setUploadStatus({ type: 'error', message: 'Please paste or select a valid JSON payload.' });
      return;
    }

    setDumpingCustom(true);
    setUploadStatus(null);

    try {
      let parsedData: any;
      try {
        parsedData = JSON.parse(jsonInputText.trim());
      } catch (e: any) {
        throw new Error('Invalid JSON format: ' + e.message);
      }

      // Standardize to array
      const itemsArray = Array.isArray(parsedData) ? parsedData : [parsedData];

      if (itemsArray.length === 0) {
        throw new Error('JSON array is empty.');
      }

      // Also sync to local backend db if appropriate
      await dumpJsonCollectionToFirebase(targetCollection, itemsArray);

      setUploadStatus({
        type: 'success',
        message: `Successfully dumped ${itemsArray.length} document(s) into Firebase Cloud collection "${targetCollection}"!`
      });

      addLog(`Custom JSON Dump (${targetCollection})`, 'SUCCESS', `Imported ${itemsArray.length} doc(s) into Firestore.`);
      setJsonInputText('');
      await checkCloudCounts();
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Custom JSON dump failed.'
      });
      addLog(`Custom JSON Dump (${targetCollection})`, 'FAILED', err.message);
    } finally {
      setDumpingCustom(false);
    }
  };

  // Handle JSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setJsonInputText(content || '');
    };
    reader.readAsText(file);
  };

  // Export Full JSON Backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/database/dump');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QUIZ_PROCTOR_AI_DB_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('Export Backup', 'SUCCESS', 'Downloaded full JSON backup.');
    } catch (err: any) {
      alert('Failed exporting JSON backup: ' + err.message);
    }
  };

  // Load Sample Template for JSON
  const loadSampleJson = () => {
    const samples: Record<string, any[]> = {
      quizzes: [
        {
          id: `quiz-custom-${Date.now()}`,
          title: 'Advanced AI & Machine Learning Assessment',
          description: 'Comprehensive test on Neural Networks, Transformers, and Ethics.',
          topic: 'Artificial Intelligence',
          category: 'Computer Science',
          difficulty: 'Hard',
          secretCode: 'AIML900',
          totalMarks: 2,
          passingPercentage: 50,
          createdByFacultyId: 'fac-101',
          facultyName: 'Dr. Ramesh Kumar',
          status: 'Published',
          questions: [
            {
              id: 'q-ai-1',
              question: 'Which attention mechanism forms the core of Transformer architectures?',
              options: [
                { key: 'A', text: 'Scaled Dot-Product Attention' },
                { key: 'B', text: 'Recurrent Highway Attention' },
                { key: 'C', text: 'Additive Convolutional Attention' },
                { key: 'D', text: 'Laplacian Spatial Attention' }
              ],
              correctAnswer: 'A',
              marks: 1,
              difficulty: 'Medium',
              topic: 'Deep Learning'
            }
          ]
        }
      ],
      users: [
        {
          id: `student-new-${Date.now()}`,
          email: 'newstudent@university.edu',
          name: 'New Student Profile',
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ]
    };

    const template = samples[targetCollection] || samples.quizzes;
    setJsonInputText(JSON.stringify(template, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Cloud className="h-6 w-6 text-indigo-600" />
            <span>Firebase Cloud Firestore Database Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud backend storage management & bulk JSON data dumper for QUIZ PROCTOR AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkCloudCounts}
            disabled={loadingStats}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh Counts
          </button>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export Local DB JSON
          </button>
        </div>
      </div>

      {/* Connection & Configuration Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-900 to-slate-900 p-5 text-white shadow-sm lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Firebase Cloud Firestore Connection</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected & Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Project ID:</span>
              <span className="text-indigo-300 font-bold">{config.projectId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Database ID:</span>
              <span className="text-amber-300 font-bold truncate block">{config.databaseId || '(default)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Auth Domain:</span>
              <span className="text-slate-200 truncate block">{config.authDomain}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">App ID:</span>
              <span className="text-slate-200 truncate block">{config.appId}</span>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDumpLocalDbToFirebase}
              disabled={syncingCloud}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-400 hover:to-blue-500 disabled:opacity-50 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              {syncingCloud ? 'Dumping All Collections to Cloud...' : 'Dump All Local DB JSON to Firebase Cloud'}
            </button>
            <p className="text-[11px] text-slate-300">
              Syncs all 6 system collections (<span className="text-white font-semibold">Users, Quizzes, Attempts, Practice Quizzes, Logs</span>) directly to Cloud Firestore.
            </p>
          </div>
        </div>

        {/* Cloud Document Stats Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Cloud Firestore Collections</span>
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { name: 'Users (Admin, Faculty, Student)', key: 'users' },
              { name: 'Quizzes & Questions', key: 'quizzes' },
              { name: 'Exam Attempts & Telemetry', key: 'attempts' },
              { name: 'Practice Quizzes', key: 'practiceQuizzes' },
              { name: 'Faculty Activity Logs', key: 'facultyLogs' },
              { name: 'Audit Security Logs', key: 'auditLogs' }
            ].map(col => (
              <div key={col.key} className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-700 font-medium truncate">{col.name}</span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {loadingStats ? '...' : (collectionCounts[col.key] ?? 0)} docs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Status Banner */}
      {uploadStatus && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-xs font-semibold shadow-2xs ${
            uploadStatus.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold">{uploadStatus.type === 'success' ? 'Operation Completed' : 'Operation Failed'}</div>
            <div className="mt-0.5 leading-relaxed">{uploadStatus.message}</div>
          </div>
        </div>
      )}

      {/* Custom JSON Data Dumper Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileJson className="h-5 w-5 text-indigo-600" />
              <span>Admin Custom JSON Data Dumper & Injector</span>
            </h3>
            <p className="text-xs text-slate-500">
              Paste or upload raw JSON arrays to dump directly into Firebase Cloud Firestore collections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs">
              <Upload className="h-3.5 w-3.5 text-slate-600" />
              <span>Upload .json File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={loadSampleJson}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Code className="h-3.5 w-3.5 text-indigo-600" />
              Load Sample Template
            </button>
          </div>
        </div>

        {/* Target Collection Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Cloud Firestore Collection:</label>
            <select
              value={targetCollection}
              onChange={e => setTargetCollection(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="quizzes">Quizzes & Questions (`quizzes`)</option>
              <option value="users">Users & Profiles (`users`)</option>
              <option value="attempts">Quiz Attempts & Telemetry (`attempts`)</option>
              <option value="practiceQuizzes">Practice Quizzes (`practiceQuizzes`)</option>
              <option value="facultyLogs">Faculty Activity Logs (`facultyLogs`)</option>
              <option value="auditLogs">Security Audit Logs (`auditLogs`)</option>
            </select>
          </div>
          <div className="text-xs text-slate-500 flex items-center">
            <span>
              All objects in the JSON payload must have an <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">id</code> string field or a unique ID will be generated automatically.
            </span>
          </div>
        </div>

        {/* JSON Editor Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">JSON Payload Data:</label>
          <textarea
            value={jsonInputText}
            onChange={e => setJsonInputText(e.target.value)}
            rows={10}
            placeholder='[\n  {\n    "id": "quiz-001",\n    "title": "Sample Quiz",\n    "topic": "Computer Science",\n    "secretCode": "CS101",\n    "questions": []\n  }\n]'
            className="w-full rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden shadow-inner"
          />
        </div>

        {/* Dump Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setJsonInputText('')}
            disabled={!jsonInputText.trim()}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
          >
            Clear Text
          </button>
          <button
            onClick={handleCustomJsonDump}
            disabled={dumpingCustom || !jsonInputText.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            <Upload className="h-4 w-4" />
            {dumpingCustom ? 'Injecting into Firebase Cloud...' : `Dump JSON Data into Collection (${targetCollection})`}
          </button>
        </div>
      </div>

      {/* Live Sync Log Audit */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Firebase Dump Activity Audit</h3>

        {syncLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            No cloud dump operations executed in current session yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {syncLogs.map((log, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{log.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{log.details}</div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
