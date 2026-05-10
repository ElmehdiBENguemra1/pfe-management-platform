export const STUDENT_LEVELS = [
  { value: "L1",          label: "Licence 1 (L1)",               group: "Licence" },
  { value: "L2",          label: "Licence 2 (L2)",               group: "Licence" },
  { value: "L3",          label: "Licence 3 (L3)",               group: "Licence" },
  { value: "M1",          label: "Master 1 (M1)",                group: "Master" },
  { value: "M2",          label: "Master 2 (M2)",                group: "Master" },
  { value: "INGENIEUR_1", label: "Cycle Ingénieur — 1ère année", group: "Cycle Ingénieur" },
  { value: "INGENIEUR_2", label: "Cycle Ingénieur — 2ème année", group: "Cycle Ingénieur" },
  { value: "INGENIEUR_3", label: "Cycle Ingénieur — 3ème année", group: "Cycle Ingénieur" },
  { value: "PREPA_1",     label: "Prépa — 1ère année",           group: "Classes Préparatoires" },
  { value: "PREPA_2",     label: "Prépa — 2ème année",           group: "Classes Préparatoires" },
  { value: "BTS_1",       label: "BTS — 1ère année",             group: "BTS" },
  { value: "BTS_2",       label: "BTS — 2ème année",             group: "BTS" },
  { value: "DUT_1",       label: "DUT — 1ère année",             group: "DUT" },
  { value: "DUT_2",       label: "DUT — 2ème année",             group: "DUT" },
  { value: "DOCTORAT",    label: "Doctorat",                     group: "Doctorat" },
];

// Helper: get readable label from enum value
export const getLevelLabel = (value) =>
  STUDENT_LEVELS.find(l => l.value === value)?.label ?? value;
