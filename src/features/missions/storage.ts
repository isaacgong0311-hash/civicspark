"use client";

import { DEMO_MISSION, DEMO_RESPONSES } from "./demo-data";
import type { CivicMission, MissionResponse } from "./types";

const RESPONSE_PREFIX = "civicspark:mission-response:";
const CUSTOM_MISSIONS_KEY = "civicspark:custom-missions";

export function findMission(code: string): CivicMission | null {
  const normalized = code.trim().toUpperCase();
  if (normalized === DEMO_MISSION.code) return DEMO_MISSION;
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_MISSIONS_KEY) ?? "[]") as CivicMission[];
    return custom.find((mission) => mission.code === normalized) ?? null;
  } catch {
    return null;
  }
}

export function loadResponse(missionId: string): MissionResponse | null {
  try {
    return JSON.parse(localStorage.getItem(`${RESPONSE_PREFIX}${missionId}`) ?? "null") as MissionResponse | null;
  } catch {
    return null;
  }
}

export function saveResponse(response: MissionResponse): void {
  localStorage.setItem(`${RESPONSE_PREFIX}${response.missionId}`, JSON.stringify(response));
  window.dispatchEvent(new CustomEvent("civicspark:mission-saved", { detail: response }));
}

export function getTeacherResponses(missionId: string): MissionResponse[] {
  const local = loadResponse(missionId);
  const seeded = DEMO_RESPONSES.filter((response) => response.missionId === missionId);
  return local ? [...seeded.filter((response) => response.participantId !== local.participantId), local] : seeded;
}

export function saveCustomMission(mission: CivicMission): void {
  let missions: CivicMission[] = [];
  try {
    missions = JSON.parse(localStorage.getItem(CUSTOM_MISSIONS_KEY) ?? "[]") as CivicMission[];
  } catch {}
  const next = [mission, ...missions.filter((item) => item.id !== mission.id)].slice(0, 12);
  localStorage.setItem(CUSTOM_MISSIONS_KEY, JSON.stringify(next));
}
