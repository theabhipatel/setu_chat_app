"use client";

import type { MessageStatus as Status, MessageReceiptDetail } from "@/types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MessageStatusProps {
  status: Status;
  isEmojiOnly?: boolean;
  receiptDetails?: MessageReceiptDetail[];
}

const SIZE = 12;
const ICON_SIZE = 10;

// Reusable inline status icon for the tooltip list
function StatusIcon({ status, size = ICON_SIZE }: { status: "sent" | "delivered" | "read"; size?: number }) {
  switch (status) {
    case "sent":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "delivered":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "read":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="8" cy="8" r="3.5" fill="currentColor" />
        </svg>
      );
  }
}



export function MessageStatus({ status, isEmojiOnly, receiptDetails }: MessageStatusProps) {
  const baseClass = isEmojiOnly
    ? "text-muted-foreground"
    : "opacity-60";

  // Sort receipt details: read → delivered → sent
  const sortedReceipts = receiptDetails
    ? [...receiptDetails].sort((a, b) => {
        const order = { read: 0, delivered: 1, sent: 2 };
        return order[a.status] - order[b.status];
      })
    : undefined;

  // Build tooltip content
  const tooltipContent = sortedReceipts && sortedReceipts.length > 0 ? (
    <div className="flex flex-col gap-1.5 py-0.5">
      {sortedReceipts.map((receipt) => (
        <div key={receipt.user_id} className="flex items-center gap-2">
          <StatusIcon status={receipt.status} />
          <span className="text-xs whitespace-nowrap">
            {receipt.first_name} {receipt.last_name}
          </span>
        </div>
      ))}
    </div>
  ) : null;

  // Simple tooltip text for non-group or when no receipt details
  const simpleTooltipText = (() => {
    switch (status) {
      case "sending": return "Sending...";
      case "sent": return "Sent";
      case "delivered": return "Delivered";
      case "read": return "Seen";
      case "failed": return "Failed to send — click to retry";
      default: return "";
    }
  })();

  switch (status) {
    case "sending":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center ${baseClass}`}>
              <svg className="animate-spin" width={SIZE} height={SIZE} viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"
                  strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Sending...</p>
          </TooltipContent>
        </Tooltip>
      );

    case "sent":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center ${baseClass}`}>
              <svg width={SIZE} height={SIZE} viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltipContent || <p>{simpleTooltipText}</p>}
          </TooltipContent>
        </Tooltip>
      );

    case "delivered":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center ${baseClass}`}>
              <svg width={SIZE} height={SIZE} viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltipContent || <p>{simpleTooltipText}</p>}
          </TooltipContent>
        </Tooltip>
      );

    case "read":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center ${baseClass}`}>
              <svg width={SIZE} height={SIZE} viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="8" cy="8" r="3.5" fill="currentColor" />
              </svg>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltipContent || <p>{simpleTooltipText}</p>}
          </TooltipContent>
        </Tooltip>
      );

    case "failed":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center text-rose-400 hover:text-rose-300 transition-colors">
              <svg width={SIZE + 2} height={SIZE + 2} viewBox="0 0 16 16" fill="none" className="animate-pulse">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.9" fill="currentColor" />
              </svg>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Failed to send — click to retry</p>
          </TooltipContent>
        </Tooltip>
      );

    default:
      return null;
  }
}
