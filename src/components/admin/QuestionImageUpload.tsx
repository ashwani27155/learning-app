import { useRef, useState } from "react";
import { Upload, X, ZoomIn, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE_MB = 5;

interface UploadedImage {
  id:           string;
  imageUrl:     string;
  thumbnailUrl: string;
  imageType:    string;
  optionIndex?: number;
}

interface Props {
  questionId?:   string;             // undefined = new question (deferred upload)
  imageType:     "QUESTION" | "SOLUTION" | "OPTION" | "PASSAGE";
  optionIndex?:  number;             // for option images
  label?:        string;
  existingImages?: UploadedImage[];
  onUpload?:     (file: File, previewUrl: string) => void;  // for new questions
  onSaved?:      (image: UploadedImage) => void;            // after API save
  onRemove?:     (imageId: string) => void;
  className?:    string;
}

export default function QuestionImageUpload({
  questionId, imageType, optionIndex, label,
  existingImages = [], onUpload, onSaved, onRemove, className = "",
}: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [previews, setPreviews]   = useState<Array<{ file: File; url: string }>>([]);
  const [zoom,    setZoom]        = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Use JPG, PNG, WEBP, or SVG";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Max size is ${MAX_SIZE_MB}MB`;
    return null;
  };

  const handleFile = async (file: File) => {
    const err = validate(file);
    if (err) { toast.error(err); return; }

    const previewUrl = URL.createObjectURL(file);

    if (!questionId) {
      // New question — keep local preview, parent handles actual upload
      setPreviews(p => [...p, { file, url: previewUrl }]);
      onUpload?.(file, previewUrl);
      return;
    }

    // Existing question — upload immediately via API
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("imageType", imageType);
      if (optionIndex != null) formData.append("optionIndex", String(optionIndex));

      const token = localStorage.getItem("accessToken");
      const res   = await fetch(
        `${BASE_URL}/questions/${questionId}/images`,
        { method: "POST", body: formData, headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload failed");

      toast.success("Image uploaded");
      onSaved?.(data.data);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const removePreview = (url: string) => {
    URL.revokeObjectURL(url);
    setPreviews(p => p.filter(i => i.url !== url));
  };

  const allImages = [
    ...existingImages.map(i => ({ id: i.id, url: i.thumbnailUrl ?? i.imageUrl, saved: true })),
    ...previews.map(p => ({ id: p.url, url: p.url, saved: false })),
  ];

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center ${
          dragOver
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={onInputChange}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1">
            {allImages.length > 0
              ? <ImageIcon className="w-5 h-5 text-primary-400" />
              : <Upload className="w-5 h-5 text-gray-400" />}
            <span className="text-xs text-gray-500">
              {allImages.length > 0 ? "Add another image" : "Drop image or click to browse"}
            </span>
            <span className="text-[10px] text-gray-400">JPG, PNG, WEBP, SVG · Max 5MB</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {allImages.map((img) => (
            <div key={img.id} className="relative group w-16 h-16">
              <img
                src={img.url}
                alt="Question"
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              {/* Zoom */}
              <button
                type="button"
                onClick={() => setZoom(img.url)}
                className="absolute inset-0 bg-black/30 rounded-lg hidden group-hover:flex items-center justify-center transition-all"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
              {/* Remove */}
              <button
                type="button"
                onClick={() => {
                  if (img.saved) {
                    onRemove?.(img.id);
                  } else {
                    removePreview(img.url);
                  }
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom}
            alt="Zoomed"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoom(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
