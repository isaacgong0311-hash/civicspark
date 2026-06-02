import type { IssueTopic } from "./types";

export const ISSUE_TOPICS: IssueTopic[] = [
  {
    id: "housing",
    label: "Housing & Affordability",
    emoji: "home",
    keywords: ["housing", "rent", "mortgage", "homeless", "affordable"],
  },
  {
    id: "environment",
    label: "Environment & Climate",
    emoji: "leaf",
    keywords: ["environment", "climate", "emissions", "clean energy", "water", "wildlife"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    emoji: "heart-pulse",
    keywords: ["health", "medicare", "medicaid", "insurance", "prescription", "mental health"],
  },
  {
    id: "education",
    label: "Education",
    emoji: "graduation-cap",
    keywords: ["education", "student", "school", "tuition", "loan", "teacher"],
  },
  {
    id: "economy",
    label: "Jobs & Economy",
    emoji: "trending-up",
    keywords: ["economy", "jobs", "wage", "tax", "small business", "inflation"],
  },
  {
    id: "safety",
    label: "Public Safety",
    emoji: "shield",
    keywords: ["crime", "police", "gun", "safety", "drug", "border"],
  },
  {
    id: "tech",
    label: "Technology & Privacy",
    emoji: "cpu",
    keywords: ["technology", "privacy", "data", "internet", "artificial intelligence", "cyber"],
  },
  {
    id: "veterans",
    label: "Veterans & Military",
    emoji: "award",
    keywords: ["veteran", "military", "armed forces", "VA"],
  },
];

export function getIssueById(id: string): IssueTopic | undefined {
  return ISSUE_TOPICS.find((t) => t.id === id);
}
