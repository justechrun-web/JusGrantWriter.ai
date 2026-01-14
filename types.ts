
import React from 'react';

export type StageStatus = 'locked' | 'active' | 'complete' | 'skipped' | 'failed';

export interface Stage {
  id: number;
  name: string;
  agent: string;
  description: string;
  icon: React.ElementType;
  conditional?: boolean;
}

export interface ComplianceCheck {
  item: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  blocking: boolean;
  agent: string;
  reason?: string;
  fatalFlaw?: boolean;
}

export interface LogicModel {
  inputs: string[];
  activities: string[];
  outputs: string[];
  outcomes: string[];
}

export interface ScoringSection {
  name: string;
  points: number;
  subsections: number;
  description?: string;
}

export interface ScoringMap {
  sections: ScoringSection[];
  totalPoints: number;
  competitiveThreshold: number;
  pageLimit: number;
  formatRequirements: string[];
  logicModel?: LogicModel;
}

export interface BudgetItem {
  category: string;
  description: string;
  amount: number;
  justification: string;
  allowable: boolean;
}

export interface RedTeamFix {
  area: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface ProposalData {
  nofoText: string;
  orgProfile: string;
  isSBIR: boolean;
  scoringMap: ScoringMap | null;
  complianceChecks: ComplianceCheck[];
  goNoGo: 'GO' | 'NO-GO' | null;
  narrative: Record<string, string>;
  budget: BudgetItem[];
  redTeamScore: number | null;
  redTeamFixes: RedTeamFix[];
}
