import { api } from "../lib/api";

export interface StudyMaterialItem {
  id: string;
  titleEn: string;
  titleMr: string;
  description?: string;
  type: string;
  access: "free" | "basic" | "premium" | "elite";
  pageCount?: number;
  fileSize?: number;
  thumbnail?: string;
  downloadCount: number;
  viewCount: number;
  rating: number;
  publishedAt?: string;
  price: number;
  fileUrl: string;
}

export const studyMaterialService = {
  async getAll(params?: { type?: string; access?: string; search?: string; page?: number; limit?: number }): Promise<StudyMaterialItem[]> {
    const res = await api.get<any>("/study-materials", { params: params as any });
    return (Array.isArray(res) ? res : res?.data ?? []) as StudyMaterialItem[];
  },

  async getById(id: string): Promise<StudyMaterialItem> {
    return api.get<StudyMaterialItem>(`/study-materials/${id}`);
  },
};
