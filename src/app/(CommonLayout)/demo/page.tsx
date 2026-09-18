// src/app/demo/page.tsx
"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Textarea import is correct
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Plus, Trash2, Printer, Check, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MockMedicine {
  brandName: string;
  genericName: string;
  strength: string;
}

const MOCK_MEDICINES: MockMedicine[] = [
  { brandName: "Napa Extend", genericName: "Paracetamol", strength: "665mg" },
  { brandName: "Seclo", genericName: "Omeprazole", strength: "20mg" },
  { brandName: "Sergel", genericName: "Esomeprazole", strength: "20mg" },
  {
    brandName: "Fexo",
    genericName: "Fexofenadine Hydrochloride",
    strength: "120mg",
  },
  {
    brandName: "Alatrol",
    genericName: "Cetirizine Hydrochloride",
    strength: "10mg",
  },
  { brandName: "Zimax", genericName: "Azithromycin", strength: "500mg" },
];

interface PrescriptionMedicine {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosage: string; // e.g. 1+0+1
  duration: string; // e.g. 7 days
  instruction: string; // e.g. After meal
}

export default function DemoPage() {
  const { toast } = useToast();
  // Form state
  const [patientName, setPatientName] = useState("Rahim Uddin");
  const [patientAge, setPatientAge] = useState("45");
  const [patientGender, setPatientGender] = useState("Male");
  const [bp, setBp] = useState("120/80");
  const [weight, setWeight] = useState("70");

  const [complaints, setComplaints] = useState(
    "Fever for 3 days\nSevere headache",
  );
  const [diagnosis, setDiagnosis] = useState("Viral Fever");

  // Medicine selector state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<
    PrescriptionMedicine[]
  >([
    {
      id: "1",
      brandName: "Napa Extend",
      genericName: "Paracetamol",
      strength: "665mg",
      dosage: "1+0+1",
      duration: "5 days",
      instruction: "After meal",
    },
    {
      id: "2",
      brandName: "Seclo",
      genericName: "Omeprazole",
      strength: "20mg",
      dosage: "1+0+1",
      duration: "7 days",
      instruction: "Before meal",
    },
  ]);

  const [dosage, setDosage] = useState("1+0+1");
  const [duration, setDuration] = useState("5 days");
  const [instruction, setInstruction] = useState("After meal");

  // Autocomplete suggestion click
  const handleAddMedicine = (med: MockMedicine) => {
    const newMed: PrescriptionMedicine = {
      id: Math.random().toString(),
      brandName: med.brandName,
      genericName: med.genericName,
      strength: med.strength,
      dosage,
      duration,
      instruction,
    };
    setSelectedMedicines([...selectedMedicines, newMed]);
    setSearchTerm("");
    toast({
      title: "Added Medicine",
      description: `${med.brandName} added to the prescription list.`,
      variant: "success",
    });
  };

  const handleRemoveMedicine = (id: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== id));
  };

  // Section 24.6: the public demo is interactive but must never allow real
  // printing or downloading. Explain instead of rendering an output.
  const handlePrint = () => {
    toast({
      title: "Printing disabled in the demo",
      description:
        "This is a sandbox with fictional data. Create a free account to print or download real prescriptions.",
      variant: "default",
    });
  };

  const filteredMock = MOCK_MEDICINES.filter(
    (m) =>
      m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Prescription Builder (Sandbox Demo)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Test out our high-speed prescription writing workflow. No data is
            saved.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="gap-2"
          title="Printing is disabled in the sandbox demo"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF (demo)
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Interactive Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Patient & Vitals Information</CardTitle>
              <CardDescription>
                Enter primary credentials and check vital metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="patientAge">Age</Label>
                    <Input
                      id="patientAge"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="patientGender">Gender</Label>
                    <Input
                      id="patientGender"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="bp">Blood Pressure (BP)</Label>
                  <Input
                    id="bp"
                    value={bp}
                    placeholder="e.g. 120/80"
                    onChange={(e) => setBp(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    value={weight}
                    placeholder="e.g. 70"
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Complaints & Clinical Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="complaints">Chief Complaints</Label>
                <Textarea
                  id="complaints"
                  className="min-h-20"
                  value={complaints}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComplaints(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="diagnosis">Diagnosis / Clinical Note</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Add Medication Rx</CardTitle>
              <CardDescription>
                Search DGDA approved database and define dosage instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label htmlFor="search">
                  Search Medicine (Brand / Generic)
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    className="pl-9"
                    placeholder="Search e.g. Napa, Seclo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {filteredMock.length > 0 ? (
                      filteredMock.map((med) => (
                        <button
                          key={med.brandName}
                          onClick={() => handleAddMedicine(med)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 flex flex-col"
                        >
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {med.brandName}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              {med.strength}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {med.genericName}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No medicines found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="instruction">Instruction</Label>
                  <Input
                    id="instruction"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Rx Live Preview Sheet */}
        <div className="sticky top-20 print:relative print:top-0">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 min-h-175 flex flex-col justify-between text-gray-900 dark:text-gray-100 print:border-none print:shadow-none print:p-0">
            <div>
              <span className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Demo · Fictional data · Not a real prescription
              </span>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-primary/20 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Dr. S. M. A. Rahman
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MBBS, FCPS (Medicine)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chamber: Presciya Digital Chamber, Dhaka
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tracking-wider text-primary">
                    Presciya
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reg No: 789456
                  </p>
                </div>
              </div>

              {/* Patient Info Row */}
              <div className="grid grid-cols-4 gap-4 py-3 bg-primary/5 dark:bg-primary/10 px-4 rounded-lg my-4 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Patient:
                  </span>
                  <p className="font-semibold">{patientName || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Age / Gender:
                  </span>
                  <p className="font-semibold">
                    {patientAge || "—"} Yrs / {patientGender || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">BP:</span>
                  <p className="font-semibold">{bp || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Weight:
                  </span>
                  <p className="font-semibold">
                    {weight ? `${weight} kg` : "—"}
                  </p>
                </div>
              </div>

              {/* Prescription Body split */}
              <div className="grid grid-cols-3 gap-6 pt-2">
                {/* Left col: Complaints & Notes */}
                <div className="col-span-1 border-r border-gray-100 dark:border-gray-800 pr-4 text-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-primary mb-1">
                      Chief Complaints
                    </h4>
                    <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
                      {complaints || "No complaints recorded."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary mb-1">Diagnosis</h4>
                    <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                      {diagnosis || "No diagnosis recorded."}
                    </p>
                  </div>
                </div>

                {/* Right col: Rx Medications */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                    <span className="text-xl font-serif text-primary font-bold">
                      R<sub>x</sub>
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Medications
                    </span>
                  </div>
                  {selectedMedicines.length > 0 ? (
                    <ul className="space-y-4">
                      {selectedMedicines.map((med, index) => (
                        <li
                          key={med.id}
                          className="group relative flex justify-between items-start text-sm"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-semibold text-gray-500">
                                {index + 1}.
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {med.brandName}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({med.strength})
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 italic pl-5">
                              {med.genericName}
                            </p>
                            <p className="text-xs font-semibold text-primary pl-5">
                              {med.dosage} — {med.duration}{" "}
                              <span className="font-normal text-gray-500">
                                ({med.instruction})
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveMedicine(med.id)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic text-center py-6">
                      No medicines added. Use the form to search and add.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-8 flex justify-between items-end text-[10px] text-gray-400">
              <div>
                <p>Prescribed using Presciya SaaS</p>
                <p>Verify QR code for authentication.</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center rounded">
                <span className="text-[8px] font-bold">QR Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
