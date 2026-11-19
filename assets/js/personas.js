// "View as" personas. Each walkthrough step belongs to one; switching jumps to that persona's screen.

export const PERSONAS = [
  { id: "panel", name: "CBQ evaluation panel", role: "Reviewer", org: "The Commercial Bank", home: "overview" },
  { id: "admin", name: "Rashid Al-Kuwari", role: "Net Banking administrator", org: "Al Noor Trading W.L.L.", home: "onboard" },
  { id: "officer", name: "Sara Hamad", role: "Onboarding officer (maker)", org: "CBQ Wholesale Banking", home: "approve" },
  { id: "basis", name: "SAP Basis team", role: "Connector administrator", org: "Al Noor Trading IT", home: "activate" },
  { id: "maker", name: "Fadi Haddad", role: "AP accountant · SAP maker", org: "Al Noor Trading W.L.L.", home: "pay" },
  { id: "checker", name: "Mona Nasser", role: "Finance manager · SAP checker", org: "Al Noor Trading W.L.L.", home: "release" },
  { id: "viewer", name: "Karim Rahman", role: "Treasury analyst", org: "Al Noor Trading W.L.L.", home: "recon" },
  { id: "ops", name: "CBQ operations", role: "Digital channels operations", org: "The Commercial Bank", home: "ops" },
];

export const personaById = (id) => PERSONAS.find((p) => p.id === id) || PERSONAS[0];

export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
