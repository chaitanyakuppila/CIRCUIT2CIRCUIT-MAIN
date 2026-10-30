import React, { useState, useEffect, useRef } from 'react';
import { ComponentItem } from '../types';
import { ImageOff } from 'lucide-react';
import { resolveImageUrl } from '../services/api';

interface HardwareVisualProps {
  iconType: ComponentItem['iconType'];
  category: ComponentItem['category'];
  name: string;
  photoUrl?: string;
}

export const HardwareVisual: React.FC<HardwareVisualProps> = ({ name, photoUrl }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const resolvedPhotoUrl = resolveImageUrl(photoUrl);

  // Reset state when photoUrl changes
  useEffect(() => {
    setImageError(false);
    setIsLoaded(false);

    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        setImageError(true);
      }
    }
  }, [resolvedPhotoUrl]);

  // Watchdog timer: prevent cards from getting stuck indefinitely on "Loading photo..." if network stalls or fails
  useEffect(() => {
    if (!resolvedPhotoUrl || isLoaded || imageError) return;

    const watchdogTimer = setTimeout(() => {
      if (!isLoaded) {
        setImageError(true);
      }
    }, 5000);

    return () => clearTimeout(watchdogTimer);
  }, [resolvedPhotoUrl, isLoaded, imageError]);



  // Ref callback to catch already cached images synchronously on mount
  const handleImageRef = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node && node.complete) {
      if (node.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        setImageError(true);
      }
    }
  };

  // If a valid resolvedPhotoUrl is provided and hasn't errored out
  if (resolvedPhotoUrl && !imageError) {
    return (
      <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group-hover:border-emerald-500/50 transition-all shadow-md">
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-900 animate-pulse flex flex-col items-center justify-center p-2 text-center z-10">
            <span className="text-[10px] font-mono text-slate-500">Loading photo...</span>
          </div>
        )}
        <img
          ref={handleImageRef}
          src={resolvedPhotoUrl}
          alt={name}
          decoding="async"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth > 0) {
              setIsLoaded(true);
            } else {
              setImageError(true);
            }
          }}
          onError={() => {
            setImageError(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  }

  // If photo is missing, failed to load, or timed out, show clean "Photo unavailable" placeholder
  return (
    <div className="relative w-full h-44 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center group-hover:border-slate-700 transition-colors">
      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mb-2">
        <ImageOff className="w-5 h-5" />
      </div>
      <span className="text-xs font-semibold text-slate-300">Photo unavailable</span>
      <span className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase">Sri Vasavi Hardware</span>
    </div>
  );
};
