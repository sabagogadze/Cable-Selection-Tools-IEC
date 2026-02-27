/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Zap, 
  Layers, 
  Ruler, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Settings2,
  Calculator,
  FileText,
  Languages,
  HelpCircle,
  Plus,
  Download,
  Trash2,
  Box,
  Package,
  Square,
  Copy,
  GripHorizontal,
  ArrowDownToLine,
  Wind,
  AlignJustify,
  List,
  ChevronDown,
  Check,
  Home,
  Building2,
  Factory,
  PenTool,
  X,
  Lightbulb,
  Fan,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  COPPER_PVC_3_LOADED, 
  COPPER_XLPE_3_LOADED, 
  ALUMINUM_PVC_3_LOADED,
  ALUMINUM_XLPE_3_LOADED,
  TEMP_CORRECTION_PVC, 
  TEMP_CORRECTION_XLPE, 
  GROUPING_CORRECTION, 
  VOLTAGE_DROP_FACTORS,
  InstallationMethod,
  InsulationType,
  ConductorMaterial
} from './constants';

// --- Translations ---

type Language = 'en' | 'ka';

const translations = {
  en: {
    title: "IEC 60364-5-52 Calculator",
    subtitle: "Professional wiring system sizing tool.",
    compliance: "Standard Compliance",
    recSize: "Recommended Size",
    loadParams: "Load Parameters",
    instEnv: "Installation Environment",
    cableRun: "Cable Run & Voltage Drop",
    analysis: "Analysis Results",
    power: "Load Power (kW)",
    voltage: "System Voltage (V)",
    pf: "Power Factor (cos φ)",
    phase: "Phase Configuration",
    singlePhase: "Single Phase",
    threePhase: "Three Phase",
    insulation: "Insulation Material",
    method: "Installation Method",
    ambient: "Ambient Temp (°C)",
    grouping: "Grouped Circuits",
    length: "Route Length (m)",
    maxVD: "Max Allowed Drop (%)",
    designCurrent: "Design Current (Ib)",
    correctedCurrent: "Corrected Current (It)",
    minSizeCap: "Min Size (Capacity)",
    minSizeVD: "Min Size (Voltage Drop)",
    minSizeSC: "Min Size (Short Circuit)",
    vd: "Voltage Drop (ΔV)",
    effCap: "Effective Capacity (Iz)",
    vdWarning: "Voltage Drop Warning",
    vdWarningDesc: "The selected cable size exceeds the maximum allowed voltage drop. Consider increasing cable size.",
    complianceVerified: "Compliance Verified",
    complianceDesc: "The selected cable satisfies both capacity and voltage drop requirements.",
    references: "Standard References",
    footer: "Industrial Grade Tool",
    disclaimer: "Values are representative. Verify with local regulations.",
    instructionsTitle: "How to use the calculator",
    watchTutorial: "Watch Tutorial",
    tutorialTitle: "How it works",
    lineName: "Line Name",
    shortCircuit: "Expected Short Circuit (kA)",
    disconnectionTime: "Disconnection Time (s)",
    missingFields: "Please fill in all required fields:",
    addToProject: "Add to Project",
    exportExcel: "Export to Excel",
    exportPdf: "Export to PDF",
    projectList: "Project Lines",
    recommendedBreaker: "Recommended Breaker",
    instructions: [
      "Step 1: Enter the load power in kilowatts (kW).",
      "Step 2: Select the phase configuration (Single Phase or Three Phase).",
      "Step 3: Specify conductor material (Copper or Aluminum) and insulation type.",
      "Step 4: Choose the installation method that best matches your conditions.",
      "Step 5: Adjust ambient temperature and the number of grouped circuits.",
      "Step 6: Enter the cable route length and maximum allowed voltage drop.",
      "Note: If cable capacity is insufficient, increase the number of parallel conductors."
    ],
    conductor: "Conductor Material",
    copper: "Copper",
    aluminum: "Aluminum",
    parallel: "Parallel Conductors (per phase)",
    parallelDesc: "Manually select the number of parallel conductors per phase.",
    insufficientCapacity: "Insufficient Capacity",
    insufficientCapacityDesc: "The maximum cable size (300mm²) with the selected parallel count is not enough for the load. Please increase the number of parallel conductors.",
    methods: {
      A1: "A1 - Insulated conductors in conduit (Thermal Wall)",
      A2: "A2 - Multi-core cable in conduit (Thermal Wall)",
      B1: "B1 - Insulated conductors in conduit (On wall surface)",
      B2: "B2 - Multi-core cable in conduit (On wall surface)",
      C: "C - Cable directly on wall (Open)",
      D: "D - Cable in ground ducts",
      E: "E - Multi-core cable in free air",
      F: "F - Single-core cables, touching (Air)",
      G: "G - Single-core cables, spaced (Air)"
    },
    scPresets: {
      residential: "Residential (1 kA)",
      commercial: "Commercial (3 kA)",
      industrial: "Industrial (6 kA)",
      custom: "Calculate / Custom"
    },
    pfPresets: {
      resistive: "Heater/Incandescent (1.0)",
      mixed: "Mixed Load (0.9)",
      motor: "Motor/Inductive (0.8)",
      custom: "Custom Value"
    },
    scCalc: {
      title: "Short Circuit Calculator",
      desc: "Estimate short circuit current based on transformer size and line impedance.",
      trPower: "Transformer Power (kVA)",
      trImpedance: "Transformer Impedance (%)",
      voltage: "System Voltage (V)",
      calculate: "Calculate & Apply",
      cancel: "Cancel"
    },
    tooltips: {
      power: "Total active power of the load in kilowatts.",
      voltage: "Nominal system voltage (220V for 1-phase, 380V for 3-phase).",
      pf: "Ratio of real power to apparent power (typically 0.8 - 0.95).",
      phase: "Number of energized conductors in the system.",
      insulation: "Thermal rating of the cable insulation (PVC: 70°C, XLPE: 90°C).",
      method: "How the cable is physically installed (conduit, air, wall, etc.).",
      ambient: "Temperature of the surrounding air or ground.",
      grouping: "Number of adjacent circuits affecting heat dissipation.",
      length: "Total distance of the cable run from source to load.",
      maxVD: "Maximum permissible voltage loss (typically 3% for lighting, 5% for power).",
      lineName: "Identifier for this specific circuit or line.",
      shortCircuit: "Expected short circuit current at the installation point in kiloamperes (kA).",
      disconnectionTime: "Time it takes for the breaker to clear the fault. Typically 0.01 - 0.02s for MCBs."
    }
  },
  ka: {
    title: "IEC 60364-5-52 კალკულატორი",
    subtitle: "გაყვანილობის სისტემის გაანგარიშების პროფესიონალური ინსტრუმენტი.",
    compliance: "სტანდარტებთან შესაბამისობა",
    recSize: "რეკომენდებული კვეთა",
    loadParams: "დატვირთვის პარამეტრები",
    instEnv: "ინსტალაციის გარემო",
    cableRun: "კაბელის სიგრძე და ძაბვის ვარდნა",
    analysis: "ანალიზის შედეგები",
    power: "დატვირთვის სიმძლავრე (კვტ)",
    voltage: "სისტემის ძაბვა (V)",
    pf: "სიმძლავრის კოეფიციენტი (cos φ)",
    phase: "ფაზების კონფიგურაცია",
    singlePhase: "ერთფაზა",
    threePhase: "სამფაზა",
    insulation: "იზოლაციის მასალა",
    method: "ინსტალაციის მეთოდი",
    ambient: "გარემოს ტემპერატურა (°C)",
    grouping: "დაჯგუფებული წრედები",
    length: "მარშრუტის სიგრძე (მ)",
    maxVD: "მაქს. დასაშვები ვარდნა (%)",
    designCurrent: "საპროექტო დენი (Ib)",
    correctedCurrent: "კორექტირებული დენი (It)",
    minSizeCap: "მინ. კვეთა (გამტარობა)",
    minSizeVD: "მინ. კვეთა (ძაბვის ვარდნა)",
    minSizeSC: "მინ. კვეთა (მოკლე ჩართვა)",
    vd: "ძაბვის ვარდნა (ΔV)",
    effCap: "ეფექტური გამტარობა (Iz)",
    vdWarning: "ძაბვის ვარდნის გაფრთხილება",
    vdWarningDesc: "შერჩეული კაბელის კვეთა აჭარბებს ძაბვის მაქსიმალურ დასაშვებ ვარდნას. განიხილეთ კვეთის გაზრდა.",
    complianceVerified: "შესაბამისობა დადასტურებულია",
    complianceDesc: "შერჩეული კაბელი აკმაყოფილებს როგორც გამტარობის, ისე ძაბვის ვარდნის მოთხოვნებს.",
    references: "სტანდარტული მითითებები",
    footer: "ინდუსტრიული დონის ხელსაწყო",
    disclaimer: "მნიშვნელობები საორიენტაციოა. გადაამოწმეთ ადგილობრივ რეგულაციებთან.",
    instructionsTitle: "როგორ გამოვიყენოთ კალკულატორი",
    watchTutorial: "ნახეთ ინსტრუქცია",
    tutorialTitle: "როგორ მუშაობს",
    lineName: "ხაზის დასახელება",
    shortCircuit: "მოსალოდნელი მოკლე ჩართვა (kA)",
    disconnectionTime: "გათიშვის დრო (წმ)",
    missingFields: "გთხოვთ შეავსოთ ყველა სავალდებულო ველი:",
    addToProject: "პროექტში დამატება",
    exportExcel: "ექსელში ექსპორტი",
    exportPdf: "PDF ექსპორტი",
    projectList: "პროექტის ხაზები",
    recommendedBreaker: "რეკომენდირებული ამომრთველი",
    instructions: [
      "ნაბიჯი 1: შეიყვანეთ დატვირთვის სიმძლავრე კილოვატებში (კვტ).",
      "ნაბიჯი 2: აირჩიეთ ფაზების რაოდენობა (ერთფაზა ან სამფაზა).",
      "ნაბიჯი 3: მიუთითეთ გამტარის მასალა (სპილენძი ან ალუმინი) და იზოლაციის ტიპი.",
      "ნაბიჯი 4: აირჩიეთ ინსტალაციის მეთოდი, რომელიც საუკეთესოდ შეესაბამება თქვენს პირობებს.",
      "ნაბიჯი 5: დაარეგულირეთ გარემოს ტემპერატურა და დაჯგუფებული წრედების რაოდენობა.",
      "ნაბიჯი 6: შეიყვანეთ კაბელის სიგრძე და მაქსიმალური დასაშვები ძაბვის ვარდნა.",
      "შენიშვნა: თუ კაბელის გამტარობა არ არის საკმარისი, გაზარდეთ პარალელური გამტარების რაოდენობა."
    ],
    conductor: "გამტარის მასალა",
    copper: "სპილენძი",
    aluminum: "ალუმინი",
    parallel: "პარალელური გამტარები (ფაზაზე)",
    parallelDesc: "ხელით აირჩიეთ პარალელური გამტარების რაოდენობა თითო ფაზაზე.",
    insufficientCapacity: "არასაკმარისი გამტარობა",
    insufficientCapacityDesc: "მაქსიმალური კვეთა (300მმ²) არჩეული დაჯგუფებით არ არის საკმარისი დატვირთვისთვის. გთხოვთ გაზარდოთ პარალელური გამტარების რაოდენობა.",
    methods: {
      A1: "A1 - იზოლირებული გამტარები მილში (თერმოიზოლირებული კედელი)",
      A2: "A2 - მრავალძარღვიანი კაბელი მილში (თერმოიზოლირებული კედელი)",
      B1: "B1 - იზოლირებული გამტარები მილში (კედლის ზედაპირზე)",
      B2: "B2 - მრავალძარღვიანი კაბელი მილში (კედლის ზედაპირზე)",
      C: "C - კაბელი პირდაპირ კედელზე (ღიად)",
      D: "D - კაბელი მიწისქვეშა არხებში",
      E: "E - მრავალძარღვიანი კაბელი ღია ჰაერში",
      F: "F - ერთძარღვიანი კაბელები, შეხებით (ჰაერი)",
      G: "G - ერთძარღვიანი კაბელები, დაშორებით (ჰაერი)"
    },
    scPresets: {
      residential: "საცხოვრებელი (1 kA)",
      commercial: "კომერციული (3 kA)",
      industrial: "ინდუსტრიული (6 kA)",
      custom: "გამოთვლა / ხელით შეყვანა"
    },
    pfPresets: {
      resistive: "გამათბობელი/ტენი (1.0)",
      mixed: "შერეული დატვირთვა (0.9)",
      motor: "ძრავი/ინდუქციური (0.8)",
      custom: "ხელით შეყვანა"
    },
    scCalc: {
      title: "მოკლე ჩართვის კალკულატორი",
      desc: "გამოთვალეთ მოკლე ჩართვის დენი ტრანსფორმატორის სიმძლავრისა და წინაღობის მიხედვით.",
      trPower: "ტრანსფორმატორის სიმძლავრე (kVA)",
      trImpedance: "ტრანსფორმატორის წინაღობა (%)",
      voltage: "სისტემის ძაბვა (V)",
      calculate: "გამოთვლა და გამოყენება",
      cancel: "გაუქმება"
    },
    tooltips: {
      power: "დატვირთვის სრული აქტიური სიმძლავრე კილოვატებში.",
      voltage: "სისტემის ნომინალური ძაბვა (220V ერთფაზასთვის, 380V სამფაზასთვის).",
      pf: "აქტიური სიმძლავრის შეფარდება სრულ სიმძლავრესთან (ჩვეულებრივ 0.8 - 0.95).",
      phase: "სისტემაში არსებული ძაბვის ქვეშ მყოფი გამტარების რაოდენობა.",
      insulation: "კაბელის იზოლაციის თერმული მდგრადობა (PVC: 70°C, XLPE: 90°C).",
      method: "კაბელის ფიზიკური განთავსების ხერხი (მილში, ჰაერში, კედელზე და ა.შ.).",
      ambient: "გარემომცველი ჰაერის ან ნიადაგის ტემპერატურა.",
      grouping: "გვერდით განთავსებული წრედების რაოდენობა, რაც გავლენას ახდენს გაციებაზე.",
      length: "კაბელის სრული სიგრძე წყაროდან დატვირთვამდე.",
      maxVD: "ძაბვის მაქსიმალური დასაშვები დანაკარგი (ჩვეულებრივ 3% განათებისთვის, 5% ძალოვანი წრედებისთვის).",
      lineName: "ამ კონკრეტული წრედის ან ხაზის იდენტიფიკატორი.",
      shortCircuit: "მოსალოდნელი მოკლე ჩართვის დენი ინსტალაციის წერტილში კილოამპერებში (kA).",
      disconnectionTime: "დრო, რომელიც სჭირდება ამომრთველს მოკლე ჩართვის გასათიშად. MCB-სთვის (ავტომატისთვის) ჩვეულებრივ 0.01 - 0.02 წმ."
    }
  }
};

