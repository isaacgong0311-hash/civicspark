import type { CivicMission, MissionMetrics, MissionResponse, StudentPosition } from "./types";

export function scoreResponse(mission: CivicMission, response: MissionResponse): number {
  if (mission.questions.length === 0) return 0;
  const correct = mission.questions.filter((question) => response.answers[question.id] === question.correctChoice).length;
  return Math.round((correct / mission.questions.length) * 100);
}

export function calculateMetrics(mission: CivicMission, responses: MissionResponse[]): MissionMetrics {
  const completed = responses.filter((response) => Boolean(response.completedAt));
  const positions: Record<StudentPosition, number> = { support: 0, unsure: 0, oppose: 0 };
  const review: MissionMetrics["review"] = { draft: 0, submitted: 0, approved: 0, returned: 0, excluded: 0 };
  for (const response of responses) {
    if (response.finalPosition) positions[response.finalPosition] += 1;
    review[response.reviewStatus] += 1;
  }
  const averageKnowledgeScore = completed.length
    ? Math.round(completed.reduce((sum, response) => sum + scoreResponse(mission, response), 0) / completed.length)
    : 0;
  const confidenceResponses = completed.filter((response) => response.initialConfidence && response.finalConfidence);
  const averageConfidenceShift = confidenceResponses.length
    ? Number((confidenceResponses.reduce((sum, response) => sum + (response.finalConfidence! - response.initialConfidence!), 0) / confidenceResponses.length).toFixed(1))
    : 0;
  return {
    participants: responses.length,
    completed: completed.length,
    completionRate: responses.length ? Math.round((completed.length / responses.length) * 100) : 0,
    averageKnowledgeScore,
    averageConfidenceShift,
    positions,
    review,
  };
}
