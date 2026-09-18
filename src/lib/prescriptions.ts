import { Prescription } from "@/types";

/**
 * The API returns medicine lines as `prescriptionMedicines` using snapshot*
 * columns (snapshotBrandName, snapshotGeneric, …). The UI expects the
 * `medicines` shape with brandName/generic/strength/type. Normalising in one
 * place keeps the list, detail and builder views consistent.
 */
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
