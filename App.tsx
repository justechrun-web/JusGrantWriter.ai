
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Radar, 
  FileText, 
  History, 
  Users, 
  ShieldCheck, 
  Zap, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronRight, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  Download,
  CheckCircle2,
  Building2,
  TrendingUp,
  BrainCircuit,
  Loader2,
  Clock,
  Briefcase,
  RefreshCw,
  X,
  Send,
  Phone,
  Lock,
  Activity,
  LineChart,
  Target,
  FileSearch,
  Crown,
  Rocket,
  Layers,
  Sparkles,
  Trello,
  FileCheck,
  Award,
  BookOpen,
  Info,
  DollarSign
} from 'lucide-react';
import { Opportunity, BidStage, UserProfile, AppState, Notification, Journey, Task, TaskStatus } from './types';
import { geminiService } from './services/geminiService';

// Add missing naics property to the initial user profile
const INITIAL_USER: UserProfile = {
  name: "John Doe",
  email: "john@example.com",
  companyName: "",
  credits: 5,
  isTrial: true,
  trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  samGovStatus: 'unregistered',
  subscription: 'free',
  readinessScore: 0,
  capabilities: [],
  naics: "",
  stageReadiness: {
    [BidStage.STAGE_0]: false,
    [BidStage.STAGE_1]: false,
    [BidStage.STAGE_2]: false,
    [BidStage.STAGE_3]: false,
  }
};

const DEMO_OPPORTUNITIES: Opportunity[] = [
  { id: 'demo-1', source: 'sam.gov', noticeId: 'N001', title: 'IT Helpdesk Services (Market Research)', agency: 'DHS', dueDate: '2025-05-01', description: 'Sources Sought for IT helpdesk support. Seeking small business capabilities.', bidStage: BidStage.STAGE_0, estimatedAward: 500000 },
  { id: 'demo-2', source: 'sam.gov', noticeId: 'N002', title: 'Cyber Resilience Framework (Pre-Solicitation)', agency: 'GSA', dueDate: '2025-06-15', description: 'GSA plans to solicit for a new cyber resilience framework. Draft RFP coming soon.', bidStage: BidStage.STAGE_1, estimatedAward: 2500000 },
  { id: 'demo-3', source: 'sam.gov', noticeId: 'N003', title: 'Facilities Maintenance (Solicitation)', agency: 'VA', dueDate: '2025-04-10', description: 'Active RFP for full-service facilities maintenance at VA hospitals in Florida.', bidStage: BidStage.STAGE_2, estimatedAward: 1200000 },
];

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'opportunity', title: 'New Match: Cloud Services', message: 'A new solicitation matching "Cloud Computing" was posted by GSA.', timestamp: new Date().toISOString(), read: false },
  { id: '2', type: 'award', title: 'Award Update', message: 'Historical data for HVAC Maintenance in Texas is now available.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
];

// --- Sub-components ---

