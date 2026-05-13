"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

type BlogShareButtonProps = {
  title: string;
  text?: string | null;
  className?: string;
};

export function BlogShareButton({ title, text, className }: BlogShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const copyCurrentUrl = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const handleShare = async () => {
    const shareData: ShareData = {
      title,
      text: text ?? undefined,
      url: window.location.href,
    };

    try {
      if (
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return;
      }

      await copyCurrentUrl();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      await copyCurrentUrl();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleShare}
      aria-live="polite"
      aria-label={copied ? "Link disalin" : "Bagikan artikel"}
      title={copied ? "Link disalin" : "Bagikan artikel"}
    >
      {copied ? <CheckIcon /> : <Share2Icon />}
    </Button>
  );
}
