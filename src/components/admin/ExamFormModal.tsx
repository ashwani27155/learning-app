import { useQueryClient } from "@tanstack/react-query";
import { ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { DEMO_MODE } from "@/lib/demoMode";

export interface Exam {
  id:                 string;
  code:               string;
  name:               string;
  nameMr?:            string;
  description?:       string;
  totalMarks?:        number;
  totalQuestions?:    number;
  negativeMarking:    boolean;
  negativeMarkValue:  number;
  durationMinutes?:   number;
  passingPercentage?: number;
  isActive:           boolean;
  orderIndex:         number;
  icon?:              string;
  color?:             string;
}

export const MOCK_EXAMS: Exam[] = [
  { id: "1", code: "UPSC",    name: "UPSC Civil Services",        nameMr: "UPSC नागरी सेवा",     totalMarks: 200, totalQuestions: 100, negativeMarking: false, negativeMarkValue: 0.33, durationMinutes: 120, passingPercentage: 33, isActive: true,  orderIndex: 1 },
  { id: "2", code: "MPSC",    name: "MPSC State Service",         nameMr: "MPSC राज्यसेवा",      totalMarks: 200, totalQuestions: 100, negativeMarking: false, negativeMarkValue: 0.33, durationMinutes: 120, passingPercentage: 33, isActive: true,  orderIndex: 2 },
  { id: "3", code: "MPSC_PSI",name: "MPSC Police Sub Inspector",  nameMr: "MPSC पोलिस उपनिरीक्षक", totalMarks: 200, totalQuestions: 100, negativeMarking: false, negativeMarkValue: 0.33, durationMinutes: 120, passingPercentage: 33, isActive: true,  orderIndex: 3 },
  { id: "4", code: "NEET",    name: "NEET Medical Entrance",      totalMarks: 720, totalQuestions: 180, negativeMarking: true, negativeMarkValue: 1.00, durationMinutes: 200, passingPercentage: 50, isActive: true,  orderIndex: 4 },
  { id: "5", code: "JEE",     name: "JEE Main Engineering",       totalMarks: 300, totalQuestions: 90, negativeMarking: true, negativeMarkValue: 1.00, durationMinutes: 180, passingPercentage: 40, isActive: true,  orderIndex: 5 },
  { id: "6", code: "BANKING", name: "Banking (SBI/IBPS)",         totalMarks: 200, totalQuestions: 200, negativeMarking: false, negativeMarkValue: 0.25, durationMinutes: 120, passingPercentage: 40, isActive: true,  orderIndex: 6 },
  { id: "7", code: "SSC",     name: "SSC (CGL/CHSL)",             totalMarks: 200, totalQuestions: 100, negativeMarking: true, negativeMarkValue: 0.50, durationMinutes: 120, passingPercentage: 33, isActive: true,  orderIndex: 7 },
  { id: "8", code: "CAT",     name: "CAT MBA Entrance",           totalMarks: 228, totalQuestions: 76, negativeMarking: false, negativeMarkValue: 0.00, durationMinutes: 120, passingPercentage: 50, isActive: false, orderIndex: 8 },
];

interface ExamForm {
  code:               string;
  name:               string;
  nameMr?:            string;
  description?:       string;
  totalMarks?:        string;
  totalQuestions?:    string;
  negativeMarking:    boolean;
  negativeMarkValue:  string;
  durationMinutes?:   string;
  passingPercentage?: string;
  orderIndex:         string;
}

export function ExamFormModal({ exam, onClose, onSaved, onDemoSave }: { exam?: Exam; onClose: () => void; onSaved: () => void; onDemoSave?: (data: Partial<Exam>, id?: string) => void }) {
  const qc = useQueryClient();
  const isEdit = !!exam;

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<ExamForm>({
    defaultValues: exam ? {
      code:              exam.code,
      name:              exam.name,
      nameMr:            exam.nameMr ?? "",
      description:       exam.description ?? "",
      totalMarks:        String(exam.totalMarks ?? ""),
      totalQuestions:    String(exam.totalQuestions ?? ""),
      negativeMarking:   exam.negativeMarking,
      negativeMarkValue: String(exam.negativeMarkValue ?? "0.33"),
      durationMinutes:   String(exam.durationMinutes ?? ""),
      passingPercentage: String(exam.passingPercentage ?? ""),
      orderIndex:        String(exam.orderIndex ?? "0"),
    } : { negativeMarking: false, negativeMarkValue: "0.33", orderIndex: "0" },
  });

  const negativeMarking = watch("negativeMarking");

  const onSubmit = async (data: ExamForm) => {
    try {
      const payload = {
        ...data,
        totalMarks:        data.totalMarks        ? parseFloat(data.totalMarks)        : undefined,
        totalQuestions:    data.totalQuestions    ? parseInt(data.totalQuestions)      : undefined,
        negativeMarkValue: data.negativeMarkValue ? parseFloat(data.negativeMarkValue) : 0.33,
        durationMinutes:   data.durationMinutes   ? parseInt(data.durationMinutes)     : undefined,
        passingPercentage: data.passingPercentage ? parseFloat(data.passingPercentage) : undefined,
        orderIndex:        data.orderIndex        ? parseInt(data.orderIndex)          : 0,
      };
      if (DEMO_MODE) {
        onDemoSave?.(payload, isEdit ? exam!.id : undefined);
        toast.success(isEdit ? "Exam updated" : "Exam created");
        onSaved();
        return;
      }
      if (isEdit) {
        await api.put(`/admin/exams/${exam!.id}`, payload);
      } else {
        await api.post("/admin/exams", payload);
      }
      toast.success(isEdit ? "Exam updated" : "Exam created");
      qc.invalidateQueries({ queryKey: ["exams"] });
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? "Edit Exam" : "Add New Exam"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Code *</label>
              <input className="input-field" placeholder="e.g. MPSC" {...register("code", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" className="input-field" {...register("orderIndex")} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name (English) *</label>
            <input className="input-field" placeholder="e.g. MPSC State Service" {...register("name", { required: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name (Marathi)</label>
            <input className="input-field font-marathi" placeholder="मराठी नाव" {...register("nameMr")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field w-full h-16 resize-none" placeholder="Brief description of the exam…" {...register("description")} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" className="input-field" placeholder="200" {...register("totalMarks")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
              <input type="number" className="input-field" placeholder="100" {...register("totalQuestions")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" className="input-field" placeholder="120" {...register("durationMinutes")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing %</label>
              <input type="number" className="input-field" placeholder="33" {...register("passingPercentage")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Mark Value</label>
              <input
                type="number" step="0.01" className="input-field"
                placeholder="0.33" {...register("negativeMarkValue")}
                disabled={!negativeMarking}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <button
              type="button"
              onClick={() => setValue("negativeMarking", !negativeMarking)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${negativeMarking ? "text-red-600" : "text-gray-400"}`}
            >
              {negativeMarking ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              Negative Marking {negativeMarking ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {isSubmitting ? "Saving…" : isEdit ? "Update Exam" : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