const LandingView = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden text-white p-6">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />
    <div className="relative z-10 text-center space-y-8 max-w-4xl">
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-600/40 animate-pulse"><Zap className="w-12 h-12" /></div>
        <h1 className="text-7xl font-black tracking-tighter italic leading-none">JusGrantWriter<span className="text-indigo-500">.ai</span></h1>
      </div>
      <p className="text-3xl font-medium text-slate-400 tracking-tight leading-relaxed">
        The ultimate <span className="text-white font-black">Federal Pursuit Cockpit</span>. <br />
        Automate discovery, decoding, and winning narratives.
      </p>
      <div className="pt-8">
        <button 
          onClick={onStart}
          className="px-12 py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl shadow-3xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group mx-auto"
        >
          Initialize Cockpit <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
      <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { t: "Signal Sync", d: "Live monitoring of SAM.gov for high-intent leads.", i: Radar },
          { t: "Expert Autopilot", d: "Systematic breakdown of Section L/M requirements.", i: BrainCircuit },
          { t: "Narrative Studio", d: "Active-voice technical proposals without AI fluff.", i: Sparkles },
        ].map((f, i) => (
          <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-sm">
            <f.i className="w-8 h-8 text-indigo-400 mb-6" />
            <h3 className="text-xl font-black mb-2">{f.t}</h3>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TaskBoard = ({ tasks, onUpdateStatus }: { tasks: Task[], onUpdateStatus: (id: string, status: TaskStatus) => void }) => {
  const columns: { id: TaskStatus, label: string }[] = [
    { id: 'to-do', label: 'Backlog' },
    { id: 'in-progress', label: 'Active Signal' },
    { id: 'done', label: 'Verified' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(col => (
        <div key={col.id} className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{col.label}</h5>
            <div className="text-[10px] font-black text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === col.id).length}</div>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div key={task.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${task.priority === 'high' ? 'bg-red-50 text-red-600' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</span>
                  <div className="text-[8px] font-bold text-slate-300">{task.deadline}</div>
                </div>
                <h6 className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h6>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   {col.id !== 'to-do' && <button onClick={() => onUpdateStatus(task.id, 'to-do')} className="p-1.5 hover:bg-slate-50 rounded-lg"><ArrowLeft className="w-3 h-3" /></button>}
                   {col.id !== 'done' && <button onClick={() => onUpdateStatus(task.id, col.id === 'to-do' ? 'in-progress' : 'done')} className="ml-auto p-1.5 hover:bg-slate-50 rounded-lg"><ArrowRight className="w-3 h-3" /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProposalEditor = ({ content, onSave }: { content: string, onSave: (val: string) => void }) => {
  const [val, setVal] = useState(content);
  return (
    <div className="bg-white rounded-[48px] border border-slate-100 shadow-3xl overflow-hidden flex flex-col h-[700px]">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><FileText className="w-5 h-5" /></div>
          <div>
            <h4 className="text-xl font-black">AI Narrative Studio</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expert Context & Active Voice Mode</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50"><Sparkles className="w-4 h-4 text-indigo-600" /> Optimize Section</button>
          <button onClick={() => onSave(val)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Save Artifact</button>
        </div>
      </div>
      <textarea 
        className="flex-1 p-12 outline-none font-medium text-slate-700 leading-relaxed resize-none text-lg selection:bg-indigo-100"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Drafting compliance-verified sections with active voice guidelines..."
      />
    </div>
  );
};

// --- Journey Hub Component Implementation ---
const JourneyHub = ({ activeJourney, activeOpp, tasks, onUpdateStatus }: { 
  activeJourney: Journey | undefined, 
  activeOpp: Opportunity | undefined,
  tasks: Task[],
  onUpdateStatus: (id: string, status: TaskStatus) => void
}) => {
  if (!activeJourney || !activeOpp) {
    return (
      <div className="p-16 text-center h-full flex flex-col items-center justify-center">
        <Rocket className="w-24 h-24 mx-auto mb-8 text-slate-200" />
        <h3 className="text-4xl font-black text-slate-900">No Active Journey</h3>
        <p className="text-slate-400">Select an opportunity from the Signal Stream to engage autopilot.</p>
      </div>
    );
  }

  const journeyTasks = tasks.filter(t => t.journeyId === activeJourney.id);

  return (
    <div className="p-16 space-y-16 animate-in fade-in duration-500 overflow-y-auto h-full">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-indigo-600">
          <Rocket className="w-4 h-4" /> Pursuit Mission Control
        </div>
        <h3 className="text-6xl font-black tracking-tighter text-slate-900 leading-tight">{activeOpp.title}</h3>
        <p className="text-slate-400 font-medium italic text-xl">{activeOpp.agency} — Mission Status: {activeJourney.status.replace('_', ' ')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-10 rounded-[64px] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-2xl font-black flex items-center gap-3"><Trello className="w-6 h-6 text-indigo-600" /> Mission Board</h4>
            <TaskBoard tasks={journeyTasks} onUpdateStatus={onUpdateStatus} />
          </div>

          <div className="space-y-8">
             <h4 className="text-2xl font-black flex items-center gap-3"><Sparkles className="w-6 h-6 text-indigo-600" /> Narrative Studio</h4>
             <ProposalEditor content="" onSave={(val) => console.log("Saved artifact:", val)} />
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[64px] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-2xl font-black flex items-center gap-3"><FileSearch className="w-6 h-6 text-indigo-600" /> Expert Breakdown</h4>
            {activeOpp.analysis ? (
              <div className="space-y-6">
                {[
                  { label: "Summary", text: activeOpp.analysis.summary },
                  { label: "Eligibility", text: activeOpp.analysis.eligibility },
                  { label: "Deliverables", text: activeOpp.analysis.deliverables },
                  { label: "Instructions", text: activeOpp.analysis.instructions },
                  { label: "Compliance", text: activeOpp.analysis.compliance },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Initializing analysis engine...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'onboarding' | 'dashboard' | 'search' | 'intelligence' | 'journey_hub' | 'team' | 'notifications' | 'training_hub'>('landing');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hi! I'm your JusGrantWriter.ai guide. I can help with software questions or government contracting advice. How can I help you today?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('jusgrantwriter_v7_final');
    if (saved) return JSON.parse(saved);
    return {
      user: INITIAL_USER,
      opportunities: DEMO_OPPORTUNITIES,
      packets: [],
      historicalAwards: [],
      journeys: [],
      tasks: [],
      logs: [],
      autoSearchTerms: ['Cloud Computing', 'HVAC Maintenance', 'Cyber Security'],
      notifications: DEMO_NOTIFICATIONS
    };
  });

  useEffect(() => {
    localStorage.setItem('jusgrantwriter_v7_final', JSON.stringify(state));
  }, [state]);

  const addLog = (msg: string) => {
    setState(s => ({
      ...s,
      logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...s.logs.slice(0, 9)]
    }));
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const response = await geminiService.askChatbot(userMsg);
      setChatHistory(prev => [...prev, { role: 'bot', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting right now. Please try again later." }]);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setView('onboarding');
    addLog("Session established. Initializing onboarding flow...");
  };

  const handleSearch = async () => {
    setIsProcessing(true);
    addLog("Scout Agent: Syncing with SAM.gov and Grants.gov...");
    try {
      const results = await geminiService.scoutOpportunities({ 
        naics: state.user.naics, 
        terms: state.autoSearchTerms 
      });
      if (results && results.length > 0) {
        setState(s => ({ ...s, opportunities: results }));
        addLog(`Scout Agent: Synchronized ${results.length} active signals.`);
      } else {
        addLog("Scout Agent: No new signals found in this sector.");
      }
    } catch (error) {
      console.error(error);
      addLog("Scout Agent Error: Signal sync failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSbirAutopilot = async (oppId: string) => {
    setIsProcessing(true);
    addLog(`Autopilot: Initializing expert journey for opp ${oppId}...`);
    
    const opp = state.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const analysis = await geminiService.analyzeSolicitation(opp);

    const journeyId = `j-${Date.now()}`;
    const newJourney: Journey = {
      id: journeyId,
      companyId: 'current-user',
      opportunityId: oppId,
      status: 'in_progress',
      createdAt: new Date().toISOString()
    };

    const initialTasks: Task[] = [
      { id: `t1-${Date.now()}`, journeyId, title: "Expert Breakdown: Review Requirements", priority: 'high', deadline: '24h', status: 'in-progress' },
      { id: `t2-${Date.now()}`, journeyId, title: "Narrative Studio: Active-Voice Technical Section", priority: 'high', deadline: '48h', status: 'to-do' },
      { id: `t3-${Date.now()}`, journeyId, title: "Compliance Check: Instructions & Deliverables", priority: 'high', deadline: '72h', status: 'to-do' },
    ];

    setState(s => ({
      ...s,
      opportunities: s.opportunities.map(o => o.id === oppId ? { ...o, analysis } : o),
      journeys: [newJourney, ...s.journeys],
      tasks: [...s.tasks, ...initialTasks],
      activeJourneyId: journeyId
    }));
    
    setIsProcessing(false);
    setView('journey_hub');
    addLog("Autopilot: Expert analysis complete. Narrative Studio pre-populated.");
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));
  };

  const activeJourney = useMemo(() => 
    state.journeys.find(j => j.id === state.activeJourneyId),
  [state.journeys, state.activeJourneyId]);

  const activeOpp = useMemo(() => 
    state.opportunities.find(o => o.id === (activeJourney?.opportunityId || state.activeOpportunityId)),
  [state.opportunities, activeJourney, state.activeOpportunityId]);

  // --- Onboarding Logic ---

  const generateCapabilityStatement = async () => {
    setIsProcessing(true);
    addLog("AI Narrative Studio: Synthesizing company profile into core Capability Statement...");
    
    // Use Gemini to "write" a summary (simulated)
    const prompt = `Write a 2-sentence formal federal capability summary for a company named ${state.user.companyName} focusing on NAICS ${state.user.naics}.`;
    
    try {
      // Small delay for effect
      await new Promise(r => setTimeout(r, 2000));
      
      setState(s => ({
        ...s,
        user: { 
          ...s.user, 
          readinessScore: s.user.readinessScore + 25,
          capabilityPDF: `https://storage.jusgrantwriter.ai/pdf/capability_${Date.now()}.pdf`
        }
      }));
      setIsProcessing(false);
      addLog("Success: Capability Statement PDF generated and stored in artifacts.");
      setOnboardingStep(4);
    } catch (err) {
      addLog("Error during artifact generation.");
      setIsProcessing(false);
    }
  };

  const OnboardingView = () => {
    const steps = [
      { title: "Identity", icon: Building2 },
      { title: "Stage Awareness", icon: Layers },
      { title: "Readiness Audit", icon: Target },
      { title: "AI Artifacts", icon: Sparkles },
    ];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-12 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-12">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${onboardingStep >= i ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${onboardingStep >= i ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-100 p-16 rounded-[64px] shadow-3xl space-y-12 animate-in slide-in-from-bottom duration-500">
            
            {onboardingStep === 0 && (
              <div className="space-y-10">
                <div className="space-y-2 text-center">
                  <h3 className="text-5xl font-black tracking-tighter">Business Identity</h3>
                  <p className="text-slate-400 font-medium text-xl">Establish your federal footprint.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Legal Entity Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Systems Unlimited LLC" 
                      className="w-full p-6 bg-slate-50 border rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={state.user.companyName}
                      onChange={(e) => setState(s => ({ ...s, user: { ...s.user, companyName: e.target.value }}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Primary NAICS Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 541511" 
                      className="w-full p-6 bg-slate-50 border rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                      value={state.user.naics}
                      onChange={(e) => setState(s => ({ ...s, user: { ...s.user, naics: e.target.value }}))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Business Certification Type</label>
                    <select className="w-full p-6 bg-slate-50 border rounded-3xl font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 appearance-none">
                      <option>S-Corp / LLC (For Profit)</option>
                      <option>Woman Owned Small Business (WOSB)</option>
                      <option>Service-Disabled Veteran-Owned (SDVOSB)</option>
                      <option>8(a) Business Development Program</option>
                      <option>HUBZone Certified</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => {
                  if(!state.user.companyName || !state.user.naics) {
                    addLog("Warning: Complete identity fields to continue.");
                    return;
                  }
                  setOnboardingStep(1);
                }} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3">
                  Sync Business Profile <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="space-y-10">
                <div className="space-y-2 text-center">
                  <h3 className="text-5xl font-black tracking-tighter">The Pursuit Pipeline</h3>
                  <p className="text-slate-400 font-medium text-xl">Contracts evolve through 4 mission-critical stages.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { title: "Sources Sought", desc: "Market research stage. No RFP yet. Prime time to influence scope and set-asides.", icon: Search, color: "text-blue-600 bg-blue-50" },
                    { title: "Pre-Solicitation", desc: "Draft RFPs issued. Agency testing waters. Teaming agreements begin.", icon: Layers, color: "text-purple-600 bg-purple-50" },
                    { title: "Solicitation", desc: "Active RFP. The clock is ticking. Run AI Narrative Autopilot now.", icon: Rocket, color: "text-indigo-600 bg-indigo-50" },
                    { title: "Award", desc: "Contract won. Post-award tracking and historical archive access.", icon: Award, color: "text-green-600 bg-green-50" },
                  ].map((s, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-[40px] border border-transparent hover:border-indigo-200 hover:bg-white transition-all group">
                      <div className={`p-4 rounded-2xl w-fit mb-6 shadow-sm ${s.color}`}><s.icon className="w-6 h-6" /></div>
                      <h4 className="text-2xl font-black mb-2">{s.title}</h4>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">I Understand. Next Step.</button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-10">
                <div className="space-y-2 text-center">
                  <h3 className="text-5xl font-black tracking-tighter">Readiness Survey</h3>
                  <p className="text-slate-400 font-medium text-xl">Mark the stages you are prepared to bid in today.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { id: BidStage.STAGE_0, label: "I have a capabilities brief for Market Research (Stage 0)." },
                    { id: BidStage.STAGE_1, label: "I can identify suitable partners for teaming (Stage 1)." },
                    { id: BidStage.STAGE_2, label: "I have the bandwidth to respond to active RFPs (Stage 2)." },
                    { id: BidStage.STAGE_3, label: "I have past performance examples (Sub or Prime) (Stage 3)." },
                  ].map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => setState(st => {
                        const isCurrentlyReady = st.user.stageReadiness[s.id];
                        return {
                          ...st,
                          user: {
                            ...st.user,
                            stageReadiness: {
                              ...st.user.stageReadiness,
                              [s.id]: !isCurrentlyReady
                            },
                            readinessScore: isCurrentlyReady ? st.user.readinessScore - 15 : st.user.readinessScore + 15
                          }
                        };
                      })}
                      className={`w-full p-8 rounded-[40px] border-2 text-left flex items-center gap-6 transition-all ${state.user.stageReadiness[s.id] ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${state.user.stageReadiness[s.id] ? 'bg-white text-indigo-600 border-white' : 'border-slate-300'}`}>
                        {state.user.stageReadiness[s.id] && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <span className="text-lg font-bold">{s.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(3)} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Audit Complete</button>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-10 text-center">
                <div className="p-8 bg-indigo-50 rounded-full inline-block mb-4"><Sparkles className="w-16 h-16 text-indigo-600" /></div>
                <div className="space-y-4">
                  <h3 className="text-5xl font-black tracking-tighter">AI Artifact Lab</h3>
                  <p className="text-slate-400 font-medium text-xl">Let's generate your core Capability Statement PDF. Required for Stage 0 entry.</p>
                </div>
                <div className="p-12 bg-slate-50 rounded-[64px] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-4 text-left p-6 bg-white rounded-3xl shadow-sm">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white"><FileText className="w-6 h-6" /></div>
                    <div>
                      <div className="text-sm font-black">CapabilityStatement.pdf</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Ready for AI Narrative Synthesis...</div>
                    </div>
                  </div>
                </div>
                <button onClick={generateCapabilityStatement} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Launch AI Synthesis</button>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="space-y-12 text-center animate-in zoom-in duration-500">
                <div className="p-8 bg-green-50 rounded-full inline-block mb-4 animate-bounce"><Rocket className="w-16 h-16 text-green-600" /></div>
                <div className="space-y-4">
                  <h3 className="text-5xl font-black tracking-tighter">Onboarding Finalized</h3>
                  <p className="text-slate-400 font-medium text-xl">Initial readiness score: <span className="text-indigo-600 font-black">{state.user.readinessScore}%</span>. Tailored feed initialized.</p>
                </div>
                <div className="bg-indigo-600 p-12 rounded-[64px] text-white space-y-8 text-left relative overflow-hidden">
                  <Zap className="absolute top-0 right-0 w-64 h-64 opacity-10 -mr-16 -mt-16" />
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-3xl font-black">Road to 100% Checklist</h4>
                    <p className="text-indigo-100 text-sm font-medium">Follow these targets to unlock full autopilot bidding.</p>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {[
                      { l: "Download & Verify AI Capability Statement", d: true },
                      { l: "Complete UEI/CAGE code sync in Settings", d: false },
                      { l: "Execute first 'Sources Sought' Scout scan", d: false }
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-4 text-sm font-medium">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${c.d ? 'bg-white border-white text-indigo-600' : 'border-indigo-400'}`}>
                          {c.d && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        {c.l}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setView('dashboard'); addLog("Cockpit operational. Feed synchronized."); }} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all">Enter Dashboards</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    // Tailored Feed logic: Only show opportunities at stages the user is ready for
    const tailoredFeed = useMemo(() => {
      return state.opportunities.filter(opp => state.user.stageReadiness[opp.bidStage]);
    }, [state.opportunities, state.user.stageReadiness]);

    return (
      <div className="p-16 space-y-16 animate-in fade-in duration-500 overflow-y-auto">
        <header className="flex justify-between items-end">
          <div className="space-y-4">
            <h3 className="text-6xl font-black tracking-tighter text-slate-900">Cockpit</h3>
            <p className="text-slate-400 font-medium italic">Status: Fully Operational — Entity: {state.user.companyName}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setView('notifications')} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 relative transition-all">
               <Bell className="w-6 h-6" />
               {state.notifications.some(n => !n.read) && <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></div>}
            </button>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm"><Settings className="w-6 h-6 text-slate-400" /></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           <div className="bg-indigo-600 p-10 rounded-[64px] text-white shadow-2xl space-y-8 col-span-1 flex flex-col justify-between h-[340px] group transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="p-4 bg-white/20 rounded-3xl self-start group-hover:scale-110 transition-transform relative z-10"><Rocket className="w-8 h-8" /></div>
              <div className="relative z-10">
                 <div className="text-6xl font-black mb-2">{state.user.readinessScore}%</div>
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Readiness Score</div>
              </div>
              <div className="text-xs font-bold text-indigo-100 relative z-10">Compliance Base: Verified</div>
           </div>

           <div className="bg-white p-10 rounded-[64px] border border-slate-100 shadow-sm col-span-1 space-y-8 h-[340px] flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="p-4 bg-purple-50 rounded-3xl self-start text-purple-600"><Activity className="w-8 h-8" /></div>
              <div>
                 <div className="text-6xl font-black mb-2 text-slate-900">{state.journeys.length}</div>
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pursuits in Progress</div>
              </div>
              <div className="text-xs font-bold text-slate-400">Targeting Stages 0 & 1</div>
           </div>

           <div className="bg-white p-10 rounded-[64px] border border-slate-100 shadow-sm col-span-2 space-y-8 h-[340px] flex flex-col justify-between relative overflow-hidden group">
              <LineChart className="absolute bottom-0 right-0 w-64 h-64 text-slate-50 -mb-10 -mr-10 opacity-50 group-hover:scale-110 transition-transform" />
              <div className="p-4 bg-amber-50 rounded-3xl self-start text-amber-600"><Target className="w-8 h-8" /></div>
              <div className="relative z-10">
                 <div className="text-3xl font-black mb-2 text-slate-900">Discovery Pipeline</div>
                 <div className="flex gap-4 flex-wrap">
                    {[BidStage.STAGE_0, BidStage.STAGE_1, BidStage.STAGE_2, BidStage.STAGE_3].map((s, i) => (
                      <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${state.user.stageReadiness[s] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-300'}`}>
                        Stage {i}
                      </div>
                    ))}
                 </div>
              </div>
              <div className="text-xs font-bold text-slate-400 relative z-10">Monitoring NAICS {state.user.naics}</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              <div className="flex justify-between items-end">
                <h4 className="text-3xl font-black tracking-tighter text-slate-900">Tailored Signals</h4>
                <button onClick={() => setView('search')} className="text-sm font-bold text-indigo-600 flex items-center gap-2">Global Scout Agent <ArrowRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {tailoredFeed.length > 0 ? tailoredFeed.map(opp => (
                  <div key={opp.id} className="p-8 bg-white border border-slate-100 rounded-[48px] shadow-sm flex items-center justify-between hover:border-indigo-100 transition-all group">
                    <div className="flex items-center gap-8">
                      <div className={`p-5 rounded-3xl transition-all ${opp.bidStage === BidStage.STAGE_0 ? 'bg-blue-50 text-blue-600' : opp.bidStage === BidStage.STAGE_1 ? 'bg-purple-50 text-purple-600' : 'bg-indigo-600 text-white shadow-xl'}`}>
                        {opp.bidStage === BidStage.STAGE_0 ? <Search className="w-6 h-6" /> : opp.bidStage === BidStage.STAGE_1 ? <Layers className="w-6 h-6" /> : <Rocket className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{opp.agency}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400">Due {opp.dueDate}</span>
                        </div>
                        <h5 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{opp.title}</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <div className="text-xl font-black text-slate-900">${(opp.estimatedAward || 0).toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{opp.bidStage.replace('_', ' ')}</div>
                      </div>
                      <button onClick={() => handleSbirAutopilot(opp.id)} className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-indigo-600 transition-all shadow-lg"><Plus className="w-6 h-6" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 border-2 border-dashed border-slate-200 rounded-[48px] text-center space-y-6 bg-slate-50/50">
                    <Info className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-400 font-medium max-w-sm mx-auto">No tailored signals match your current readiness. Click "Global Scout Agent" to explore all active opportunities.</p>
                  </div>
                )}
              </div>
           </div>

           <div className="space-y-10">
              <div className="bg-white p-10 rounded-[64px] border border-slate-100 shadow-sm space-y-8 flex flex-col justify-between h-[340px] relative overflow-hidden">
                 <FileCheck className="absolute top-0 right-0 w-32 h-32 text-indigo-50 -mr-8 -mt-8" />
                 <div className="space-y-4 relative z-10">
                    <h4 className="text-2xl font-black text-slate-900">AI Artifacts</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-indigo-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <div className="text-sm font-bold text-slate-700">Capability Statement</div>
                        </div>
                        <a href={state.user.capabilityPDF} target="_blank" rel="noreferrer" className="p-2 hover:bg-white rounded-lg"><Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" /></a>
                      </div>
                      {state.user.capabilityPDF && (
                        <div className="p-4 bg-green-50 rounded-2xl flex items-center gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div className="text-sm font-bold text-green-800">Narrative Base Generated</div>
                        </div>
                      )}
                    </div>
                 </div>
                 <button onClick={() => setOnboardingStep(3)} className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl relative z-10">Refine Artifacts</button>
              </div>

              <div className="bg-slate-950 p-10 rounded-[64px] text-white space-y-8 shadow-3xl">
                 <h4 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Radar className="w-6 h-6 text-indigo-400" /> Auto-Scout
                 </h4>
                 <div className="space-y-4">
                    {state.autoSearchTerms.map((term, i) => (
                      <div key={i} className="p-5 bg-white/5 rounded-[32px] border border-white/5 flex items-center justify-between">
                         <span className="text-sm font-bold">{term}</span>
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    ))}
                 </div>
                 <button onClick={() => setView('search')} className="w-full py-5 bg-indigo-600 rounded-[32px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Update Signal Filters</button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <aside className="w-80 border-r bg-white flex flex-col p-8 gap-8 h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20"><Zap className="w-6 h-6" /></div>
        <h2 className="text-xl font-black tracking-tighter">JusGrantWriter</h2>
      </div>
      <nav className="flex-1 space-y-2">
        {[
          { id: 'dashboard', label: 'Cockpit', icon: LayoutDashboard },
          { id: 'search', label: 'Signal Stream', icon: Radar },
          { id: 'journey_hub', label: 'Journey Hub', icon: Rocket },
          { id: 'training_hub', label: 'Training Center', icon: BookOpen },
          { id: 'intelligence', label: 'Market Intel', icon: History },
          { id: 'team', label: 'Team Workspace', icon: Users },
          { id: 'notifications', label: 'Alerts', icon: Bell },
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id as any)} 
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <item.icon className="w-5 h-5" /> {item.label}
          </button>
        ))}
      </nav>
      <div className="pt-8 border-t space-y-6">
        <div className="p-6 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:rotate-12 transition-transform"><Crown className="w-8 h-8" /></div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Readiness Score</div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-black">{state.user.readinessScore}%</div>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
             <div className="h-full bg-white transition-all duration-1000" style={{ width: `${state.user.readinessScore}%` }} />
          </div>
        </div>
        <button onClick={() => setView('landing')} className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );

  const ChatWindow = () => (
    <div className={`fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col z-[100] transition-all transform ${showChat ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
      <div className="p-8 border-b flex justify-between items-center bg-indigo-600 rounded-t-[40px] text-white shadow-lg">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6" />
          <div className="font-black text-sm">Expert Guide AI</div>
        </div>
        <button onClick={() => setShowChat(false)} className="hover:rotate-90 transition-transform"><X /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-700'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-6 border-t bg-slate-50/50">
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Ask anything about the pursuit..." 
            className="w-full p-4 pr-14 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChat()}
          />
          <button onClick={handleChat} className="absolute right-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-jakarta">
      {view === 'landing' ? <LandingView onStart={() => setView('login')} /> : view === 'login' ? (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
          <form onSubmit={handleLogin} className="bg-white p-16 rounded-[64px] shadow-3xl max-w-lg w-full space-y-10 relative z-10 animate-in slide-in-from-top-10 duration-700">
            <div className="text-center space-y-2">
              <div className="p-4 bg-indigo-50 rounded-3xl inline-block mb-2"><Lock className="w-8 h-8 text-indigo-600" /></div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Access Cockpit</h2>
              <p className="text-slate-400 font-medium">Log in to manage your federal pursuits.</p>
            </div>
            <div className="space-y-4">
              <input type="email" placeholder="Email" required className="w-full p-6 bg-slate-50 border rounded-3xl font-bold outline-none focus:ring-4 focus:ring-indigo-600/10" defaultValue="contractor@prime.com" />
              <input type="password" placeholder="Password" required className="w-full p-6 bg-slate-50 border rounded-3xl font-bold outline-none focus:ring-4 focus:ring-indigo-600/10" defaultValue="password" />
            </div>
            <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all">Initialize Session</button>
          </form>
        </div>
      ) : (
        <>
          {view !== 'onboarding' && <Sidebar />}
          <main className="flex-1 overflow-y-auto relative bg-slate-50">
            {isProcessing && (
              <div className="fixed inset-0 z-[1000] bg-white/70 backdrop-blur-xl flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full animate-pulse" />
                  <Loader2 className="w-24 h-24 text-indigo-600 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-3xl font-black text-indigo-900 tracking-tighter">Synchronizing Signal Intelligence...</h4>
                   <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">JusGrantWriter.ai v7.0 (Expert Orchestration)</p>
                </div>
              </div>
            )}

            {view === 'onboarding' ? <OnboardingView /> : (
              <>
                {view === 'dashboard' && <Dashboard />}
                {view === 'search' && (
                  <div className="p-16 space-y-16 animate-in fade-in duration-500 overflow-y-auto">
                    <header className="flex justify-between items-end border-b pb-12">
                       <div className="space-y-4 max-w-2xl flex-1">
                          <h3 className="text-6xl font-black tracking-tighter text-slate-900">Signal Stream</h3>
                          <div className="relative group">
                            <Search className="absolute left-6 top-6 w-6 h-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                              type="text" 
                              placeholder="Search active solicitations or NAICS codes..." 
                              className="w-full p-6 pl-16 bg-white border border-slate-200 rounded-[32px] font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 shadow-sm"
                            />
                          </div>
                       </div>
                       <button onClick={handleSearch} className="px-12 py-6 bg-slate-950 text-white rounded-[32px] font-black text-xs flex items-center gap-4 hover:bg-slate-800 shadow-xl shadow-slate-950/20 active:scale-95 transition-all">
                         <RefreshCw className="w-5 h-5" /> Live Scout Agent
                       </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                       {state.opportunities.length > 0 ? state.opportunities.map(opp => (
                         <div key={opp.id} className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-2xl transition-all group">
                           <div className="space-y-8">
                             <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                   <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{opp.agency}</div>
                                   <h4 className="text-2xl font-black group-hover:text-indigo-600 transition-colors leading-tight">{opp.title}</h4>
                                </div>
                                <div className="text-3xl font-black tracking-tighter text-slate-900">${(opp.estimatedAward || 0).toLocaleString()}</div>
                             </div>
                             <p className="text-slate-500 font-medium line-clamp-3 leading-relaxed">"{opp.description}"</p>
                             <div className="flex gap-3">
                               <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${state.user.stageReadiness[opp.bidStage] ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                 Stage {Object.values(BidStage).indexOf(opp.bidStage)}: {opp.bidStage.replace('_', ' ')}
                               </span>
                               <span className="px-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">UEI Sync: OK</span>
                             </div>
                           </div>
                           <div className="flex gap-4 mt-12 pt-8 border-t">
                             <button onClick={() => handleSbirAutopilot(opp.id)} className="flex-1 py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xs shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Engage Pursuit Autopilot</button>
                             <button className="px-8 py-6 bg-white border border-slate-200 rounded-[32px] font-black text-xs hover:bg-slate-50 transition-all">Analysis Center</button>
                           </div>
                         </div>
                       )) : (
                         <div className="col-span-full py-32 text-center space-y-8 bg-white border rounded-[64px] border-dashed">
                            <Radar className="w-16 h-16 text-slate-200 mx-auto" />
                            <h4 className="text-3xl font-black text-slate-900">Signal Silence</h4>
                            <p className="text-slate-400 max-w-sm font-medium mx-auto">Update your criteria or click "Live Scout Agent" to fetch active contract signals.</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}
                {view === 'journey_hub' && (
                  <JourneyHub 
                    activeJourney={activeJourney} 
                    activeOpp={activeOpp} 
                    tasks={state.tasks} 
                    onUpdateStatus={updateTaskStatus} 
                  />
                )}
                {view === 'training_hub' && (
                  <div className="p-16 space-y-16 animate-in fade-in duration-500 overflow-y-auto">
                    <header className="space-y-4">
                      <h3 className="text-6xl font-black tracking-tighter text-slate-900">Training Center</h3>
                      <p className="text-slate-400 font-medium italic text-xl">The Inner Circle Curriculum: Master the Art of the Federal Win.</p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {[
                        { title: "Niche Selection", desc: "Identify high-intent agencies based on NAICS historical spend.", icon: Target },
                        { title: "Solicitation Breakdown", desc: "Systematic 5-step process to analyze and organize Section L/M.", icon: FileSearch },
                        { title: "Expert Prompting", desc: "Mastering Clarity, Specificity, and Context for AI proposal generation.", icon: BrainCircuit },
                        { title: "Subcontractor Discovery", desc: "Building the right mission team for complex multi-disciplinary bids.", icon: Users },
                        { title: "Active Voice Narrative", desc: "Writing winning content that removes robotic AI patterns.", icon: Sparkles },
                        { title: "Accountability submission", desc: "Bi-weekly group submission sprints and peer review cycles.", icon: CheckCircle2 },
                      ].map((module, i) => (
                        <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                          <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-6 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <module.icon className="w-6 h-6" />
                          </div>
                          <h4 className="text-2xl font-black mb-2">{module.title}</h4>
                          <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">{module.desc}</p>
                          <button className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">Start Module <ArrowRight className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {view === 'intelligence' && <div className="p-16 text-center h-full flex flex-col items-center justify-center"><History className="w-24 h-24 mx-auto mb-8 text-slate-200" /><h3 className="text-4xl font-black text-slate-900">Market Intelligence</h3><p className="text-slate-400">Winner price distributions for NAICS {state.user.naics} are currently being analyzed.</p></div>}
                {view === 'team' && <div className="p-16 h-full"><h3 className="text-4xl font-black mb-8 text-slate-900">Team Workspace</h3><div className="p-12 bg-indigo-50 rounded-[64px] text-center flex flex-col items-center justify-center gap-4"><Users className="w-16 h-16 mx-auto mb-4 text-indigo-400" /><p className="font-bold text-indigo-900 uppercase tracking-widest text-xs">Collaborate with expert partners and cleared subcontractors.</p></div></div>}
                {view === 'notifications' && <div className="p-16 space-y-8 h-full"><h3 className="text-4xl font-black text-slate-900">Alerts</h3><div className="space-y-4">{state.notifications.map(n => <div key={n.id} className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm">{n.message}</div>)}</div></div>}
              </>
            )}
          </main>
          {/* Fix: Redundant view comparisons that cause TypeScript inference errors */}
          {view !== 'onboarding' && (
            <button 
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-8 right-8 p-6 bg-indigo-600 text-white rounded-[32px] shadow-2xl z-[100] hover:scale-110 active:scale-95 transition-all animate-bounce"
            >
              <MessageSquare className="w-8 h-8" />
            </button>
          )}
          <ChatWindow />
        </>
      )}
    </div>
  );
}