// --- Types ---

interface CalculationResult {
  loadCurrent: number;
  nominalBreaker: number;
  correctedCurrent: number;
  minSizeByCapacity: number;
  minSizeByVoltageDrop: number;
  minSizeByShortCircuit: number;
  finalSize: number;
  parallelCount: number;
  voltageDrop: number;
  voltageDropPercent: number;
  capacityAtSelectedSize: number;
  cableName: string;
  isCapacityInsufficient: boolean;
  recommendedBreaker: string;
}

interface ProjectLine {
  id: string;
  name: string;
  power: number;
  voltage: number;
  powerFactor: number;
  phase: string;
  conductor: string;
  insulation: string;
  method: string;
  length: number;
  maxVDrop: number;
  shortCircuit: number | '';
  designCurrent: number;
  cableName: string;
  voltageDrop: number;
  voltageDropPercent: number;
  recommendedBreaker: string;
}

const BREAKER_SIZES = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300];

// --- Components ---

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <HelpCircle className="w-3 h-3 text-zinc-500 cursor-help hover:text-emerald-500 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-zinc-800 text-[10px] text-zinc-200 rounded shadow-xl border border-zinc-700 z-50 leading-tight">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800" />
    </div>
  </div>
);

const Label = ({ children, tooltip, className = "" }: { children: React.ReactNode; tooltip?: string; className?: string }) => (
  <div className={`mb-1 flex items-center ${className}`}>
    <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">
      {children}
    </label>
    {tooltip && <Tooltip text={tooltip} />}
  </div>
);

