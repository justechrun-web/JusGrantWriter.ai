
import React from 'react';

export enum BidStage {
  STAGE_0 = "SOURCES_SOUGHT",
  STAGE_1 = "PRE_SOLICITATION",
  STAGE_2 = "SOLICITATION",
  STAGE_3 = "AWARD"
}

export type JourneyStatus = "in_progress" | "autopilot_complete" | "review" | "submitted" | "archived";
export type TaskStatus = "to-do" | "in-progress" | "done";

export interface Task {
  id: string;
  journeyId: string;
  title: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  status: TaskStatus;
}

export interface Journey {
  id: string;
  companyId: string;
  opportunityId: string;
  status: JourneyStatus;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  source: "sam.gov" | "grants.gov" | "state" | "city";
  noticeId: string;
  title: string;
  agency: string;
  dueDate: string;
  description: string;
  bidStage: BidStage;
  estimatedAward: number;
  incumbent?: string;
  location?: string;
  naics?: string;
  sources?: { title?: string; uri?: string }[];
  // New: Expert Analysis Breakdown
  analysis?: {
    summary: string;
    eligibility: string;
    deliverables: string;
    instructions: string;
    budget: string;
    compliance: string;
  };
}

export interface HistoricalAward {
  id: string;
  title: string;
  agency: string;
  awardee: string;
  amount: number;
  date: string;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  companyName: string;
  credits: number;
  isTrial: boolean;
  trialEnds: string;
  samGovStatus: 'unregistered' | 'pending' | 'active';
  subscription: 'free' | 'pro' | 'enterprise';
  uei?: string;
  cageCode?: string;
  readinessScore: number;
  stageReadiness: {
    [key in BidStage]: boolean;
  };
  capabilityPDF?: string;
  capabilities: string[];
  naics: string;
}

export interface BidPacket {
  id: string;
  opportunityId: string;
  companyInfo: any;
  team: any[];
  documents: {
    technicalProposal?: string;
    coverLetter?: string;
    capabilityStatement?: string;
    emailDraft?: string;
  };
  status: "draft" | "ready" | "sent";
}

export interface Notification {
  id: string;
  type: 'opportunity' | 'system' | 'award';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AppState {
  user: UserProfile;
  opportunities: Opportunity[];
  activeOpportunityId?: string;
  activePacketId?: string;
  activeJourneyId?: string;
  packets: BidPacket[];
  historicalAwards: HistoricalAward[];
  journeys: Journey[];
  tasks: Task[];
  logs: string[];
  autoSearchTerms: string[];
  notifications: Notification[];
}
