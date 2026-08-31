import type { Representative } from "./types";

const API_BASE = "https://api.congress.gov/v3";

interface DistrictInfo {
  state: string;
  district: string;
  houseRep: Representative;
}

const TX_SENATORS: Representative[] = [
  {
    name: "John Cornyn",
    chamber: "Senate",
    party: "R",
    state: "TX",
    contactUrl: "https://www.cornyn.senate.gov/contact",
    phone: "(202) 224-2934",
  },
  {
    name: "Ted Cruz",
    chamber: "Senate",
    party: "R",
    state: "TX",
    contactUrl: "https://www.cruz.senate.gov/contact",
    phone: "(202) 224-5922",
  },
];

const ZIP_DISTRICTS: Record<string, DistrictInfo> = {
  // Northwest Austin / Williamson County
  "787": {
    state: "TX",
    district: "21",
    houseRep: {
      name: "Chip Roy",
      chamber: "House",
      party: "R",
      state: "TX",
      district: "21",
      contactUrl: "https://roy.house.gov/contact",
      phone: "(202) 225-4236",
    },
  },
  // Houston
  "770": {
    state: "TX",
    district: "2",
    houseRep: {
      name: "Daniel Crenshaw",
      chamber: "House",
      party: "R",
      state: "TX",
      district: "2",
      contactUrl: "https://crenshaw.house.gov/contact",
      phone: "(202) 225-6565",
    },
  },
  // Dallas
  "752": {
    state: "TX",
    district: "30",
    houseRep: {
      name: "Jasmine Crockett",
      chamber: "House",
      party: "D",
      state: "TX",
      district: "30",
      contactUrl: "https://crockett.house.gov/contact",
      phone: "(202) 225-8885",
    },
  },
  // New York City (Manhattan)
  "100": {
    state: "NY",
    district: "12",
    houseRep: {
      name: "Jerry Nadler",
      chamber: "House",
      party: "D",
      state: "NY",
      district: "12",
      contactUrl: "https://nadler.house.gov/contact",
      phone: "(202) 225-5635",
    },
  },
  // Los Angeles
  "900": {
    state: "CA",
    district: "37",
    houseRep: {
      name: "Sydney Kamlager-Dove",
      chamber: "House",
      party: "D",
      state: "CA",
      district: "37",
      contactUrl: "https://kamlager-dove.house.gov/contact",
      phone: "(202) 225-7084",
    },
  },
  // Chicago
  "606": {
    state: "IL",
    district: "7",
    houseRep: {
      name: "Danny K. Davis",
      chamber: "House",
      party: "D",
      state: "IL",
      district: "7",
      contactUrl: "https://www.davis.house.gov/contact",
      phone: "(202) 225-5006",
    },
  },
  // Miami
  "331": {
    state: "FL",
    district: "27",
    houseRep: {
      name: "Maria Elvira Salazar",
      chamber: "House",
      party: "R",
      state: "FL",
      district: "27",
      contactUrl: "https://salazar.house.gov/contact",
      phone: "(202) 225-3931",
    },
  },
  // Phoenix
  "850": {
    state: "AZ",
    district: "1",
    houseRep: {
      name: "David Schweikert",
      chamber: "House",
      party: "R",
      state: "AZ",
      district: "1",
      contactUrl: "https://schweikert.house.gov/contact",
      phone: "(202) 225-2190",
    },
  },
  // Seattle
  "981": {
    state: "WA",
    district: "7",
    houseRep: {
      name: "Pramila Jayapal",
      chamber: "House",
      party: "D",
      state: "WA",
      district: "7",
      contactUrl: "https://jayapal.house.gov/contact",
      phone: "(202) 225-3106",
    },
  },
  // Denver
  "802": {
    state: "CO",
    district: "1",
    houseRep: {
      name: "Diana DeGette",
      chamber: "House",
      party: "D",
      state: "CO",
      district: "1",
      contactUrl: "https://degette.house.gov/contact",
      phone: "(202) 225-4431",
    },
  },
};

