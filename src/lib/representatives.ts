import type { Representative } from "./types";

// MVP lookup uses a curated dataset keyed by zip prefix. A production build would
// swap this for a geocoding + district API (e.g. Census geocoder -> Congress.gov
// member endpoint). The shape returned here is identical, so only this function changes.

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
}

export function lookupByZip(zip: string): RepLookupResult {
  const prefix = zip.trim().slice(0, 3);
  const info = ZIP_DISTRICTS[prefix];

  if (info) {
    const senators = info.state === "TX" ? TX_SENATORS : FALLBACK.senators;
    return {
      state: info.state,
      district: info.district,
      representatives: [info.houseRep, ...senators],
    };
  }

  return {
    state: FALLBACK.state,
    district: FALLBACK.district,
    representatives: [FALLBACK.houseRep, ...FALLBACK.senators],
  };
}
