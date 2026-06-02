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
}

export interface BillSummary {
  plainEnglish: string;
  whatItMeans: string;
  districtImpact: string;
  stance: "supports" | "opposes" | "neutral";
}
