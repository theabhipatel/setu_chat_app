"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatFileSize } from "@/lib/file-validation";
import type { MessageFile } from "@/types";

interface AudioPlayerProps {
  file: MessageFile;
  isOwn: boolean;
}

export function AudioPlayer({ file, isOwn }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      const audio = audioRef.current;
      if (audio) {
        audio.volume = val;
        setVolume(val);
        setIsMuted(val === 0);
      }
    },
    []
  );

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    setSpeed((prev) => {
      const nextIdx = (speeds.indexOf(prev) + 1) % speeds.length;
      const next = speeds[nextIdx];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) setDuration(audio.duration);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  const handleDownload = async () => {
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

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const btnClass = isOwn
    ? "text-primary-foreground/60 hover:text-primary-foreground"
    : "text-muted-foreground hover:text-foreground";

  return (
    <div
      className={`rounded-xl max-w-[300px] ${
        isOwn ? "bg-primary-foreground/10" : "bg-background/50"
      }`}
    >
      <audio
        ref={audioRef}
        src={file.file_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Top row: play + info + download */}
      <div className="flex items-center gap-3 p-3 pb-1.5">
        <button
          onClick={togglePlay}
          className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors ${
            isOwn
              ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-pink-400" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 text-pink-400 ml-0.5" fill="currentColor" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.file_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {file.file_size && (
              <span className="text-[11px] opacity-60">
                {formatFileSize(file.file_size)}
              </span>
            )}
            <span className="text-[11px] opacity-50 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDownload}
              className={`shrink-0 p-1.5 rounded-full transition-colors ${
                isOwn
                  ? "hover:bg-primary-foreground/20 text-primary-foreground/70"
                  : "hover:bg-primary/[0.06] text-muted-foreground"
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

      {/* Progress bar */}
      <div className="px-3 py-1.5">
        <div
          ref={progressRef}
          className={`relative h-1 rounded-full cursor-pointer ${
            isOwn ? "bg-primary-foreground/15" : "bg-muted"
          }`}
          onClick={handleProgressClick}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-pink-400/70 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls row: -10s | +10s | speed | volume (hover expand) */}
      <div className="flex items-center gap-1 px-3 pb-2.5 pt-0.5">
        {/* Rewind 10s */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={skipBackward}
              className={`p-1 rounded transition-colors ${btnClass}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Rewind 10s</p>
          </TooltipContent>
        </Tooltip>

        {/* Forward 10s */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={skipForward}
              className={`p-1 rounded transition-colors ${btnClass}`}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Forward 10s</p>
          </TooltipContent>
        </Tooltip>

        {/* Speed toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={cycleSpeed}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums transition-colors ${btnClass}`}
            >
              {speed}x
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Playback speed</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {/* Volume — hover to expand like video */}
        <div className="flex items-center group/vol">
          <button
            onClick={toggleMute}
            className={`shrink-0 z-10 p-1 rounded transition-colors ${btnClass}`}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
          <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-300 ease-in-out ml-0 group-hover/vol:ml-1 flex items-center h-3.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full accent-pink-400 h-1 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
