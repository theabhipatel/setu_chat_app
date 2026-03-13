"use client";

import { FileText, FileSpreadsheet, FileIcon, Download, FileArchive, Music } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatFileSize } from "@/lib/file-validation";
import type { MessageFile } from "@/types";

interface FileCardProps {
  file: MessageFile;
  isOwn: boolean;
}

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  "application/pdf": { icon: FileText, color: "text-red-400" },
  "application/msword": { icon: FileText, color: "text-blue-400" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    color: "text-blue-400",
  },
  "application/vnd.ms-excel": { icon: FileSpreadsheet, color: "text-success" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FileSpreadsheet,
    color: "text-success",
  },
  "application/vnd.ms-powerpoint": { icon: FileText, color: "text-orange-400" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: FileText,
    color: "text-orange-400",
  },
  "application/zip": { icon: FileArchive, color: "text-warning" },
  "application/x-rar-compressed": { icon: FileArchive, color: "text-warning" },
  "application/vnd.rar": { icon: FileArchive, color: "text-warning" },
  "audio/mpeg": { icon: Music, color: "text-pink-400" },
  "audio/wav": { icon: Music, color: "text-pink-400" },
  "audio/ogg": { icon: Music, color: "text-pink-400" },
};

function getFileIconInfo(mimeType: string | null) {
  if (mimeType && FILE_ICONS[mimeType]) return FILE_ICONS[mimeType];
  return { icon: FileIcon, color: "text-muted-foreground" };
}

export function FileCard({ file, isOwn }: FileCardProps) {
  const { icon: Icon, color } = getFileIconInfo(file.mime_type);

  const handleOpenFile = () => {
    window.open(file.file_url, "_blank");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(file.file_url, "_blank");
    }
  };

  return (
    <div
      onClick={handleOpenFile}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors max-w-[280px] ${
        isOwn
          ? "bg-primary-foreground/10 hover:bg-primary-foreground/15"
          : "bg-background/50 hover:bg-background/70"
      }`}
    >
      {/* File icon */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
          isOwn ? "bg-primary-foreground/10" : "bg-muted"
        }`}
      >
        <Icon className={`h-5 w-5 ${color}`} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file_name}</p>
        {file.file_size && (
          <p className="text-[11px] opacity-60">{formatFileSize(file.file_size)}</p>
        )}
      </div>

      {/* Download button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleDownload}
            className={`shrink-0 p-2 rounded-full transition-colors ${
              isOwn
                ? "hover:bg-primary-foreground/20 text-primary-foreground/70"
                : "hover:bg-accent text-muted-foreground"
            }`}
          >
            <Download className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Download</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
