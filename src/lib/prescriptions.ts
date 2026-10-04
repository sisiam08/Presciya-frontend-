import { Prescription } from "@/types";


export const normalizePrescription = (p: any): Prescription => ({
  ...p,
  medicines: (p?.prescriptionMedicines ?? p?.medicines ?? []).map((m: any) => ({
    ...m,
    brandName: m.brandName ?? m.snapshotBrandName,
    generic: m.generic ?? m.snapshotGeneric,
    strength: m.strength ?? m.snapshotStrength,
    type: m.type ?? m.snapshotType,
    frequency: m.frequency ?? m.dosagePattern,
  })),
});

export const normalizePrescriptions = (list: any[]): Prescription[] =>
  (list || []).map(normalizePrescription);
