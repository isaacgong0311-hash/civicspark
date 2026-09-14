export type MissionStatus = "draft" | "published" | "closed";
export type MissionPerspective = "fact" | "supporting" | "opposing";
export type StudentPosition = "support" | "unsure" | "oppose";
export type LetterReviewStatus = "draft" | "submitted" | "approved" | "returned" | "excluded";

export interface MissionSource {
  id: string;
  label: string;
  url: string;
  publisher: "Congress.gov" | "House Clerk" | "Senate";
  excerpt: string;
}

export interface EvidenceCard {
  id: string;
  heading: string;
  explanation: string;
  sourceIds: string[];
  perspective: MissionPerspective;
}

export interface MissionQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
  explanation: string;
  sourceIds: string[];
}

export interface CivicMission {
  id: string;
  code: string;
  title: string;
  kicker: string;
  description: string;
  scenario: string;
  gradeBand: "6–8" | "9–10" | "11–12";
  learningObjective: string;
  estimatedMinutes: number;
  status: MissionStatus;
  bill: {
    congress: number;
    type: string;
    number: string;
    title: string;
    latestAction: string;
    policyArea: string;
    url: string;
  };
  representative: {
    name: string;
    title: string;
    district: string;
  };
  sources: MissionSource[];
  evidence: EvidenceCard[];
  questions: MissionQuestion[];
  publishedAt?: string;
}

export interface MissionResponse {
  participantId: string;
  missionId: string;
  nickname: string;
  currentChapter: number;
  initialPosition?: StudentPosition;
  initialConfidence?: number;
  evidenceRatings: Record<string, number>;
  answers: Record<string, number>;
  reflection?: string;
  personalConnection?: string;
  finalPosition?: StudentPosition;
  finalConfidence?: number;
  letter?: string;
  reviewStatus: LetterReviewStatus;
  feedback?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface MissionMetrics {
  participants: number;
  completed: number;
  completionRate: number;
  averageKnowledgeScore: number;
  averageConfidenceShift: number;
  positions: Record<StudentPosition, number>;
  review: Record<LetterReviewStatus, number>;
}