// State senator maps (only most-populated states)
const STATE_SENATORS: Record<string, Representative[]> = {
  TX: TX_SENATORS,
  NY: [
    { name: "Charles Schumer", chamber: "Senate", party: "D", state: "NY", contactUrl: "https://www.schumer.senate.gov/contact", phone: "(202) 224-6542" },
    { name: "Kirsten Gillibrand", chamber: "Senate", party: "D", state: "NY", contactUrl: "https://www.gillibrand.senate.gov/contact", phone: "(202) 224-4451" },
  ],
  CA: [
    { name: "Alex Padilla", chamber: "Senate", party: "D", state: "CA", contactUrl: "https://www.padilla.senate.gov/contact", phone: "(202) 224-3553" },
    { name: "Adam Schiff", chamber: "Senate", party: "D", state: "CA", contactUrl: "https://www.schiff.senate.gov/contact", phone: "(202) 224-3841" },
  ],
  IL: [
    { name: "Dick Durbin", chamber: "Senate", party: "D", state: "IL", contactUrl: "https://www.durbin.senate.gov/contact", phone: "(202) 224-2152" },
    { name: "Tammy Duckworth", chamber: "Senate", party: "D", state: "IL", contactUrl: "https://www.duckworth.senate.gov/contact", phone: "(202) 224-2854" },
  ],
  FL: [
    { name: "Rick Scott", chamber: "Senate", party: "R", state: "FL", contactUrl: "https://www.rickscott.senate.gov/contact", phone: "(202) 224-5274" },
    { name: "Marco Rubio", chamber: "Senate", party: "R", state: "FL", contactUrl: "https://www.rubio.senate.gov/contact", phone: "(202) 224-3041" },
  ],
  AZ: [
    { name: "Mark Kelly", chamber: "Senate", party: "D", state: "AZ", contactUrl: "https://www.kelly.senate.gov/contact", phone: "(202) 224-2235" },
    { name: "Ruben Gallego", chamber: "Senate", party: "D", state: "AZ", contactUrl: "https://www.gallego.senate.gov/contact", phone: "(202) 224-9020" },
  ],
  WA: [
    { name: "Patty Murray", chamber: "Senate", party: "D", state: "WA", contactUrl: "https://www.murray.senate.gov/contact", phone: "(202) 224-2621" },
    { name: "Maria Cantwell", chamber: "Senate", party: "D", state: "WA", contactUrl: "https://www.cantwell.senate.gov/contact", phone: "(202) 224-3441" },
  ],
  CO: [
    { name: "Michael Bennet", chamber: "Senate", party: "D", state: "CO", contactUrl: "https://www.bennet.senate.gov/contact", phone: "(202) 224-5852" },
    { name: "John Hickenlooper", chamber: "Senate", party: "D", state: "CO", contactUrl: "https://www.hickenlooper.senate.gov/contact", phone: "(202) 224-5941" },
  ],
};

// Last-resort state guess, only used if the ZIP3 isn't curated AND the live
// geocode call fails outright (e.g. network down).
const FALLBACK: { state: string } = { state: "TX" };

export interface RepLookupResult {
  state: string;
  district: string;
  representatives: Representative[];
  live?: boolean;
}

/* ── Congress.gov member list item ──────────────────────────────────────── */
interface ApiMember {
  bioguideId?: string;
  name?: string;
  partyName?: string;
  district?: number | string | null;
  url?: string;
  depiction?: { imageUrl?: string };
  terms?: { item?: Array<{ chamber?: string }> };
}

/** Congress.gov returns names "Last, First M." — flip to "First M. Last". */
function normalizeName(name: string): string {
  const i = name.indexOf(",");
  if (i === -1) return name.trim();
  const last = name.slice(0, i).trim();
  const rest = name.slice(i + 1).trim();
  return `${rest} ${last}`.replace(/\s+/g, " ").trim();
}

function partyOf(partyName?: string): Representative["party"] {
  if (partyName === "Republican") return "R";
  if (partyName === "Democratic" || partyName === "Democrat") return "D";
  return "I";
}

