"use client";

import { X, ImageIcon, FileIcon, Video, Music } from "lucide-react";
import { formatFileSize } from "@/lib/file-validation";
import Image from "next/image";
import type { StagedFile } from "@/types";

interface FilePreviewBarProps {
  files: StagedFile[];
  onRemove: (fileId: string) => void;
}

export function FilePreviewBar({ files, onRemove }: FilePreviewBarProps) {
  if (files.length === 0) return null;

  const allImages = files.every((f) => f.category === "image");

  return (
    <div className="px-3 pt-3 pb-1 overflow-visible">
      <div className="flex items-center gap-3 overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-muted-foreground/20 pb-1 pt-3">
        {files.map((staged) => (
          <div key={staged.id} className="relative shrink-0 group overflow-visible">
            {/* Remove button */}
            <button
              onClick={() => onRemove(staged.id)}
              className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 hover:bg-rose-500"
              aria-label="Remove file"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Image thumbnail */}
            {staged.category === "image" && staged.preview ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted">
                <Image
                  src={staged.preview}
                  alt={staged.file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              /* File / Video / Audio card */
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/50 max-w-[200px]">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/50 shrink-0">
                  {staged.category === "video" ? (
                    <Video className="h-4 w-4 text-violet-400" />
                  ) : staged.category === "audio" ? (
                    <Music className="h-4 w-4 text-warning" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-foreground">
                    {staged.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(staged.file.size)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Image count indicator */}
        {allImages && files.length > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 shrink-0">
            <ImageIcon className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-medium text-primary">
              {files.length}/10
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
