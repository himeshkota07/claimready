import { CitizenProfile } from "./types";
import { generateSyntheticCitizens } from "./citizen-generator";

// Five hand-authored "flagship" profiles, one per failure mode called out in
// the plan doc — kept exact and referenced by UAN in the README/demo script.
// All data synthetic. No real Aadhaar/PAN/bank numbers used anywhere.
const FLAGSHIP_CITIZENS: CitizenProfile[] = [
  {
    id: "citizen-a",
    label: "Citizen A",
    displayName: "Ramesh Kumar Sinha",
    failureMode: "Name mismatch on both Aadhaar and bank records (2 issues)",
    uan: "100200300401",
    password: "demo123",
    desiredClaim: "19",
    record: {
      uan: "100200300401",
      nameOnEpfo: "Ramesh K. Sinha",
      nameOnAadhaar: "Kavita Sinha",
      nameOnBank: "Suchitra Sinha",
      dob: "1985-04-12",
      dateOfJoining: "2014-06-01",
      dateOfExit: "2026-05-15",
      employerApprovedExit: true,
      serviceYears: 11.9,
      aadhaarLinked: true,
      aadhaarVerified: true,
      panLinked: true,
      bankAccountNumber: "91100024521",
      bankIfsc: "SBIN0001234",
      bankSeeded: true,
      epsMemberSince: "2014-06-01",
      mobile: "9800XXXX21",
    },
  },
  {
    id: "citizen-b",
    label: "Citizen B",
    displayName: "Fathima Beevi",
    failureMode: "Wrong or invalid IFSC",
    uan: "100200300402",
    password: "demo123",
    desiredClaim: "19",
    record: {
      uan: "100200300402",
      nameOnEpfo: "Fathima Beevi",
      nameOnAadhaar: "Fathima Beevi",
      nameOnBank: "Fathima Beevi",
      dob: "1990-11-02",
      dateOfJoining: "2016-02-10",
      dateOfExit: "2026-06-01",
      employerApprovedExit: true,
      serviceYears: 10.3,
      aadhaarLinked: true,
      aadhaarVerified: true,
      panLinked: true,
      bankAccountNumber: "91100037788",
      bankIfsc: "SBIN1001234", // invalid: 5th character must be a literal "0"
      bankSeeded: false,
      epsMemberSince: "2016-02-10",
      mobile: "9711XXXX88",
    },
  },
  {
    id: "citizen-c",
    label: "Citizen C",
    displayName: "Suresh Gowda",
    failureMode: "Employer hasn't approved exit, bank KYC not seeded (2 issues)",
    uan: "100200300403",
    password: "demo123",
    desiredClaim: "19",
    record: {
      uan: "100200300403",
      nameOnEpfo: "Suresh Gowda",
      nameOnAadhaar: "Suresh Gowda",
      nameOnBank: "Suresh Gowda",
      dob: "1988-01-20",
      dateOfJoining: "2012-08-01",
      dateOfExit: null,
      employerApprovedExit: false,
      serviceYears: 13.5,
      aadhaarLinked: true,
      aadhaarVerified: true,
      panLinked: true,
      bankAccountNumber: "91100053390",
      bankIfsc: "HDFC0002233",
      bankSeeded: false,
      epsMemberSince: "2012-08-01",
      mobile: "9900XXXX90",
    },
  },
  {
    id: "citizen-d",
    label: "Citizen D",
    displayName: "Priya Nair",
    failureMode: "KYC incomplete",
    uan: "100200300404",
    password: "demo123",
    desiredClaim: "31",
    advanceCategory: "medical",
    record: {
      uan: "100200300404",
      nameOnEpfo: "Priya Nair",
      nameOnAadhaar: "Priya Nair",
      nameOnBank: "Priya Nair",
      dob: "1993-07-08",
      dateOfJoining: "2018-03-01",
      dateOfExit: null,
      employerApprovedExit: false,
      serviceYears: 8.2,
      aadhaarLinked: false,
      aadhaarVerified: false,
      panLinked: false,
      bankAccountNumber: "91100065567",
      bankIfsc: "ICIC0004455",
      bankSeeded: false,
      epsMemberSince: "2018-03-01",
      mobile: "9822XXXX67",
    },
  },
  {
    id: "citizen-e",
    label: "Citizen E",
    displayName: "Arjun Mehta",
    failureMode: "Clean case — passes pre-flight",
    uan: "100200300405",
    password: "demo123",
    desiredClaim: "19",
    record: {
      uan: "100200300405",
      nameOnEpfo: "Arjun Mehta",
      nameOnAadhaar: "Arjun Mehta",
      nameOnBank: "Arjun Mehta",
      dob: "1991-09-25",
      dateOfJoining: "2015-01-12",
      dateOfExit: "2026-04-30",
      employerApprovedExit: true,
      serviceYears: 11.3,
      aadhaarLinked: true,
      aadhaarVerified: true,
      panLinked: true,
      bankAccountNumber: "91100079012",
      bankIfsc: "ICIC0001122",
      bankSeeded: true,
      epsMemberSince: "2015-01-12",
      mobile: "9911XXXX05",
    },
  },
];

// Seed is fixed so the generated pool is stable across builds/deploys —
// a real "database" for the demo, not a fresh shuffle every page load.
const SYNTHETIC_SEED = 20260823;
const SYNTHETIC_COUNT = 45;

export const SYNTHETIC_CITIZENS: CitizenProfile[] = generateSyntheticCitizens(SYNTHETIC_COUNT, SYNTHETIC_SEED);

export const CITIZENS: CitizenProfile[] = [...FLAGSHIP_CITIZENS, ...SYNTHETIC_CITIZENS];

export const FEATURED_UANS = FLAGSHIP_CITIZENS.map((c) => c.uan);

export function getCitizenByUanAndPassword(
  uan: string,
  password: string
): CitizenProfile | null {
  const citizen = CITIZENS.find((c) => c.uan === uan);
  if (!citizen) return null;
  if (citizen.password !== password) return null;
  return citizen;
}

export function getCitizenByUan(uan: string): CitizenProfile | null {
  return CITIZENS.find((c) => c.uan === uan) ?? null;
}

export function searchCitizens(query: string, limit = 25): CitizenProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIZENS.slice(0, limit);
  return CITIZENS.filter(
    (c) => c.displayName.toLowerCase().includes(q) || c.uan.includes(q)
  ).slice(0, limit);
}
