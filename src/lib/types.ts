export type Chamber = "House" | "Senate";

export interface Representative {
  name: string;
  chamber: Chamber;
  party: string;
  state: string;
  district?: string;
  contactUrl: string;
  phone?: string;
  twitter?: string;
  bioguideId?: string;
  photoUrl?: string;
}

export interface IssueTopic {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
}

/** 1=Introduced 2=Committee 3=Floor Ready 4=Passed Chamber 5=Signed */
export type BillStage = 1 | 2 | 3 | 4 | 5;

export interface Bill {
  id: string;
  congress: number;
  type: string;
  number: string;
  title: string;
  latestAction: string;
  latestActionDate: string;
  url: string;
  policyArea?: string;
  matchedIssues: string[];
  stage?: BillStage;
  urgency?: "urgent" | "new" | "active";
  sponsorName?: string;
  sponsorParty?: string;
  cosponsors?: number;
  introducedDate?: string;
}

export interface BillSummary {
  plainEnglish: string;
  whatItMeans: string;
  districtImpact: string;
  stance: "supports" | "opposes" | "neutral";
}

export interface ProsCons {
  pros: string[];
  cons: string[];
  supporterView: string;
  opposerView: string;
}

export interface PassLikelihood {
  percent: number;       // 0–100
  label: string;         // "Unlikely" | "Possible" | "Likely" | "Very Likely"
  rationale: string;     // 1-2 sentence explanation
}

export interface MemberDetail {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  photoUrl?: string;
  website?: string;
  sponsoredCount: number;
  recentBills: Bill[];
}
