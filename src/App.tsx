import React, { useState, useRef } from 'react';
import { 
  Code2, 
  Search, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Loader2, 
  Copy, 
  RefreshCw,
  Terminal,
  FileCode,
  Sparkles,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeCode, type CodeAnalysisResult } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { name: 'TypeScript', value: 'typescript' },
  { name: 'JavaScript', value: 'javascript' },
  { name: 'Python', value: 'python' },
  { name: 'Go', value: 'go' },
  { name: 'Rust', value: 'rust' },
  { name: 'Java', value: 'java' },
  { name: 'C++', value: 'cpp' },
];

export default function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CodeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'refactored'>('insights');
  const [history, setHistory] = useState<{id: string, name: string, date: string, result: CodeAnalysisResult, code: string, lang: string}[]>(() => {
    const saved = localStorage.getItem('codeinsight_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const saveToHistory = (analysis: CodeAnalysisResult, sourceCode: string, lang: string) => {
    const newEntry = {
      id: Date.now().toString(),
      name: analysis.summary.slice(0, 30) + '...',
      date: new Date().toLocaleString(),
      result: analysis,
      code: sourceCode,
      lang: lang
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('codeinsight_history', JSON.stringify(updatedHistory));
  };

  const loadFromHistory = (entry: typeof history[0]) => {
    setResult(entry.result);
    setCode(entry.code);
    setLanguage(entry.lang);
    setShowHistory(false);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeCode(code, language);
      setResult(analysis);
      saveToHistory(analysis, code, language);
      setActiveTab('insights');
    } catch (err) {
      setError('Analysis failed. Please check your code and try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CodeInsight AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              <RefreshCw className={cn("w-4 h-4", showHistory && "rotate-180")} />
              History
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <button className="text-slate-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded border border-indigo-400/20">
              v1.0.0-beta
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-[#0D0D0E] border-r border-white/10 z-40 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white">Recent Analyses</h3>
                <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-600 italic">No history yet.</p>
                ) : (
                  history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 transition-all group"
                    >
                      <p className="text-xs font-medium text-slate-300 truncate group-hover:text-indigo-400">{entry.name}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{entry.date}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Column: Editor */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Source Code</h2>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-h-[400px] lg:min-h-0 group">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here for deep analysis..."
              className="w-full h-full bg-[#0D0D0E] border border-white/10 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600 code-editor-glow"
            />
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setCode('')}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                title="Clear"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className={cn(
              "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
              isAnalyzing 
                ? "bg-indigo-600/50 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-600/20"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run Deep Analysis
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Analysis Results</h2>
          </div>

          <div className="flex-1 glass-panel overflow-hidden flex flex-col min-h-[500px]">
            {!result && !isAnalyzing && !error && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <FileCode className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">No Analysis Yet</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-2">
                  Paste your code and click "Run Deep Analysis" to get AI-powered insights.
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-slate-300">Processing Code</h3>
                  <p className="text-sm text-slate-500 animate-pulse">Consulting Gemini 3.1 Pro...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-300">Analysis Error</h3>
                <p className="text-sm text-red-400/80 mt-2">{error}</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full"
              >
                {/* Score Header */}
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Code Health</h3>
                      <p className="text-sm text-slate-400 mt-1">{result.summary}</p>
                    </div>
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          className="stroke-white/10"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={cn(
                            "transition-all duration-1000 ease-out",
                            result.score > 80 ? "stroke-emerald-500" : result.score > 50 ? "stroke-amber-500" : "stroke-red-500"
                          )}
                          strokeWidth="3"
                          strokeDasharray={`${result.score}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{result.score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('insights')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                        activeTab === 'insights' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      Insights ({result.insights.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('refactored')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                        activeTab === 'refactored' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      Refactored Code
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'insights' ? (
                      <motion.div 
                        key="insights"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {result.insights.map((insight, idx) => (
                          <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors group">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg shrink-0",
                                insight.category === 'security' ? "bg-red-500/10 text-red-500" :
                                insight.category === 'performance' ? "bg-amber-500/10 text-amber-500" :
                                insight.category === 'quality' ? "bg-blue-500/10 text-blue-500" :
                                "bg-purple-500/10 text-purple-500"
                              )}>
                                {insight.category === 'security' ? <ShieldAlert className="w-4 h-4" /> :
                                 insight.category === 'performance' ? <Zap className="w-4 h-4" /> :
                                 insight.category === 'quality' ? <CheckCircle2 className="w-4 h-4" /> :
                                 <ChevronRight className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-sm text-white">{insight.title}</h4>
                                  <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                                    insight.severity === 'critical' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                    insight.severity === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                    insight.severity === 'medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                  )}>
                                    {insight.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3">{insight.description}</p>
                                <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Suggestion</span>
                                  </div>
                                  <p className="text-xs text-slate-300 italic">"{insight.suggestion}"</p>
                                </div>
                                {insight.codeSnippet && (
                                  <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                    <SyntaxHighlighter 
                                      language={language} 
                                      style={vscDarkPlus}
                                      customStyle={{ margin: 0, fontSize: '11px', background: '#050505' }}
                                    >
                                      {insight.codeSnippet}
                                    </SyntaxHighlighter>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="refactored"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="h-full flex flex-col"
                      >
                        {result.refactoredCode ? (
                          <div className="relative group flex-1">
                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => copyToClipboard(result.refactoredCode!)}
                                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg transition-all active:scale-95"
                                title="Copy Code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-white/10 h-full">
                              <SyntaxHighlighter 
                                language={language} 
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '20px', height: '100%', background: '#0D0D0E' }}
                              >
                                {result.refactoredCode}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
                            <p className="text-slate-500">No refactored version provided for this snippet.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Powered by <span className="text-indigo-400 font-semibold">Gemini 3.1 Pro</span>. 
            Analyzes code for security, performance, and best practices.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
