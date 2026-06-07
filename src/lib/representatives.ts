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

const FALLBACK: { senators: Representative[]; houseRep: Representative; state: string; district: string } = {
  state: "TX",
  district: "21",
  senators: TX_SENATORS,
  houseRep: ZIP_DISTRICTS["787"].houseRep,
};

export interface RepLookupResult {
  state: string;
  district: string;
  representatives: Representative[];
  live?: boolean;
}

/* ── Try to fetch live member data from Congress.gov ────────────────────── */
async function fetchMembersFromCongress(
  state: string,
  district: string,
): Promise<Representative[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  try {
    const [senatorsRes, houseRes] = await Promise.allSettled([
      fetch(
        `${API_BASE}/member?api_key=${apiKey}&statecode=${state}&chamber=Senate&currentMember=true&format=json&limit=5`,
        { headers: { Accept: "application/json" }, cache: "no-store" },
      ),
      fetch(
        `${API_BASE}/member?api_key=${apiKey}&statecode=${state}&chamber=House&currentMember=true&format=json&limit=60`,
        { headers: { Accept: "application/json" }, cache: "no-store" },
      ),
    ]);

    const reps: Representative[] = [];

    if (senatorsRes.status === "fulfilled" && senatorsRes.value.ok) {
      const data = await senatorsRes.value.json();
      for (const m of (data.members ?? []).slice(0, 2)) {
        reps.push({
          name: m.name,
          chamber: "Senate",
          party: m.partyName === "Republican" ? "R" : m.partyName === "Democrat" ? "D" : "I",
          state,
          contactUrl: m.url ?? `https://www.senate.gov`,
          bioguideId: m.bioguideId,
          photoUrl: m.depiction?.imageUrl,
        });
      }
    }

    if (houseRes.status === "fulfilled" && houseRes.value.ok) {
      const data = await houseRes.value.json();
      const districtMembers = (data.members ?? []).filter(
        (m: { district?: number | string }) =>
          String(m.district ?? "") === district,
      );
      for (const m of districtMembers.slice(0, 1)) {
        reps.push({
          name: m.name,
          chamber: "House",
          party: m.partyName === "Republican" ? "R" : m.partyName === "Democrat" ? "D" : "I",
          state,
          district,
          contactUrl: m.url ?? `https://www.house.gov`,
          bioguideId: m.bioguideId,
          photoUrl: m.depiction?.imageUrl,
        });
      }
    }

    return reps;
  } catch {
    return [];
  }
}

export async function lookupByZip(zip: string): Promise<RepLookupResult> {
  const prefix = zip.trim().slice(0, 3);
  const info = ZIP_DISTRICTS[prefix];
  const state = info?.state ?? FALLBACK.state;
  const district = info?.district ?? FALLBACK.district;

  // Try live Congress.gov data
  const liveReps = await fetchMembersFromCongress(state, district);
  if (liveReps.length >= 2) {
    return { state, district, representatives: liveReps, live: true };
  }

  // Fall back to curated static data
  const senators = STATE_SENATORS[state] ?? FALLBACK.senators;
  const houseRep = info?.houseRep ?? FALLBACK.houseRep;
  return {
    state,
    district,
    representatives: [houseRep, ...senators],
    live: false,
  };
}
