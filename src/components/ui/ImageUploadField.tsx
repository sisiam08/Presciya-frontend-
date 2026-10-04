"use client";

import React, { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";


const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;


interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface ImageUploadFieldProps {
  
  value: string;
  
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}


export default function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  disabled,
}: ImageUploadFieldProps) {
  const { error: showError } = useNotification();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      showError("Image is too large. The maximum size is 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.upload<{ data: UploadedImage }>(
        API_ROUTES.UPLOADS.IMAGE,
        formData,
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error("Upload failed");
      onChange(url);
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      showError(message || "Failed to upload image");
    } finally {
      setUploading(false);
      
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
          {value ? (
            
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <Upload className="h-5 w-5 text-on-surface-variant" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1 h-4 w-4" />
            )}
            {uploading ? "Uploading…" : value ? "Replace Image" : "Upload Image"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
            >
              <X className="mr-1 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {hint && (
        <p className="mt-1.5 text-[10px] text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}
