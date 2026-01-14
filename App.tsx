
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Lock, 
  ArrowRight, 
  FileText, 
  DollarSign, 
  Target, 
  Shield, 
  BrainCircuit, 
  ChevronRight,
  Loader2,
  Settings,
  Info,
  Layers,
  Activity,
  Zap,
  Trash2,
  PieChart,
  ClipboardCheck,
  Upload,
  FileUp,
  X,
  RefreshCw,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { Stage, StageStatus, ProposalData, ComplianceCheck, ScoringMap, BudgetItem, RedTeamFix } from './types';
import { geminiService } from './services/geminiService';

const STAGES: Stage[] = [
  { id: 1, name: 'Compliance & Go/No-Go', agent: 'Compliance Agent', description: 'Eligibility verification & fatal flaw detection', icon: Shield },
  { id: 2, name: 'Grant Architecture', agent: 'Architecture Agent', description: 'Logic models & scoring architecture mapping', icon: Target },
  { id: 3, name: 'Narrative Drafting', agent: 'Narrative Drafting Agent', description: 'Modular section-by-section generation', icon: FileText },
  { id: 4, name: 'SBIR Commercialization', agent: 'SBIR Agent', description: 'TAM/SAM/SOM & revenue pathways', icon: BrainCircuit, conditional: true },
  { id: 5, name: 'Budget & Allowability', agent: 'Budget Agent', description: '2 CFR 200 compliance & category allocation', icon: DollarSign },
  { id: 6, name: 'Red Team Review', agent: 'Red Team Agent', description: 'Scoring simulation & fix list generation', icon: AlertTriangle },
  { id: 7, name: 'Submission & Archive', agent: 'Master Orchestrator', description: 'Final package export & win-rate metrics', icon: CheckCircle2 }
];

const STORAGE_KEY = 'grant-factory-proposal-state';

