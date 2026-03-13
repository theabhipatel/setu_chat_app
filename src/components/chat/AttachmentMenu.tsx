"use client";

import { useRef } from "react";
import { ImageIcon, Video, FileIcon } from "lucide-react";

interface AttachmentMenuProps {
  onPhotosSelect: (files: FileList) => void;
  onVideoSelect: (files: FileList) => void;
  onFileSelect: (files: FileList) => void;
  onClose: () => void;
}

export function AttachmentMenu({
  onPhotosSelect,
  onVideoSelect,
  onFileSelect,
  onClose,
}: AttachmentMenuProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPhotosSelect(e.target.files);
    }
    onClose();
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoSelect(e.target.files);
    }
    onClose();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
    onClose();
  };

  const menuItems = [
    {
      icon: ImageIcon,
      label: "Photos",
      hint: "Up to 10 images",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      onClick: () => photoInputRef.current?.click(),
    },
    {
      icon: Video,
      label: "Video",
      hint: "Single video",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      onClick: () => videoInputRef.current?.click(),
    },
    {
      icon: FileIcon,
      label: "File",
      hint: "Documents, audio & more",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handlePhotos}
      />
      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        accept="video/*"
        onChange={handleVideo}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/*"
        onChange={handleFile}
      />

      {/* Menu */}
      <div className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-primary/[0.06] transition-colors duration-150"
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-[18px] w-[18px] ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.hint}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
