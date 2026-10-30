import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpen,
  Code2,
  Cpu,
  ThumbsUp,
  MessageCircle,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Send,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StudentUser, StudentCareGuide, StudentCareRequest } from '../types';
import { api } from '../services/api';

interface StudentCareHelpdeskProps {
  currentUser: StudentUser | null;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  showToast: (msg: string) => void;
}

export const StudentCareHelpdesk: React.FC<StudentCareHelpdeskProps> = ({
  currentUser,
  onOpenAuth,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'requests'>('guides');
  const [guides, setGuides] = useState<StudentCareGuide[]>([]);
  const [requests, setRequests] = useState<StudentCareRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable Code & Details
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // New Guide Modal State
  const [isNewGuideOpen, setIsNewGuideOpen] = useState(false);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideCategory, setGuideCategory] = useState<StudentCareGuide['category']>('pin_connections');
  const [guideComponent, setGuideComponent] = useState('');
  const [guideSummary, setGuideSummary] = useState('');
  const [guidePinout, setGuidePinout] = useState('');
  const [guideTips, setGuideTips] = useState('');
  const [guideCode, setGuideCode] = useState('');
  const [submittingGuide, setSubmittingGuide] = useState(false);

  // New Request Modal State
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqComponent, setReqComponent] = useState('');
  const [reqUrgency, setReqUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [reqLabName, setReqLabName] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Replying to a Request
  const [activeReplyingRequestId, setActiveReplyingRequestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyCode, setReplyCode] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchGuides = async () => {
    try {
      const res = await api.getStudentCareGuides();
      if (res.guides) setGuides(res.guides);
    } catch (e) {
      console.log('Error loading guides:', e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.getStudentCareRequests();
      if (res.requests) setRequests(res.requests);
    } catch (e) {
      console.log('Error loading care requests:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGuides(), fetchRequests()]).finally(() => setLoading(false));
  }, []);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    showToast('Code snippet copied to clipboard!');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleUpvote = async (guideId: string) => {
    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }
    try {
      const res = await api.upvoteStudentCareGuide(guideId);
      setGuides((prev) => prev.map((g) => (g.id === guideId ? res.guide : g)));
      showToast('Thank you for upvoting this senior guide!');
    } catch (err: any) {
      showToast(err.message || 'Could not register upvote.');
    }
  };

  const handleSubmitGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }
    if (!guideTitle.trim() || !guideComponent.trim() || !guideSummary.trim()) {
      showToast('Please fill in the title, component name, and guide summary.');
      return;
    }

    setSubmittingGuide(true);
    try {
      const tipsArray = guideTips
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await api.createStudentCareGuide({
        title: guideTitle.trim(),
        category: guideCategory,
        componentOrKit: guideComponent.trim(),
        summary: guideSummary.trim(),
        pinoutNotes: guidePinout.trim() || undefined,
        troubleshootingTips: tipsArray.length > 0 ? tipsArray : ['Double check power voltages before flashing.'],
        sampleCode: guideCode.trim() || undefined,
      });

      setGuides((prev) => [res.guide, ...prev]);
      setIsNewGuideOpen(false);
      setGuideTitle('');
      setGuideComponent('');
      setGuideSummary('');
      setGuidePinout('');
      setGuideTips('');
      setGuideCode('');
      showToast('Your senior guide was published! Thank you for supporting junior students.');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit guide.');
    } finally {
      setSubmittingGuide(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }
    if (!reqTitle.trim() || !reqComponent.trim()) {
      showToast('Please describe your question and component.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await api.createStudentCareRequest({
        title: reqTitle.trim(),
        componentNeededOrIssue: reqComponent.trim(),
        urgency: reqUrgency,
        labName: reqLabName.trim() || undefined,
      });

      setRequests((prev) => [res.request, ...prev]);
      setIsNewRequestOpen(false);
      setReqTitle('');
      setReqComponent('');
      setReqLabName('');
      showToast('Help request posted! Senior students will share guidance shortly.');
    } catch (err: any) {
      showToast(err.message || 'Failed to post request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSubmitReply = async (requestId: string) => {
    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }
    if (!replyText.trim()) {
      showToast('Please enter your troubleshooting answer or guidance.');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await api.answerStudentCareRequest(requestId, {
        answerText: replyText.trim(),
        sampleCodeSnippet: replyCode.trim() || undefined,
      });

      setRequests((prev) => prev.map((r) => (r.id === requestId ? res.request : r)));
      setActiveReplyingRequestId(null);
      setReplyText('');
      setReplyCode('');
      showToast('Your answer was shared with the student!');
    } catch (err: any) {
      showToast(err.message || 'Failed to post answer.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Filter guides
  const filteredGuides = guides.filter((g) => {
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.componentOrKit.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <section id="student-care" className="py-12 sm:py-16 bg-slate-900/60 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-xs font-semibold text-emerald-300 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sri Vasavi Peer Mentorship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Student Care <span className="text-emerald-400">Helpdesk</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Senior-verified pinout guides, common lab hardware bug fixes, troubleshooting walk-throughs, and sample code for college practicals.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('signin');
                else setIsNewRequestOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Ask Senior Students</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('signin');
                else setIsNewGuideOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Share Senior Guide</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'guides'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Senior Setup Guides & Pinouts ({guides.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hardware Q&A Board ({requests.length})</span>
            </button>
          </div>

          {activeTab === 'guides' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-emerald-400"
              >
                <option value="all">All Guide Topics</option>
                <option value="pin_connections">Pin Connections & Wiring</option>
                <option value="troubleshooting">Troubleshooting & Bug Fixes</option>
                <option value="sample_code">Tested Sample Code</option>
                <option value="kit_setup">Project Kits Setup</option>
              </select>
            </div>
          )}
        </div>

        {/* GUIDES TAB CONTENT */}
        {activeTab === 'guides' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                      {guide.category === 'pin_connections' && '⚡ Pin Connections'}
                      {guide.category === 'troubleshooting' && '🛠️ Troubleshooting'}
                      {guide.category === 'sample_code' && '💻 Sample Code'}
                      {guide.category === 'kit_setup' && '📦 Kit Setup'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500">
                      {guide.createdAt ? new Date(guide.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug">
                    {guide.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="font-semibold text-emerald-400">{guide.componentOrKit}</span>
                    <span>•</span>
                    <span>By {guide.authorName} ({guide.authorYear} - {guide.authorBranch.split('(')[1]?.replace(')', '') || guide.authorBranch})</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                    {guide.summary}
                  </p>

                  {/* Pinout Notes */}
                  {guide.pinoutNotes && (
                    <div className="mb-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                      <span className="font-bold text-amber-400 block mb-1">🔌 Recommended Pin Connections:</span>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                        {guide.pinoutNotes}
                      </p>
                    </div>
                  )}

                  {/* Troubleshooting Tips */}
                  {guide.troubleshootingTips && guide.troubleshootingTips.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      <span className="font-bold text-xs text-slate-300 block">💡 Senior Troubleshooting Tips:</span>
                      {guide.troubleshootingTips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Sample Code */}
                  {guide.sampleCode && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedCodeId(expandedCodeId === guide.id ? null : guide.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                          <Code2 className="w-3.5 h-3.5" />
                          Tested Sample Code
                        </span>
                        {expandedCodeId === guide.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {expandedCodeId === guide.id && (
                        <div className="mt-2 relative rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto">
                          <button
                            onClick={() => handleCopyCode(guide.id, guide.sampleCode!)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCodeId === guide.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <pre className="pr-12 whitespace-pre leading-relaxed">{guide.sampleCode}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Zone */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Sri Vasavi Verified</span>
                  <button
                    onClick={() => handleUpvote(guide.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Helpful ({guide.upvotes || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HARDWARE Q&A REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base sm:text-lg">{req.title}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        req.urgency === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : req.urgency === 'medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.urgency} urgency
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {req.status === 'resolved' ? '✅ Resolved' : `${req.answers?.length || 0} Answers`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <span className="font-semibold text-sky-400">{req.componentNeededOrIssue}</span>
                  <span>•</span>
                  <span>{req.studentName} ({req.studentYear} - {req.studentBranch})</span>
                  {req.labName && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">Lab: {req.labName}</span>
                    </>
                  )}
                </div>

                {/* Answers List */}
                {req.answers && req.answers.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-emerald-500/40 space-y-3 my-3">
                    {req.answers.map((ans) => (
                      <div key={ans.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span className="font-bold text-emerald-400">
                            {ans.responderName} ({ans.responderYear})
                          </span>
                          <span>{new Date(ans.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{ans.answerText}</p>
                        {ans.sampleCodeSnippet && (
                          <pre className="mt-2 p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                            {ans.sampleCodeSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer CTA */}
                {activeReplyingRequestId === req.id ? (
                  <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-white block">Share Guidance or Solution:</span>
                    <textarea
                      rows={2}
                      placeholder="Explain pin fix, voltage requirement, or troubleshooting step..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="Optional working Arduino / Python snippet..."
                      value={replyCode}
                      onChange={(e) => setReplyCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveReplyingRequestId(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReply(req.id)}
                        disabled={submittingReply}
                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg"
                      >
                        {submittingReply ? 'Posting...' : 'Post Answer'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        if (!currentUser) onOpenAuth('signin');
                        else setActiveReplyingRequestId(req.id);
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply to this student</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL: CREATE SENIOR GUIDE */}
        {isNewGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  Publish Senior Hardware Guide
                </h3>
                <button onClick={() => setIsNewGuideOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitGuide} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Guide Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ESP32 I2C 1602 LCD 0x27 vs 0x3F Address Conflict & Fix"
                    value={guideTitle}
                    onChange={(e) => setGuideTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Topic Category</label>
                    <select
                      value={guideCategory}
                      onChange={(e) => setGuideCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    >
                      <option value="pin_connections">Pin Connections</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="sample_code">Sample Code</option>
                      <option value="kit_setup">Project Kit Setup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Component / Kit Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DHT11 / ESP32"
                      value={guideComponent}
                      onChange={(e) => setGuideComponent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Summary & Context</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief explanation of why this component fails in lab sessions and what junior students need to check..."
                    value={guideSummary}
                    onChange={(e) => setGuideSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Pinout Connection Details (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. VCC -> 5V, GND -> Common GND, SDA -> Pin A4, SCL -> Pin A5..."
                    value={guidePinout}
                    onChange={(e) => setGuidePinout(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Troubleshooting Checklist (One per line)</label>
                  <textarea
                    rows={2}
                    placeholder="Check baud rate is 115200&#10;Install CH340 USB driver&#10;Add 100nF decoupling capacitor across VCC"
                    value={guideTips}
                    onChange={(e) => setGuideTips(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Tested Sample Code Snippet (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="#include <Wire.h> ... void setup() { ... }"
                    value={guideCode}
                    onChange={(e) => setGuideCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-300 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewGuideOpen(false)}
                    className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGuide}
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl"
                  >
                    {submittingGuide ? 'Publishing...' : 'Publish Guide'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: POST HELP REQUEST */}
        {isNewRequestOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  Ask Senior Students for Guidance
                </h3>
                <button onClick={() => setIsNewRequestOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">What issue are you facing?</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ESP32 boot loop error when flashing with DHT11"
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Component / Module Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ESP32 NodeMCU + DHT11"
                    value={reqComponent}
                    onChange={(e) => setReqComponent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Urgency</label>
                    <select
                      value={reqUrgency}
                      onChange={(e) => setReqUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    >
                      <option value="low">Low (Semester prep)</option>
                      <option value="medium">Medium (Lab exam this week)</option>
                      <option value="high">High (Urgent lab viva)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">College Lab (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Block B IoT Lab"
                      value={reqLabName}
                      onChange={(e) => setReqLabName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRequestOpen(false)}
                    className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl"
                  >
                    {submittingRequest ? 'Posting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