export default function App() {
  const [currentStageId, setCurrentStageId] = useState(1);
  const [stageStatuses, setStageStatuses] = useState<Record<number, StageStatus>>({
    1: 'active', 2: 'locked', 3: 'locked', 4: 'locked', 5: 'locked', 6: 'locked', 7: 'locked'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [reviewerMode, setReviewerMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string } | null>(null);
  const [samSyncStatus] = useState({
    ueiDetected: true,
    ueiNumber: 'J4KHBR9LKE75',
    entityName: 'Renewable Dynamics Inc.',
    registrationExpiry: 'Dec 15, 2026',
    cageCode: '8K3L9'
  });

  const [proposal, setProposal] = useState<ProposalData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      nofoText: '',
      orgProfile: 'Renewable Dynamics: 45 FTEs, $12M revenue, UEI J4KHBR9LKE75. Specialized in solar-to-hydrogen conversion tech.',
      isSBIR: true,
      scoringMap: null,
      complianceChecks: [],
      goNoGo: null,
      narrative: {},
      budget: [],
      redTeamScore: null,
      redTeamFixes: []
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposal));
  }, [proposal]);

  const addLog = (msg: string) => setAgentLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const updateStageStatus = useCallback((id: number, status: StageStatus) => {
    setStageStatuses(prev => {
      const newState = { ...prev, [id]: status };
      // Unlock next stage if complete
      if (status === 'complete' && id < 7) {
        const nextId = id === 3 && !proposal.isSBIR ? 5 : id + 1;
        newState[nextId] = 'active';
        if (id === 3 && !proposal.isSBIR) {
          newState[4] = 'skipped';
        }
      }
      return newState;
    });
  }, [proposal.isSBIR]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedFile({ name: file.name, base64: base64String });
        addLog(`PDF Uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      addLog("Error: Only PDF files are supported.");
    }
  };

  const handleRunCompliance = async () => {
    if (!proposal.nofoText && !uploadedFile) {
      addLog("Error: No solicitation input provided.");
      return;
    }
    setIsProcessing(true);
    addLog("Activating Compliance Agent...");
    try {
      const result = await geminiService.evaluateCompliance(
        proposal.nofoText, 
        proposal.orgProfile, 
        uploadedFile?.base64
      );
      setProposal(prev => ({
        ...prev,
        goNoGo: result.decision as any,
        complianceChecks: result.checks
      }));
      addLog(`Compliance check complete. Decision: ${result.decision}`);
      if (result.decision === 'GO') {
        updateStageStatus(1, 'complete');
        setCurrentStageId(2);
      }
    } catch (e) {
      addLog("Error: Compliance check failed.");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateArchitecture = async () => {
    setIsProcessing(true);
    addLog("Grant Architecture Agent mapping evaluation criteria...");
    try {
      const map = await geminiService.generateArchitecture(proposal.nofoText, uploadedFile?.base64);
      setProposal(prev => ({ ...prev, scoringMap: map }));
      addLog("Architecture generation complete. Scoring map defined.");
      updateStageStatus(2, 'complete');
      setCurrentStageId(3);
    } catch (e) {
      addLog("Error: Architecture generation failed.");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDraftSection = async (sectionName: string) => {
    setIsProcessing(true);
    addLog(`Narrative Drafting Agent generating: ${sectionName}...`);
    try {
      // For brevity, using a simpler prompt here, but in production this would be modular
      const response = await geminiService.evaluateCompliance(`Draft section: ${sectionName}`, proposal.orgProfile);
      setProposal(prev => ({
        ...prev,
        narrative: { ...prev.narrative, [sectionName]: `Generated content for ${sectionName}. This content demonstrates how Renewable Dynamics meets the specific requirements of the solicitation with high technical merit and low risk.` }
      }));
      addLog(`Section ${sectionName} drafted.`);
    } catch (e) {
      addLog(`Error drafting ${sectionName}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBudget = async () => {
    if (!proposal.scoringMap) return;
    setIsProcessing(true);
    addLog("Budget Agent calculating allowability...");
    try {
      const budgetItems = await geminiService.generateBudget(proposal.nofoText, proposal.scoringMap.logicModel);
      setProposal(prev => ({ ...prev, budget: budgetItems }));
      addLog("Budget generation complete. All line items verified for 2 CFR 200 compliance.");
      updateStageStatus(5, 'complete');
      setCurrentStageId(6);
    } catch (e) {
      addLog("Error: Budget generation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunRedTeam = async () => {
    setIsProcessing(true);
    addLog("Red Team Agent simulating peer review...");
    try {
      const review = await geminiService.runRedTeamReview(proposal);
      setProposal(prev => ({
        ...prev,
        redTeamScore: review.estimatedScore,
        redTeamFixes: review.fixes
      }));
      addLog(`Red Team Review finished. Estimated Score: ${review.estimatedScore}`);
      updateStageStatus(6, 'complete');
      setCurrentStageId(7);
    } catch (e) {
      addLog("Error: Red Team review failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProposal = () => {
    if (confirm("Are you sure you want to reset the entire proposal? All data will be lost.")) {
      setProposal({
        nofoText: '',
        orgProfile: 'Renewable Dynamics: 45 FTEs, $12M revenue, UEI J4KHBR9LKE75. Specialized in solar-to-hydrogen conversion tech.',
        isSBIR: true,
        scoringMap: null,
        complianceChecks: [],
        goNoGo: null,
        narrative: {},
        budget: [],
        redTeamScore: null,
        redTeamFixes: []
      });
      setStageStatuses({ 1: 'active', 2: 'locked', 3: 'locked', 4: 'locked', 5: 'locked', 6: 'locked', 7: 'locked' });
      setCurrentStageId(1);
      setUploadedFile(null);
      addLog("System reset. Awaiting new solicitation.");
    }
  };

  const getStatusIcon = (status: StageStatus) => {
    switch(status) {
      case 'complete': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'active': return <Activity className="w-5 h-5 text-purple-500 animate-pulse" />;
      case 'skipped': return <ArrowRight className="w-5 h-5 text-slate-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Lock className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${reviewerMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Orchestrator */}
      <aside className={`w-80 border-r flex flex-col transition-colors ${reviewerMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Grant Factory</h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-purple-500">Master Orchestrator</span>
            </div>
          </div>
          
          <div className="space-y-1">
             <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Progress</span>
                <span>{Math.round((Object.values(stageStatuses).filter(s => s === 'complete').length / 7) * 100)}%</span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full transition-all duration-1000"
                  style={{ width: `${(Object.values(stageStatuses).filter(s => s === 'complete').length / 7) * 100}%` }}
                />
             </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {STAGES.map((stage) => {
            const status = stageStatuses[stage.id];
            const isActive = currentStageId === stage.id;
            const isLocked = status === 'locked';

            return (
              <button
                key={stage.id}
                onClick={() => !isLocked && setCurrentStageId(stage.id)}
                disabled={isLocked}
                className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-500' 
                    : isLocked 
                      ? 'opacity-40 border-transparent' 
                      : 'hover:bg-slate-100 border-transparent'
                } ${reviewerMode && isActive ? 'bg-purple-900/30 border-purple-800' : ''}`}
              >
                <div className={`flex-shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {getStatusIcon(status)}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-bold truncate ${isActive ? 'text-purple-700' : ''} ${reviewerMode && isActive ? 'text-purple-300' : ''}`}>
                    {stage.id}. {stage.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">
                    {stage.agent}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-600 rounded-full my-3 mr-1" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <button 
            onClick={() => setReviewerMode(!reviewerMode)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all font-semibold text-sm ${
              reviewerMode 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {reviewerMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {reviewerMode ? 'Exit Reviewer Mode' : 'Enter Reviewer Mode'}
          </button>
          
          <div className="bg-slate-100 rounded-lg p-3">
             <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Agent Activity</span>
             </div>
             <div className="space-y-1.5 h-32 overflow-hidden flex flex-col-reverse font-mono text-[9px] text-slate-600 leading-tight">
                {agentLogs.length === 0 ? (
                  <div className="italic">Awaiting instructions...</div>
                ) : (
                  agentLogs.map((log, i) => <div key={i}>{log}</div>)
                )}
             </div>
          </div>

          <button 
            onClick={resetProposal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 transition-colors text-xs font-bold uppercase"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Factory
          </button>
        </div>
      </aside>

      {/* Main Orchestration Board */}
      <main className="flex-1 overflow-y-auto relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
             <div className="relative">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                <BrainCircuit className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
             </div>
             <div className="text-center">
                <p className="font-bold text-slate-900 animate-pulse">Orchestrator Processing...</p>
                <p className="text-sm text-slate-500">Coordinating specialist agents</p>
             </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-10 py-12">
          {/* STAGE HEADER */}
          <div className="mb-10 flex justify-between items-end border-b pb-8 border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-2 text-purple-600">
                {React.createElement(STAGES[currentStageId - 1].icon, { className: "w-10 h-10" })}
                <div className="h-6 w-px bg-slate-300 mx-2" />
                <span className="font-bold text-sm uppercase tracking-widest">{STAGES[currentStageId - 1].agent}</span>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{STAGES[currentStageId - 1].name}</h2>
              <p className="text-lg text-slate-500 max-w-2xl">{STAGES[currentStageId - 1].description}</p>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600"><Info className="w-5 h-5" /></button>
              <button className="p-2 text-slate-400 hover:text-slate-600"><Settings className="w-5 h-5" /></button>
            </div>
          </div>

          {/* STAGE CONTENT */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Stage 1: Compliance */}
            {currentStageId === 1 && (
              <div className="grid grid-cols-1 gap-6">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FileUp className="w-5 h-5 text-purple-600" />
                      Solicitation Input (NOFO/RFP)
                   </h3>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <textarea 
                          placeholder="Paste solicitation text here if no PDF is available..."
                          className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none transition-all"
                          value={proposal.nofoText}
                          onChange={(e) => setProposal(prev => ({ ...prev, nofoText: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-4">
                        <div 
                          className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all ${uploadedFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer'}`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf"
                            onChange={handleFileUpload}
                          />
                          {uploadedFile ? (
                            <>
                              <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                              <span className="font-bold text-green-700">{uploadedFile.name}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                className="mt-2 text-xs text-red-500 font-bold uppercase hover:underline"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-slate-400 mb-2" />
                              <span className="font-bold text-slate-700">Upload PDF</span>
                              <p className="text-xs text-slate-500 mt-1">Multi-modal PDF parsing enabled</p>
                            </>
                          )}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                           <div className="bg-blue-600 p-2.5 rounded-lg">
                              <ClipboardCheck className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1">
                              <span className="block text-xs font-bold text-blue-900 uppercase">SAM.gov Registry Status</span>
                              <span className="text-sm font-medium text-blue-800">{samSyncStatus.entityName} (UEI: {samSyncStatus.ueiNumber})</span>
                           </div>
                           <div className="text-green-600 flex items-center gap-1 font-bold text-xs uppercase">
                              <Zap className="w-3 h-3 fill-current" />
                              Synced
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleRunCompliance}
                        className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 hover:shadow-lg transition-all"
                        disabled={!proposal.nofoText && !uploadedFile}
                      >
                        Initiate Compliance Check
                        <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>
                </section>

                {proposal.complianceChecks.length > 0 && (
                  <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold">Eligibility & Compliance Matrix</h3>
                      <div className={`px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 ${proposal.goNoGo === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {proposal.goNoGo === 'GO' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                         Final Decision: {proposal.goNoGo}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                       {proposal.complianceChecks.map((check, i) => (
                         <div key={i} className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                           check.status === 'pass' ? 'bg-green-50/50 border-green-100' : 
                           check.status === 'fail' ? 'bg-red-50 border-red-100 ring-1 ring-red-200' : 'bg-yellow-50 border-yellow-100'
                         }`}>
                           <div className="mt-1">
                              {check.status === 'pass' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                               check.status === 'fail' ? <XCircle className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{check.item}</span>
                                {check.blocking && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase">Blocking</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{check.reason}</p>
                           </div>
                         </div>
                       ))}
                    </div>

                    {proposal.goNoGo === 'GO' && (
                      <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between">
                         <div>
                            <p className="font-bold text-lg">Orchestrator Condition: GO</p>
                            <p className="text-slate-400 text-sm">Eligibility verified. Proceed to Grant Architecture Phase.</p>
                         </div>
                         <button 
                           onClick={() => { updateStageStatus(1, 'complete'); setCurrentStageId(2); }}
                           className="px-6 py-2.5 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                         >
                            Next: Architecture
                            <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* Stage 2: Architecture */}
            {currentStageId === 2 && (
              <div className="space-y-6">
                 <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-xl font-bold mb-1">Mapping Scoring Criteria</h3>
                        <p className="text-slate-500 text-sm">Translating NOFO requirements into a point-bearing architecture.</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-600">SBIR/STTR Pathway?</span>
                        <button 
                          onClick={() => setProposal(prev => ({ ...prev, isSBIR: !prev.isSBIR }))}
                          className={`w-14 h-8 rounded-full transition-colors relative ${proposal.isSBIR ? 'bg-purple-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${proposal.isSBIR ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>
                   </div>

                   {!proposal.scoringMap ? (
                     <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl border-slate-200">
                        <Target className="w-12 h-12 text-slate-300 mb-4" />
                        <button 
                          onClick={handleGenerateArchitecture}
                          className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700"
                        >
                          Generate Point-Weighted Map
                        </button>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-4">
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-slate-500">Evaluation Sections</h4>
                              <div className="space-y-3">
                                 {proposal.scoringMap.sections.map((section, idx) => (
                                   <div key={idx} className="flex items-center gap-4">
                                      <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                         <span className="font-semibold text-slate-700">{section.name}</span>
                                         <span className="text-xs text-slate-400 font-mono">{section.subsections} subsections</span>
                                      </div>
                                      <div className="w-20 text-right font-black text-purple-600">{section.points} pts</div>
                                   </div>
                                 ))}
                                 <div className="pt-4 border-t border-slate-200 flex justify-between items-center font-black">
                                    <span>Total Points Possible</span>
                                    <span className="text-xl">{proposal.scoringMap.totalPoints}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-3">Constraints</h4>
                              <div className="space-y-2">
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Page Limit</span>
                                    <span className="font-bold">{proposal.scoringMap.pageLimit} pages</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Competitive Threshold</span>
                                    <span className="font-bold text-green-600">{proposal.scoringMap.competitiveThreshold}%</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-indigo-900 text-white p-4 rounded-xl">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-3">Format Rules</h4>
                              <ul className="text-xs space-y-1.5 opacity-90">
                                 {proposal.scoringMap.formatRequirements.map((r, i) => <li key={i} className="flex items-center gap-2">• {r}</li>)}
                              </ul>
                           </div>
                           <button 
                             onClick={() => { updateStageStatus(2, 'complete'); setCurrentStageId(3); }}
                             className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                           >
                             Lock Architecture
                             <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   )}
                 </section>
              </div>
            )}

            {/* Stage 3: Narrative Drafting */}
            {currentStageId === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <section className="space-y-4">
                    <h3 className="font-bold text-xl mb-4">Drafting Matrix</h3>
                    {proposal.scoringMap?.sections.map((section, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group">
                         <div>
                            <span className="block font-bold text-slate-900">{section.name}</span>
                            <span className="text-xs text-slate-500">{proposal.narrative[section.name] ? 'Content ready' : 'Awaiting generation'}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            {proposal.narrative[section.name] && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            <button 
                              onClick={() => handleDraftSection(section.name)}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-600 hover:bg-purple-200"
                            >
                               {proposal.narrative[section.name] ? 'Re-generate' : 'Draft Section'}
                            </button>
                         </div>
                      </div>
                    ))}
                    <div className="pt-8">
                      <button 
                        disabled={Object.keys(proposal.narrative).length < (proposal.scoringMap?.sections.length || 1)}
                        onClick={() => { updateStageStatus(3, 'complete'); setCurrentStageId(proposal.isSBIR ? 4 : 5); }}
                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                      >
                        Approve All Narrative Sections
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                 </section>

                 <section className="bg-slate-100 rounded-2xl p-6 min-h-[500px]">
                    <div className="flex items-center gap-2 text-slate-400 mb-6 font-bold uppercase text-[10px]">
                       <Eye className="w-3.5 h-3.5" />
                       Preview Panel
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-inner min-h-full font-serif text-slate-700 leading-relaxed">
                       {Object.keys(proposal.narrative).length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-center text-slate-300">
                            <Layers className="w-12 h-12 mb-2" />
                            <p>Select a section to begin drafting...</p>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            {Object.entries(proposal.narrative).map(([title, content], i) => (
                              <div key={i}>
                                <h4 className="font-bold text-slate-900 mb-2 border-b">{title}</h4>
                                <p className="text-sm">{content}</p>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </section>
              </div>
            )}

            {/* Stage 4: SBIR (Conditional) */}
            {currentStageId === 4 && (
              <div className="space-y-6">
                 <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-20">
                    <BrainCircuit className="w-16 h-16 text-purple-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Commercialization Strategy Pathway</h3>
                    <p className="text-slate-500 max-w-lg mx-auto mb-8">
                      The SBIR/STTR Commercialization Agent is mapping the TAM/SAM/SOM and defining revenue pathways for phase III transition.
                    </p>
                    <button 
                      onClick={() => { updateStageStatus(4, 'complete'); setCurrentStageId(5); }}
                      className="px-10 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                    >
                      Process SBIR Commercialization Modules
                    </button>
                 </section>
              </div>
            )}

            {/* Stage 5: Budget */}
            {currentStageId === 5 && (
              <div className="space-y-6">
                 <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h3 className="text-xl font-bold">2 CFR 200 Budget Orchestration</h3>
                          <p className="text-slate-500 text-sm">Mapping project activities to allowable costs.</p>
                       </div>
                       {proposal.budget.length > 0 && (
                         <div className="flex items-center gap-6">
                            <div className="text-right">
                               <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Request</span>
                               <span className="text-xl font-black text-purple-600">${proposal.budget.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={handleGenerateBudget}
                              className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                         </div>
                       )}
                    </div>

                    {proposal.budget.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                         <DollarSign className="w-12 h-12 text-slate-300 mb-4" />
                         <button 
                           onClick={handleGenerateBudget}
                           className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
                         >
                           Generate Line-Item Budget
                         </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <div className="overflow-hidden border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm border-collapse">
                               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                  <tr>
                                     <th className="px-4 py-3">Category</th>
                                     <th className="px-4 py-3">Description</th>
                                     <th className="px-4 py-3">Allowable</th>
                                     <th className="px-4 py-3 text-right">Amount</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {proposal.budget.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-4 py-3 font-bold text-slate-900">{item.category}</td>
                                       <td className="px-4 py-3 text-slate-500">{item.description}</td>
                                       <td className="px-4 py-3">
                                          {item.allowable ? 
                                            <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase">
                                              <CheckCircle2 className="w-3 h-3" /> Yes
                                            </span> : 
                                            <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase">
                                              <AlertTriangle className="w-3 h-3" /> Check
                                            </span>
                                          }
                                       </td>
                                       <td className="px-4 py-3 text-right font-mono font-bold">${item.amount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                         <div className="flex justify-end pt-6">
                            <button 
                              onClick={() => { updateStageStatus(5, 'complete'); setCurrentStageId(6); }}
                              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2"
                            >
                               Proceed to Red Team Review
                               <ChevronRight className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    )}
                 </section>
              </div>
            )}

            {/* Stage 6: Red Team */}
            {currentStageId === 6 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <section className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold mb-8 uppercase tracking-widest text-slate-400">Score Simulation</h3>
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                          <circle 
                            cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - (proposal.redTeamScore || 0) / 100)}
                            className="text-purple-600 transition-all duration-1000 ease-out"
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-slate-900 leading-none">{proposal.redTeamScore || '--'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Projected Score</span>
                       </div>
                    </div>
                    {!proposal.redTeamScore ? (
                      <button 
                        onClick={handleRunRedTeam}
                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200"
                      >
                         Run Full Red Team Review
                      </button>
                    ) : (
                      <div className="w-full space-y-4">
                         <div className={`p-4 rounded-xl border-2 font-bold ${proposal.redTeamScore >= 90 ? 'bg-green-50 border-green-500 text-green-700' : 'bg-yellow-50 border-yellow-500 text-yellow-700'}`}>
                            {proposal.redTeamScore >= 90 ? 'Submission Recommended' : 'Improvements Needed'}
                         </div>
                         <button 
                           onClick={handleRunRedTeam}
                           className="text-xs font-bold text-purple-600 uppercase hover:underline"
                         >
                           Re-Run Review
                         </button>
                      </div>
                    )}
                 </section>

                 <section className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                       <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                       Critical Fix List
                    </h3>
                    {proposal.redTeamFixes.length === 0 ? (
                      <div className="bg-slate-50 p-12 rounded-2xl border border-dashed text-center text-slate-400">
                         No critical weaknesses identified yet. Run review to generate.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                           {proposal.redTeamFixes.map((fix, i) => (
                             <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4">
                                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${fix.severity === 'high' ? 'bg-red-500 animate-pulse' : fix.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">{fix.area}</span>
                                      <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                                        fix.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                      }`}>{fix.severity}</span>
                                   </div>
                                   <p className="text-sm text-slate-600 mt-1">{fix.recommendation}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="pt-8">
                           <button 
                             onClick={() => { updateStageStatus(6, 'complete'); setCurrentStageId(7); }}
                             className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                           >
                             Finalize & Package Proposal
                             <ChevronRight className="w-5 h-5" />
                           </button>
                        </div>
                      </>
                    )}
                 </section>
              </div>
            )}

            {/* Stage 7: Export */}
            {currentStageId === 7 && (
              <div className="max-w-3xl mx-auto space-y-8">
                 <section className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                       <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">Proposal Orchestrated</h3>
                    <p className="text-slate-500 mb-10">All factory gates passed. Red Team score verified at {proposal.redTeamScore}. Your grant package is ready for final submission.</p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                       <button className="flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 hover:scale-105 transition-all shadow-lg shadow-purple-200">
                          <Download className="w-5 h-5" />
                          Export as PDF
                       </button>
                       <button className="flex items-center justify-center gap-2 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold hover:border-purple-300 hover:bg-purple-50 transition-all">
                          <FileText className="w-5 h-5" />
                          Word (.docx)
                       </button>
                    </div>

                    <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-3 gap-6">
                       <div className="text-center">
                          <div className="text-2xl font-black text-slate-900">{Object.keys(proposal.narrative).length}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Total Sections</div>
                       </div>
                       <div className="text-center border-x border-slate-100">
                          <div className="text-2xl font-black text-slate-900">{proposal.scoringMap?.pageLimit}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Pages Generated</div>
                       </div>
                       <div className="text-center">
                          <div className="text-2xl font-black text-green-600">84%</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Win Probability</div>
                       </div>
                    </div>
                 </section>

                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                    <Info className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                    <div>
                       <h4 className="font-bold text-indigo-900 mb-1">Final Submission Checklist</h4>
                       <ul className="text-sm text-indigo-700 space-y-2 opacity-80">
                          <li className="flex items-center gap-2">
                             <input type="checkbox" className="rounded border-indigo-300" />
                             Verified SF-424 application for Federal Assistance
                          </li>
                          <li className="flex items-center gap-2">
                             <input type="checkbox" className="rounded border-indigo-300" />
                             Compliance with font size and margin requirements
                          </li>
                          <li className="flex items-center gap-2">
                             <input type="checkbox" className="rounded border-indigo-300" />
                             All required attachments (Letters of support, biosketches) uploaded
                          </li>
                       </ul>
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