const Input = ({ value, onChange, type = "text", isValid, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (val: any) => void, isValid?: boolean }) => {
  const [displayValue, setDisplayValue] = useState<string>(value?.toString() || "");

  React.useEffect(() => {
    setDisplayValue(value?.toString() || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === "number") {
      if (val === "") {
        setDisplayValue("");
        onChange("");
        return;
      }
      const cleaned = val.replace(/^0+(?=\d)/, '');
      setDisplayValue(cleaned);
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    } else {
      setDisplayValue(val);
      onChange(val);
    }
  };

  return (
    <input
      {...props}
      type={type === "number" ? "text" : type} // Use text to avoid browser formatting issues with leading zeros
      inputMode={type === "number" ? "decimal" : undefined}
      value={displayValue}
      onChange={handleChange}
      className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed ${
        isValid === true 
          ? 'border-emerald-500/50 focus:ring-emerald-500/20' 
          : isValid === false 
            ? 'border-red-500/50 focus:ring-red-500/20' 
            : 'border-zinc-800 focus:ring-emerald-500/20 focus:border-emerald-500/50'
      }`}
    />
  );
};

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
  >
    {children}
  </select>
);

const MethodIcons: Record<string, React.ElementType> = {
  A1: Box,
  A2: Package,
  B1: Square,
  B2: Copy,
  C: GripHorizontal,
  D: ArrowDownToLine,
  E: Wind,
  F: AlignJustify,
  G: List
};

const MethodSelector = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: Record<string, string> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SelectedIcon = MethodIcons[value] || Box;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
      >
        <div className="flex items-center gap-3 truncate pr-2">
          <SelectedIcon className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="truncate text-left">{options[value]}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-[calc(100vw-3rem)] sm:w-[400px] -left-4 sm:left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-[40vh] sm:max-h-80 overflow-y-auto custom-scrollbar"
          >
            <div className="p-1">
              {Object.entries(options).map(([key, text]) => {
                const Icon = MethodIcons[key] || Box;
                const isSelected = key === value;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors hover:bg-zinc-800/80 ${isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-500' : 'text-zinc-500'}`} />
                    <span className="flex-1 leading-relaxed">{text}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CollapsibleInstructions = ({ title, instructions }: { title: string; instructions: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl overflow-hidden mt-12">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{title}</h2>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Layers className="w-3 h-3 text-zinc-500" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-2 space-y-3">
              {instructions.map((step, index) => (
                <div key={index} className="flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default function App() {
  // --- State ---
  const [lang, setLang] = useState<Language>('ka');
  const [lineName, setLineName] = useState<string>('');
  const [power, setPower] = useState<number | ''>('');
  const [pfMode, setPfMode] = useState<'resistive' | 'mixed' | 'motor' | 'custom'>('mixed');
  const [powerFactor, setPowerFactor] = useState<number | ''>(0.9);
  const [isThreePhase, setIsThreePhase] = useState<boolean>(true);
  const [conductor, setConductor] = useState<ConductorMaterial>('Copper');
  const [insulation, setInsulation] = useState<InsulationType>('XLPE');
  const [method, setMethod] = useState<InstallationMethod>('A1');
  const [ambientTemp, setAmbientTemp] = useState<number>(30);
  const [grouping, setGrouping] = useState<number>(1);
  const [parallelCount, setParallelCount] = useState<number>(1);
  const [length, setLength] = useState<number | ''>('');
  const [maxVDrop, setMaxVDrop] = useState<number | ''>('');
  const [shortCircuitMode, setShortCircuitMode] = useState<'residential' | 'commercial' | 'industrial' | 'custom'>('residential');
  const [shortCircuit, setShortCircuit] = useState<number | ''>(1);
  const [isScModalOpen, setIsScModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [trPower, setTrPower] = useState<number | ''>(400);
  const [trImpedance, setTrImpedance] = useState<number | ''>(4);
  const [disconnectionTime, setDisconnectionTime] = useState<number | ''>(0.02);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [projectLines, setProjectLines] = useState<ProjectLine[]>(() => {
    try {
      const saved = localStorage.getItem('iec_calculator_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load projects", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('iec_calculator_projects', JSON.stringify(projectLines));
  }, [projectLines]);

  const t = translations[lang];

  // Derived Voltage
  const voltage = isThreePhase ? 380 : 220;

  // Check if all required fields are filled
  const isLineNameValid = lineName !== '';
  const isPowerValid = power !== '' && (power as number) > 0;
  const isPfValid = powerFactor !== '' && (powerFactor as number) > 0 && (powerFactor as number) <= 1;
  const isLengthValid = length !== '' && (length as number) > 0;
  const isMaxVDropValid = maxVDrop !== '' && (maxVDrop as number) > 0;
  const isShortCircuitValid = shortCircuit !== '' && (shortCircuit as number) > 0;
  const isDisconnectionTimeValid = disconnectionTime !== '' && (disconnectionTime as number) > 0;

  const isFormComplete = isLineNameValid && isPowerValid && isPfValid && isLengthValid && isMaxVDropValid && isShortCircuitValid && isDisconnectionTimeValid;

  const handleScModeChange = (mode: 'residential' | 'commercial' | 'industrial' | 'custom') => {
    setShortCircuitMode(mode);
    if (mode === 'residential') setShortCircuit(1);
    else if (mode === 'commercial') setShortCircuit(3);
    else if (mode === 'industrial') setShortCircuit(6);
    else {
      setShortCircuit('');
      setIsScModalOpen(true);
    }
  };

  const handlePfModeChange = (mode: 'resistive' | 'mixed' | 'motor' | 'custom') => {
    setPfMode(mode);
    if (mode === 'resistive') setPowerFactor(1.0);
    else if (mode === 'mixed') setPowerFactor(0.9);
    else if (mode === 'motor') setPowerFactor(0.8);
    else setPowerFactor('');
  };

  const handleCalculateSC = () => {
    if (trPower !== '' && trImpedance !== '') {
      // Isc = (S * 1000) / (sqrt(3) * V * (Z/100)) for 3-phase
      // Simplified approximation at transformer secondary
      const v = isThreePhase ? 380 : 220;
      const isc = ((trPower as number) * 1000) / (Math.sqrt(3) * v * ((trImpedance as number) / 100));
      setShortCircuit(Number((isc / 1000).toFixed(2))); // Convert to kA
      setIsScModalOpen(false);
    }
  };

  const handleAddToProject = () => {
    if (!isFormComplete || !results) return;
    
    const newLine: ProjectLine = {
      id: Math.random().toString(36).substr(2, 9),
      name: lineName,
      power: power as number,
      voltage,
      powerFactor: powerFactor as number,
      phase: isThreePhase ? '3-Phase' : '1-Phase',
      conductor,
      insulation,
      method,
      length: length as number,
      maxVDrop: maxVDrop as number,
      shortCircuit,
      designCurrent: results.loadCurrent,
      cableName: results.cableName,
      voltageDrop: results.voltageDrop,
      voltageDropPercent: results.voltageDropPercent,
      recommendedBreaker: results.recommendedBreaker
    };

    setProjectLines([...projectLines, newLine]);
    
    // Reset form (keep project-wide settings like pf, maxVDrop, shortCircuit)
    setLineName('');
    setPower('');
    setLength('');
  };

  const handleExportExcel = () => {
    if (projectLines.length === 0) return;

    const wsData = projectLines.map(line => ({
      [lang === 'en' ? "Line Name" : "ხაზის დასახელება"]: line.name,
      [lang === 'en' ? "Power (kW)" : "სიმძლავრე (კვტ)"]: line.power,
      [lang === 'en' ? "Voltage (V)" : "ძაბვა (V)"]: line.voltage,
      [lang === 'en' ? "Power Factor" : "სიმძლავრის კოეფიციენტი"]: line.powerFactor,
      [lang === 'en' ? "Phase" : "ფაზა"]: line.phase,
      [lang === 'en' ? "Conductor" : "გამტარი"]: line.conductor,
      [lang === 'en' ? "Insulation" : "იზოლაცია"]: line.insulation,
      [lang === 'en' ? "Method" : "მეთოდი"]: line.method,
      [lang === 'en' ? "Length (m)" : "სიგრძე (მ)"]: line.length,
      [lang === 'en' ? "Max VDrop (%)" : "მაქს. ძაბვის ვარდნა (%)"]: line.maxVDrop,
      [lang === 'en' ? "Short Circuit (kA)" : "მოკლე ჩართვა (kA)"]: line.shortCircuit,
      [lang === 'en' ? "Design Current (A)" : "საპროექტო დენი (A)"]: line.designCurrent.toFixed(2),
      [lang === 'en' ? "Recommended Cable" : "რეკომენდირებული კაბელი"]: line.cableName,
      [lang === 'en' ? "Voltage Drop (V)" : "ძაბვის ვარდნა (V)"]: line.voltageDrop.toFixed(2),
      [lang === 'en' ? "Voltage Drop (%)" : "ძაბვის ვარდნა (%)"]: line.voltageDropPercent.toFixed(2),
      [lang === 'en' ? "Recommended Breaker" : "რეკომენდირებული ამომრთველი"]: line.recommendedBreaker
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Project Lines");
    XLSX.writeFile(wb, "Project_Lines.xlsx");
  };

  const handleExportPDF = async () => {
    if (projectLines.length === 0) return;
    setIsExportingPDF(true);
    
    try {
      const element = document.getElementById('pdf-report-content');
      if (!element) return;
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IEC_Cable_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const missingFields = useMemo(() => {
    const missing = [];
    if (!isLineNameValid) missing.push(t.lineName);
    if (!isPowerValid) missing.push(t.power);
    if (!isPfValid) missing.push(t.pf);
    if (!isLengthValid) missing.push(t.length);
    if (!isMaxVDropValid) missing.push(t.maxVD);
    if (!isShortCircuitValid) missing.push(t.shortCircuit);
    if (!isDisconnectionTimeValid) missing.push(t.disconnectionTime);
    return missing;
  }, [isLineNameValid, isPowerValid, isPfValid, isLengthValid, isMaxVDropValid, isShortCircuitValid, isDisconnectionTimeValid, t]);

  // --- Calculations ---
  const results = useMemo((): CalculationResult | null => {
    if (!isFormComplete) return null;

    const p = power as number;
    const pf = powerFactor as number;
    const l = length as number;
    const mvd = maxVDrop as number;
    const isc = shortCircuit as number;
    const getPESize = (phaseSize: number): number => {
      const mapping: Record<number, number> = {
        1.5: 1.5, 2.5: 2.5, 4: 4, 6: 6, 10: 10, 16: 16,
        25: 16, 35: 16, 50: 25, 70: 35, 95: 50, 120: 70,
        150: 70, 185: 95, 240: 120, 300: 150
      };
      return mapping[phaseSize] || Math.ceil(phaseSize / 2);
    };

    // 1. Calculate Load Current (Design Current Ib)
    let loadCurrent = 0;
    if (isThreePhase) {
      loadCurrent = (p * 1000) / (Math.sqrt(3) * voltage * pf);
    } else {
      loadCurrent = (p * 1000) / (voltage * pf);
    }

    // 2. Select Breaker (In) based on Design Current (Ib)
    // The rule is: Ib <= In <= Iz
    // So we pick the next standard breaker size that is >= loadCurrent
    const breaker = BREAKER_SIZES.find(b => b >= loadCurrent);
    const nominalBreaker = breaker || loadCurrent;

    // Determine Breaker Type (MCB vs MCCB) and Poles
    const poles = isThreePhase ? '3P' : '1P';
    let breakerType = 'MCB';
    if (nominalBreaker > 125) {
      breakerType = 'MCCB';
    } else if (nominalBreaker > 63) {
      // Between 63A and 125A can be either, but MCCB is more common for industrial
      breakerType = 'MCB/MCCB'; 
    }

    // 3. Correction Factors
    const tempTable = insulation === 'PVC' ? TEMP_CORRECTION_PVC : TEMP_CORRECTION_XLPE;
    const temps = Object.keys(tempTable).map(Number).sort((a, b) => a - b);
    const closestTemp = temps.reduce((prev, curr) => 
      Math.abs(curr - ambientTemp) < Math.abs(prev - ambientTemp) ? curr : prev
    );
    const kTemp = tempTable[closestTemp] || 1;
    const kGroup = GROUPING_CORRECTION[grouping] || GROUPING_CORRECTION[Object.keys(GROUPING_CORRECTION).length];
    
    // IEC 60364-5-52: 1-phase circuits (2 loaded conductors) dissipate less heat 
    // and have ~12% higher current capacity compared to 3-phase (3 loaded conductors)
    const kPhase = isThreePhase ? 1.0 : 1.12; 
    
    const totalCorrection = kTemp * kGroup * kPhase;
    
    // Cable must carry the breaker nominal current (In), not just load current (Ib)
    const correctedCurrent = nominalBreaker / totalCorrection;

    // 4. Size by Capacity
    let capacityTable;
    if (conductor === 'Copper') {
      capacityTable = insulation === 'PVC' ? COPPER_PVC_3_LOADED : COPPER_XLPE_3_LOADED;
    } else {
      capacityTable = insulation === 'PVC' ? ALUMINUM_PVC_3_LOADED : ALUMINUM_XLPE_3_LOADED;
    }
    
    const methodCapacities = capacityTable[method];
    
    // Find size based on manual parallel count
    const targetPerCable = correctedCurrent / parallelCount;
    const sizeMatch = methodCapacities.find(c => c.capacity >= targetPerCable);
    
    let isCapacityInsufficient = false;
    let finalSize = 0;

    if (sizeMatch) {
      finalSize = sizeMatch.size;
    } else {
      finalSize = methodCapacities[methodCapacities.length - 1].size;
      isCapacityInsufficient = true;
    }
    const minSizeByCapacity = finalSize;

    // 5. Size by Short Circuit (I^2 * t <= k^2 * S^2) -> S >= (I * sqrt(t)) / k
    const kFactor = conductor === 'Copper' ? (insulation === 'PVC' ? 115 : 143) : (insulation === 'PVC' ? 76 : 94);
    const minSizeSC_exact = (isc * 1000 * Math.sqrt(disconnectionTime as number)) / kFactor;
    const scSizeMatch = methodCapacities.find(c => c.size >= minSizeSC_exact / parallelCount);
    const minSizeByShortCircuit = scSizeMatch ? scSizeMatch.size : methodCapacities[methodCapacities.length - 1].size;
    
    if (minSizeByShortCircuit > finalSize) {
      finalSize = minSizeByShortCircuit;
      if (minSizeSC_exact / parallelCount > methodCapacities[methodCapacities.length - 1].size) {
        isCapacityInsufficient = true;
      }
    }
    
    // Enforce minimum size for Aluminum (2.5mm2)
    if (conductor === 'Aluminum' && finalSize < 2.5) {
      finalSize = 2.5;
    }

    // 6. Size by Voltage Drop
    let sizeByVD = finalSize;
    let finalVD = 0;
    let finalVDPercent = 0;

    const vdKey = conductor === 'Copper' 
      ? (insulation.toLowerCase() as 'pvc' | 'xlpe') 
      : (insulation === 'PVC' ? 'al_pvc' : 'al_xlpe') as 'al_pvc' | 'al_xlpe';

    const checkVD = (s: number, pc: number) => {
      // R = rho / S. We use operating temperature rho (22.5 for Cu, 36 for Al)
      const r = conductor === 'Copper' ? 22.5 / s : 36 / s;
      // Standard reactance for multi-core cables is approx 0.08 ohm/km
      const x = 0.08; 
      
      const cosPhi = pf;
      const sinPhi = Math.sin(Math.acos(cosPhi));
      
      // Voltage drop formula: dV = I * L * (R*cosPhi + X*sinPhi) * (sqrt(3) or 2) / 1000
      const impedanceFactor = (r * cosPhi) + (x * sinPhi);
      
      const vd = isThreePhase 
        ? (Math.sqrt(3) * loadCurrent * l * impedanceFactor) / (1000 * pc)
        : (2 * loadCurrent * l * impedanceFactor) / (1000 * pc);
        
      const vdPercent = (vd / voltage) * 100;
      return { vd, vdPercent };
    };

    let vdResult = checkVD(finalSize, parallelCount);
    
    if (vdResult.vdPercent > mvd && !isCapacityInsufficient) {
      // Try increasing size
      let vdFound = false;
      for (const item of methodCapacities) {
        if (item.size < finalSize) continue;
        
        const res = checkVD(item.size, parallelCount);
        if (res.vdPercent <= mvd) {
          sizeByVD = item.size;
          finalVD = res.vd;
          finalVDPercent = res.vdPercent;
          vdFound = true;
          break;
        }
      }
      
      if (!vdFound) {
        sizeByVD = methodCapacities[methodCapacities.length - 1].size;
        const res = checkVD(sizeByVD, parallelCount);
        finalVD = res.vd;
        finalVDPercent = res.vdPercent;
      }
    } else {
      finalVD = vdResult.vd;
      finalVDPercent = vdResult.vdPercent;
    }

    const finalResultSize = sizeByVD;
    const capacityAtSelected = (methodCapacities.find(c => c.size === finalResultSize)?.capacity || 0) * parallelCount;

    // Generate Cable Name
    const peSize = getPESize(finalResultSize);
    const cores = isThreePhase ? 4 : 2;
    const matName = lang === 'ka' ? (conductor === 'Copper' ? 'სპილენძი' : 'ალუმინი') : conductor;
    const insName = insulation === 'XLPE' ? 'XLPE' : 'PVC';
    const parallelStr = parallelCount > 1 ? `${parallelCount}X` : '';
    const cableName = isCapacityInsufficient 
      ? (lang === 'ka' ? "არასაკმარისი გამტარობა" : "Insufficient Capacity")
      : `${insName} ${matName} - ${parallelStr}(${cores}x${finalResultSize}+${peSize}mm²)`;

    const recommendedBreaker = breaker ? `${breakerType} ${poles} ${breaker}A` : 'N/A';

    return {
      loadCurrent,
      nominalBreaker,
      correctedCurrent,
      minSizeByCapacity,
      minSizeByVoltageDrop: sizeByVD,
      minSizeByShortCircuit,
      finalSize: finalResultSize,
      parallelCount: parallelCount,
      voltageDrop: finalVD,
      voltageDropPercent: finalVDPercent,
      capacityAtSelectedSize: capacityAtSelected * totalCorrection,
      cableName,
      isCapacityInsufficient,
      recommendedBreaker
    };
  }, [power, voltage, powerFactor, isThreePhase, conductor, insulation, method, ambientTemp, grouping, length, maxVDrop, lang, parallelCount, isFormComplete, shortCircuit, disconnectionTime]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-32 lg:pb-12">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${lang === 'en' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Languages className="w-3 h-3" /> EN
            </button>
            <button 
              onClick={() => setLang('ka')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${lang === 'ka' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Languages className="w-3 h-3" /> KA
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-500/80">{t.compliance}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              {t.title.split(' ')[0]} <span className="text-zinc-500 font-light italic">{t.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-zinc-400 max-w-xl text-xs md:text-sm leading-relaxed">
              {t.subtitle}
            </p>
            <button 
              onClick={() => setIsTutorialOpen(true)}
              className="relative z-20 mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-zinc-700 cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.watchTutorial}
            </button>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl backdrop-blur-sm">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{t.recSize}</div>
              <div className="text-xl md:text-2xl font-mono font-bold text-emerald-400">
                {!isFormComplete ? (
                  <span className="text-zinc-600 text-sm">--</span>
                ) : results?.isCapacityInsufficient ? (
                  <span className="text-red-400 text-sm">{t.insufficientCapacity}</span>
                ) : (
                  results?.cableName
                )}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-emerald-500/5 ${!isFormComplete ? 'border-zinc-800' : results?.isCapacityInsufficient ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
              {!isFormComplete ? (
                <Calculator className="w-6 h-6 text-zinc-600" />
              ) : results?.isCapacityInsufficient ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Load Parameters */}
            <section className="relative z-10 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Settings2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{t.loadParams}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <Label tooltip={t.tooltips.lineName}>{t.lineName}</Label>
                  <Input 
                    type="text" 
                    value={lineName} 
                    onChange={setLineName} 
                    placeholder={lang === 'en' ? "e.g., Main Feeder 1" : "მაგ., მთავარი მკვებავი 1"}
                    isValid={isLineNameValid}
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.power}>{t.power}</Label>
                  <Input 
                    type="number" 
                    value={power} 
                    onChange={setPower} 
                    step="0.1"
                    isValid={isPowerValid}
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.voltage}>{t.voltage}</Label>
                  <Input 
                    type="number" 
                    value={voltage} 
                    onChange={() => {}}
                    disabled
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.pf}>{t.pf}</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePfModeChange('resistive')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${pfMode === 'resistive' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Flame className="w-3 h-3" />
                        <span className="truncate">{t.pfPresets.resistive.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handlePfModeChange('mixed')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${pfMode === 'mixed' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span className="truncate">{t.pfPresets.mixed.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handlePfModeChange('motor')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${pfMode === 'motor' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Fan className="w-3 h-3" />
                        <span className="truncate">{t.pfPresets.motor.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handlePfModeChange('custom')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${pfMode === 'custom' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span className="truncate">{t.pfPresets.custom.split(' ')[0]}</span>
                      </button>
                    </div>
                    <Input 
                      type="number" 
                      value={powerFactor} 
                      onChange={(val) => {
                        setPowerFactor(val);
                        setPfMode('custom');
                      }} 
                      step="0.01" 
                      min="0" 
                      max="1"
                      isValid={isPfValid}
                    />
                  </div>
                </div>
                <div>
                  <Label tooltip={t.tooltips.phase}>{t.phase}</Label>
                  <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button 
                      onClick={() => setIsThreePhase(false)}
                      className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${!isThreePhase ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t.singlePhase}
                    </button>
                    <button 
                      onClick={() => setIsThreePhase(true)}
                      className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${isThreePhase ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t.threePhase}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>{t.conductor}</Label>
                  <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button 
                      onClick={() => setConductor('Copper')}
                      className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${conductor === 'Copper' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t.copper}
                    </button>
                    <button 
                      onClick={() => setConductor('Aluminum')}
                      className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${conductor === 'Aluminum' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t.aluminum}
                    </button>
                  </div>
                </div>
                <div>
                  <Label tooltip={t.parallelDesc}>{t.parallel}</Label>
                  <Select value={parallelCount} onChange={(e) => setParallelCount(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? (lang === 'en' ? 'Conductor' : 'გამტარი') : (lang === 'en' ? 'Conductors' : 'გამტარი')}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            {/* Installation Environment */}
            <section className="relative z-20 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{t.instEnv}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label tooltip={t.tooltips.insulation}>{t.insulation}</Label>
                  <Select value={insulation} onChange={(e) => setInsulation(e.target.value as InsulationType)}>
                    <option value="PVC">PVC (70°C)</option>
                    <option value="XLPE">XLPE / EPR (90°C)</option>
                  </Select>
                </div>
                <div>
                  <Label tooltip={t.tooltips.method}>{t.method}</Label>
                  <MethodSelector 
                    value={method} 
                    onChange={(val) => setMethod(val as InstallationMethod)} 
                    options={t.methods} 
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.ambient}>{t.ambient}</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      value={ambientTemp} 
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-sm font-mono w-8">{ambientTemp}°</span>
                  </div>
                </div>
                <div>
                  <Label tooltip={t.tooltips.grouping}>{t.grouping}</Label>
                  <Select value={grouping} onChange={(e) => setGrouping(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? (lang === 'en' ? 'Circuit' : 'წრედი') : (lang === 'en' ? 'Circuits' : 'წრედი')}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            {/* Cable Run */}
            <section className="relative z-10 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Ruler className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{t.cableRun}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label tooltip={t.tooltips.length}>{t.length}</Label>
                  <Input 
                    type="number" 
                    value={length} 
                    onChange={setLength} 
                    isValid={isLengthValid}
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.maxVD}>{t.maxVD}</Label>
                  <Input 
                    type="number" 
                    value={maxVDrop} 
                    onChange={setMaxVDrop} 
                    step="0.1"
                    isValid={isMaxVDropValid}
                  />
                </div>
                <div>
                  <Label tooltip={t.tooltips.shortCircuit}>{t.shortCircuit}</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleScModeChange('residential')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${shortCircuitMode === 'residential' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Home className="w-3 h-3" />
                        <span className="truncate">{t.scPresets.residential.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handleScModeChange('commercial')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${shortCircuitMode === 'commercial' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{t.scPresets.commercial.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handleScModeChange('industrial')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${shortCircuitMode === 'industrial' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Factory className="w-3 h-3" />
                        <span className="truncate">{t.scPresets.industrial.split(' ')[0]}</span>
                      </button>
                      <button
                        onClick={() => handleScModeChange('custom')}
                        className={`flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${shortCircuitMode === 'custom' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span className="truncate">{t.scPresets.custom.split(' ')[0]}</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={shortCircuit} 
                        onChange={(val) => {
                          setShortCircuit(val);
                          setShortCircuitMode('custom');
                        }} 
                        step="0.1"
                        isValid={isShortCircuitValid}
                      />
                      {shortCircuitMode === 'custom' && (
                        <button 
                          onClick={() => setIsScModalOpen(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors"
                          title={t.scCalc.title}
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label tooltip={t.tooltips.disconnectionTime}>{t.disconnectionTime}</Label>
                  <Input 
                    type="number" 
                    value={disconnectionTime} 
                    onChange={setDisconnectionTime} 
                    step="0.01"
                    isValid={isDisconnectionTimeValid}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Analysis Summary */}
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-zinc-800/50 px-4 md:px-6 py-4 border-bottom border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-bold uppercase tracking-widest">{t.analysis}</h2>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded border border-emerald-500/20">
                    LIVE
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                {!isFormComplete ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-bold text-zinc-300">{t.missingFields}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                        {7 - missingFields.length} / 7
                      </span>
                    </div>
                    
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                        style={{ width: `${((7 - missingFields.length) / 7) * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'lineName', label: t.lineName, filled: isLineNameValid },
                        { key: 'power', label: t.power, filled: isPowerValid },
                        { key: 'pf', label: t.pf, filled: isPfValid },
                        { key: 'length', label: t.length, filled: isLengthValid },
                        { key: 'maxVD', label: t.maxVD, filled: isMaxVDropValid },
                        { key: 'shortCircuit', label: t.shortCircuit, filled: isShortCircuitValid },
                        { key: 'disconnectionTime', label: t.disconnectionTime, filled: isDisconnectionTimeValid },
                      ].map(item => (
                        <div key={item.key} className={`flex items-center gap-3 text-sm p-3 rounded-lg border transition-colors ${item.filled ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800/30 border-zinc-800 text-zinc-500'}`}>
                          {item.filled ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Primary Metric */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                        <Label>{t.designCurrent}</Label>
                        <div className="text-2xl font-mono font-bold text-white">
                          {results!.loadCurrent.toFixed(2)} <span className="text-xs font-sans text-zinc-500">A</span>
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                        <Label>{t.correctedCurrent}</Label>
                        <div className="text-2xl font-mono font-bold text-emerald-400">
                          {results!.correctedCurrent.toFixed(2)} <span className="text-xs font-sans text-zinc-500">A</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                        <span className="text-zinc-400 font-bold">{t.recSize}</span>
                        <span className="font-mono font-bold text-emerald-400 text-right max-w-[200px]">
                          {results!.isCapacityInsufficient ? t.insufficientCapacity : results!.cableName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                        <span className="text-zinc-400">{t.parallel}</span>
                        <span className="font-mono font-bold text-white">{results!.parallelCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                        <span className="text-zinc-400 font-bold">{t.recommendedBreaker}</span>
                        <span className="font-mono font-bold text-emerald-400">{results!.recommendedBreaker}</span>
                      </div>

                      {!results!.isCapacityInsufficient && (
                        <>
                          <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                            <span className="text-zinc-400">{t.minSizeCap}</span>
                            <span className="font-mono font-bold text-white">{results!.minSizeByCapacity} mm²</span>
                          </div>
                          <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                            <span className="text-zinc-400">{t.minSizeSC}</span>
                            <span className="font-mono font-bold text-white">{results!.minSizeByShortCircuit} mm²</span>
                          </div>
                          <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                            <span className="text-zinc-400">{t.minSizeVD}</span>
                            <span className="font-mono font-bold text-white">{results!.minSizeByVoltageDrop} mm²</span>
                          </div>
                          <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-800/50">
                            <span className="text-zinc-400">{t.vd}</span>
                            <div className="text-right">
                              <div className="font-mono font-bold text-white">{results!.voltageDrop.toFixed(2)} V</div>
                              <div className={`text-[10px] font-bold ${results!.voltageDropPercent > (maxVDrop as number) ? 'text-red-400' : 'text-emerald-500'}`}>
                                {results!.voltageDropPercent.toFixed(2)}% of {voltage}V
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm py-2">
                            <span className="text-zinc-400">{t.effCap}</span>
                            <span className="font-mono font-bold text-white">{results!.capacityAtSelectedSize.toFixed(1)} A</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className={`p-4 rounded-xl flex gap-3 items-start ${results!.isCapacityInsufficient || results!.voltageDropPercent > (maxVDrop as number) ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                      {results!.isCapacityInsufficient ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-red-400">{t.insufficientCapacity}</div>
                            <p className="text-xs text-red-400/80 mt-1">
                              {t.insufficientCapacityDesc}
                            </p>
                          </div>
                        </>
                      ) : results!.voltageDropPercent > (maxVDrop as number) ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-red-400">{t.vdWarning}</div>
                            <p className="text-xs text-red-400/80 mt-1">
                              {t.vdWarningDesc}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-emerald-400">{t.complianceVerified}</div>
                            <p className="text-xs text-emerald-400/80 mt-1">
                              {t.complianceDesc}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleAddToProject}
                      disabled={results!.isCapacityInsufficient}
                      className="w-full mt-4 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t.addToProject}
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Reference Info */}
            <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t.references}</h2>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-xs text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
                  <span>Tables B.52.4 & B.52.5 for current-carrying capacities.</span>
                </li>
                <li className="flex items-start gap-3 text-xs text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
                  <span>Table B.52.14 for ambient temperature correction.</span>
                </li>
                <li className="flex items-start gap-3 text-xs text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
                  <span>Table B.52.17 for grouping of circuits.</span>
                </li>
              </ul>
            </section>
            </div>
          </div>
        </div>

        {/* Project List */}
        {projectLines.length > 0 && (
          <section className="mt-8 md:mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-800/50 px-4 md:px-6 py-4 border-bottom border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest">{t.projectList}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="px-3 md:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FileText className="w-3 h-3" />
                  <span className="hidden sm:inline">{isExportingPDF ? '...' : t.exportPdf}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-3 md:px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-colors flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">{t.exportExcel}</span>
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-300">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">{t.lineName}</th>
                    <th className="px-4 py-3">{t.power}</th>
                    <th className="px-4 py-3">{t.length}</th>
                    <th className="px-4 py-3">{t.recSize}</th>
                    <th className="px-4 py-3">{t.recommendedBreaker}</th>
                    <th className="px-4 py-3 rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {projectLines.map((line) => (
                    <tr key={line.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{line.name}</td>
                      <td className="px-4 py-3 font-mono">{line.power} kW</td>
                      <td className="px-4 py-3 font-mono">{line.length} m</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{line.cableName}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{line.recommendedBreaker}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setProjectLines(projectLines.filter(l => l.id !== line.id))}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <CollapsibleInstructions 
          title={t.instructionsTitle} 
          instructions={t.instructions} 
        />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-[10px] uppercase tracking-widest font-medium">
          <div className="flex items-center gap-4">
            <span>© 2026 {t.title}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span>{t.footer}</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>{t.disclaimer}</span>
          </div>
        </footer>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden sticky bottom-0 left-0 right-0 z-50 mt-8 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] -mx-4 sm:-mx-6 px-4 sm:px-6">
          {!isFormComplete ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-zinc-300 truncate max-w-[200px]">{t.missingFields}</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
                {7 - missingFields.length} / 7
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.recSize}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.recommendedBreaker}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-sm truncate pr-2">
                    {results!.isCapacityInsufficient ? t.insufficientCapacity : results!.cableName}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm shrink-0">
                    {results!.recommendedBreaker}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  handleAddToProject();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="shrink-0 w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Hidden PDF Report Template */}
      <div className="fixed top-[-9999px] left-[-9999px]">
        <div id="pdf-report-content" className="bg-white text-black p-10 w-[800px] min-h-[1131px] font-sans">
          <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{t.title}</h1>
              <p className="text-zinc-500 mt-1">{t.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-600">{new Date().toLocaleDateString()}</p>
              <p className="text-xs text-zinc-400 mt-1">IEC 60364-5-52</p>
            </div>
          </div>

          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="p-3 border border-zinc-300 font-bold">{t.lineName}</th>
                <th className="p-3 border border-zinc-300 font-bold">{t.power}</th>
                <th className="p-3 border border-zinc-300 font-bold">{t.method}</th>
                <th className="p-3 border border-zinc-300 font-bold">{t.length}</th>
                <th className="p-3 border border-zinc-300 font-bold">Breaker</th>
                <th className="p-3 border border-zinc-300 font-bold">Cable Size</th>
                <th className="p-3 border border-zinc-300 font-bold">V. Drop</th>
              </tr>
            </thead>
            <tbody>
              {projectLines.map((line, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  <td className="p-3 border border-zinc-300 font-medium">{line.name}</td>
                  <td className="p-3 border border-zinc-300">{line.power} kW</td>
                  <td className="p-3 border border-zinc-300">{line.method}</td>
                  <td className="p-3 border border-zinc-300">{line.length} m</td>
                  <td className="p-3 border border-zinc-300">{line.breaker}</td>
                  <td className="p-3 border border-zinc-300 font-bold text-emerald-700">{line.cableSize}</td>
                  <td className="p-3 border border-zinc-300">{line.vDropPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-12 pt-4 border-t border-zinc-200 text-xs text-zinc-500 text-center">
            {t.footer} - {t.disclaimer}
          </div>
        </div>
      </div>

      {/* Short Circuit Calculator Modal */}
      <AnimatePresence>
        {isScModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{t.scCalc.title}</h3>
                </div>
                <button 
                  onClick={() => setIsScModalOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t.scCalc.desc}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label>{t.scCalc.trPower}</Label>
                    <Input 
                      type="number" 
                      value={trPower} 
                      onChange={setTrPower} 
                      placeholder="e.g. 400"
                    />
                  </div>
                  <div>
                    <Label>{t.scCalc.trImpedance}</Label>
                    <Input 
                      type="number" 
                      value={trImpedance} 
                      onChange={setTrImpedance} 
                      placeholder="e.g. 4"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>{t.scCalc.voltage}</Label>
                    <Input 
                      type="number" 
                      value={isThreePhase ? 380 : 220} 
                      onChange={() => {}} 
                      disabled
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsScModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                  >
                    {t.scCalc.cancel}
                  </button>
                  <button
                    onClick={handleCalculateSC}
                    disabled={trPower === '' || trImpedance === ''}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                  >
                    {t.scCalc.calculate}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {isTutorialOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTutorialOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#0A0A0A] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{t.tutorialTitle}</h3>
                </div>
                <button 
                  onClick={() => setIsTutorialOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {/* CSS Animated Tutorial Container */}
                <div className="relative w-full aspect-video bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center">
                  
                  {/* Step 1: Input Power */}
                  <motion.div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 1, 0, 0, 0, 0, 0, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 mx-auto">
                      <Zap className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{lang === 'en' ? '1. Enter Load Data' : '1. შეიყვანეთ დატვირთვა'}</h4>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      {lang === 'en' ? 'Input the power (kW), voltage, and power factor of your equipment.' : 'მიუთითეთ თქვენი დანადგარის სიმძლავრე (კვტ), ძაბვა და cos φ.'}
                    </p>
                    
                    {/* Simulated Input */}
                    <div className="mt-8 w-64 mx-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-zinc-500 text-xs font-mono">Power (kW)</span>
                      <motion.span 
                        className="text-emerald-400 font-mono font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1] }}
                        transition={{ duration: 12, times: [0, 0.05, 1], repeat: Infinity }}
                      >
                        9.0
                      </motion.span>
                    </div>
                  </motion.div>

                  {/* Step 2: Environment */}
                  <motion.div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0, 0, 0, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20 mx-auto">
                      <Layers className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{lang === 'en' ? '2. Set Environment' : '2. გარემო პირობები'}</h4>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      {lang === 'en' ? 'Select installation method, temperature, and grouping factors.' : 'აირჩიეთ ინსტალაციის მეთოდი, ტემპერატურა და დაჯგუფება.'}
                    </p>
                    
                    {/* Simulated Select */}
                    <div className="mt-8 w-64 mx-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-zinc-500 text-xs font-mono">Method</span>
                      <span className="text-blue-400 font-mono font-bold text-sm">A1 (In Wall)</span>
                    </div>
                  </motion.div>

                  {/* Step 3: Results */}
                  <motion.div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 0, 0, 1, 1, 0, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/20 mx-auto">
                      <Calculator className="w-8 h-8 text-purple-500" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{lang === 'en' ? '3. Get IEC Results' : '3. მიიღეთ შედეგი'}</h4>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      {lang === 'en' ? 'The app calculates the exact breaker and cable size based on IEC 60364-5-52.' : 'აპლიკაცია ითვლის ზუსტ ავტომატს და კაბელს IEC სტანდარტით.'}
                    </p>
                    
                    {/* Simulated Result */}
                    <div className="mt-8 flex gap-4 justify-center">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center w-28">
                        <div className="text-zinc-500 text-[10px] uppercase mb-1">Breaker</div>
                        <div className="text-white font-mono font-bold">50A</div>
                      </div>
                      <div className="bg-zinc-950 border border-emerald-500/30 rounded-lg p-3 text-center w-28">
                        <div className="text-zinc-500 text-[10px] uppercase mb-1">Cable</div>
                        <div className="text-emerald-400 font-mono font-bold">10 mm²</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setIsTutorialOpen(false)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                  >
                    {lang === 'en' ? 'Got it, let\'s start' : 'გასაგებია, დავიწყოთ'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
