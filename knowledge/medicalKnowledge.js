const medicalKnowledge = [
  {
    id: "shock-protocol-basic",
    title: "Shock protocol basic",
    role: "all",
    content:
      "Shock indicators include hypotension, tachycardia, cool clammy skin, altered mentation. Initial treatment: oxygen, IV access, fluid resuscitation, monitor and transport."
  },
  {
    id: "cardiac-stemi",
    title: "STEMI chest pain protocol",
    role: "all",
    content:
      "STEMI suspected: 12-lead ECG, aspirin 160-325 mg chewed if no contraindications, nitroglycerin if SBP > 100 and no PDE5 use, rapid transport to PCI-capable facility."
  },
  {
    id: "airway-basic",
    title: "Airway management basic",
    role: "all",
    content:
      "Basic airway management includes positioning, suction, OPA/NPA, BVM with oxygen, and monitoring for adequate chest rise."
  },
  {
    id: "airway-advanced",
    title: "Airway management advanced",
    role: "ACP",
    content:
      "Advanced airway options include supraglottic airway placement and endotracheal intubation with waveform capnography confirmation."
  },
  {
    id: "drug-epi",
    title: "Epinephrine dosing",
    role: "all",
    content:
      "Epinephrine adult anaphylaxis: 0.3-0.5 mg IM (1 mg/mL). Cardiac arrest: 1 mg IV/IO every 3-5 min."
  },
  {
    id: "drug-nitro",
    title: "Nitroglycerin dosing",
    role: "all",
    content:
      "Nitroglycerin 0.4 mg SL every 5 minutes for chest pain if SBP > 100, no PDE5 use, and no RV infarct suspected."
  },
  {
    id: "peds-vitals",
    title: "Pediatric vital sign ranges",
    role: "all",
    content:
      "Pediatric vitals vary by age. For toddlers: HR 90-150, RR 22-37, SBP 86-106. Use local protocol charts for exact ranges."
  },
  {
    id: "stroke-assessment",
    title: "Stroke assessment",
    role: "all",
    content:
      "Use FAST or Cincinnati Prehospital Stroke Scale. Determine last known well and transport to stroke-capable facility."
  },
  {
    id: "overdose-protocol",
    title: "Opioid overdose",
    role: "all",
    content:
      "Opioid overdose: support airway/ventilation, administer naloxone per protocol, monitor for recurrent respiratory depression."
  },
  {
    id: "muskoka-hospitals",
    title: "Muskoka area hospitals",
    role: "all",
    content:
      "Huntsville District Memorial Hospital, South Muskoka Memorial Hospital (Bracebridge)."
  }
];

module.exports = { medicalKnowledge };