function isSenator(m: ApiMember): boolean {
  // Senators have no congressional district; House members do.
  const noDistrict = m.district == null || m.district === "";
  const lastChamber = m.terms?.item?.[m.terms.item.length - 1]?.chamber ?? "";
  return noDistrict || lastChamber === "Senate";
}

/* ── Resolve a ZIP code to its real state via a free, keyless geocoder ───── */
// Only 10 ZIP3 prefixes have curated district data (ZIP_DISTRICTS below); for
// every other ZIP we still need the *correct* state so we don't show a
// stranger's senators. zippopotam.us is a stable, free, no-key US ZIP lookup.
async function geocodeZipToState(zip: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { places?: Array<{ "state abbreviation"?: string }> };
    return data.places?.[0]?.["state abbreviation"] ?? null;
  } catch (err) {
    console.error("geocodeZipToState failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Try to fetch live member data from Congress.gov ────────────────────── */
// The /member endpoint does NOT honor statecode/chamber query params — the
// correct pattern is the path segment /member/{stateCode}, then partition by
// each member's actual chamber/district.
async function fetchMembersFromCongress(
  state: string,
  district: string,
): Promise<Representative[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `${API_BASE}/member/${state}?api_key=${apiKey}&currentMember=true&limit=60&format=json`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { members?: ApiMember[] };
    const members = data.members ?? [];

    const senators = members.filter(isSenator).slice(0, 2);
    const houseRep = district
      ? members.find((m) => !isSenator(m) && String(m.district ?? "") === district)
      : undefined;

    const reps: Representative[] = [];

    if (houseRep) {
      reps.push({
        name: normalizeName(houseRep.name ?? ""),
        chamber: "House",
        party: partyOf(houseRep.partyName),
        state,
        district,
        contactUrl: houseRep.url ?? "https://www.house.gov",
        bioguideId: houseRep.bioguideId,
        photoUrl: houseRep.depiction?.imageUrl,
      });
    }

    for (const m of senators) {
      reps.push({
        name: normalizeName(m.name ?? ""),
        chamber: "Senate",
        party: partyOf(m.partyName),
        state,
        contactUrl: m.url ?? "https://www.senate.gov",
        bioguideId: m.bioguideId,
        photoUrl: m.depiction?.imageUrl,
      });
    }

    // Require both senators to consider this a complete live result.
    return senators.length === 2 ? reps : [];
  } catch (err) {
    console.error("fetchMembersFromCongress failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function lookupByZip(zip: string): Promise<RepLookupResult> {
  const prefix = zip.trim().slice(0, 3);
  const info = ZIP_DISTRICTS[prefix];

  // We only have a precise House district for 10 curated ZIP3 prefixes. For
  // every other ZIP, geocode to the *real* state rather than defaulting to
  // Texas — showing a stranger's senators is worse than showing no House rep.
  const state = info?.state ?? (await geocodeZipToState(zip)) ?? FALLBACK.state;
  const district = info?.state === state ? info.district : "";

  // Try live Congress.gov data (accurate senators + photos)
  const liveReps = await fetchMembersFromCongress(state, district);
  const liveSenators = liveReps.filter((r) => r.chamber === "Senate");
  const liveHouse = district ? liveReps.find((r) => r.chamber === "House") : undefined;

  if (liveSenators.length === 2) {
    // Use the live House rep if matched, otherwise fill from curated data
    // (only when we trust the district), otherwise omit it entirely.
    const houseRep = liveHouse ?? (district ? info?.houseRep : undefined);
    const representatives = houseRep ? [houseRep, ...liveSenators] : liveSenators;
    return { state, district, representatives, live: true };
  }

  // Fall back to curated static data — only trustworthy for states we've
  // curated senators for. Otherwise return no representatives rather than
  // silently showing another state's people.
  const senators = STATE_SENATORS[state];
  if (!senators) return { state, district, representatives: [], live: false };
  const houseRep = district ? info?.houseRep : undefined;
  return {
    state,
    district,
    representatives: houseRep ? [houseRep, ...senators] : senators,
    live: false,
  };
}
