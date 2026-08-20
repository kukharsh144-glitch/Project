import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume, Volume1, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDuration } from "./VideoCard.jsx";

const getQualityUrl = (originalUrl, selectedQuality) => {
  if (!originalUrl) return "";
  if (!originalUrl.includes("cloudinary.com")) return originalUrl;

  const uploadIndex = originalUrl.indexOf("/upload/");
  if (uploadIndex === -1) return originalUrl;

  const prefix = originalUrl.substring(0, uploadIndex + 8);
  const suffix = originalUrl.substring(uploadIndex + 8);

  // Strip existing quality/dimension transformation segment safely
  const cleanSuffix = suffix.replace(/^([a-z0-9_:,]*q_[a-z0-9_:,]*)\//i, "");

  let transformation = "";
  if (selectedQuality === "1080p") {
    transformation = "vc_auto,q_auto:best,h_1080,c_limit/";
  } else if (selectedQuality === "720p") {
    transformation = "vc_auto,q_auto:good,h_720,c_limit/";
  } else if (selectedQuality === "480p") {
    transformation = "vc_auto,q_auto:eco,h_480,c_limit/";
  } else if (selectedQuality === "360p") {
    transformation = "vc_auto,q_auto:low,h_360,c_limit/";
  } else {
    transformation = "q_auto/";
  }

  return `${prefix}${transformation}${cleanSuffix}`;
};

const getVolumeIcon = (vol, muted) => {
  if (muted || vol === 0) return VolumeX;
  if (vol <= 0.3) return Volume;
  if (vol <= 0.7) return Volume1;
  return Volume2;
};

export const CustomVideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("Auto");
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [activeSettingsMenu, setActiveSettingsMenu] = useState("main");
  const [videoSrc, setVideoSrc] = useState("");
  const [indicator, setIndicator] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  const indicatorTimeoutRef = useRef(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const settingsRef = useRef(null);

  // Pending quality-switch bookkeeping, so a fast double switch can't
  // leave stale "canplay" listeners fighting each other.
  const qualitySwitchRef = useRef(null);

  // Refs mirroring the latest state so global listeners (keydown/wheel)
  // never act on stale closures without needing to be re-bound every render.
  const stateRef = useRef({});
  stateRef.current = { isPlaying, isMuted, volume, isAdjusting, showSettingsPopover };

  const showIndicator = (type, value, IconComponent) => {
    if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
    setIndicator({ type, value, IconComponent, key: Date.now() });
    indicatorTimeoutRef.current = setTimeout(() => {
      setIndicator(null);
    }, 800);
  };

  const [showLeftSeek, setShowLeftSeek] = useState(false);
  const [showRightSeek, setShowRightSeek] = useState(false);
  const leftSeekTimeoutRef = useRef(null);
  const rightSeekTimeoutRef = useRef(null);

  const triggerLeftSeek = () => {
    if (leftSeekTimeoutRef.current) clearTimeout(leftSeekTimeoutRef.current);
    setShowLeftSeek(true);
    leftSeekTimeoutRef.current = setTimeout(() => setShowLeftSeek(false), 800);
  };

  const triggerRightSeek = () => {
    if (rightSeekTimeoutRef.current) clearTimeout(rightSeekTimeoutRef.current);
    setShowRightSeek(true);
    rightSeekTimeoutRef.current = setTimeout(() => setShowRightSeek(false), 800);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video
        .play()
        .then(() => showIndicator("play", "Play", Play))
        .catch(() => {
          // Autoplay / play() rejected (e.g. browser policy) — state stays
          // in sync via the play/pause DOM listeners, no UI gets stuck.
        });
    } else {
      video.pause();
      showIndicator("play", "Pause", Pause);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const applyVolume = (nextVol) => {
    const video = videoRef.current;
    if (video) {
      video.volume = nextVol;
      video.muted = nextVol === 0;
    }
    setIsMuted(nextVol === 0);
    setVolume(nextVol);
    return nextVol;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val)) return;
    applyVolume(val);
  };

  const nudgeVolume = (delta) => {
    const nextVol = Math.max(0, Math.min(1, +(stateRef.current.volume + delta).toFixed(2)));
    applyVolume(nextVol);
    const volIcon = getVolumeIcon(nextVol, nextVol === 0);
    showIndicator("volume", `${Math.round(nextVol * 100)}%`, volIcon);
    resetControlsTimeout();
  };

  // Bind the volume scroll-wheel handler once and read live state from
  // stateRef, instead of re-subscribing on every state change.
  useEffect(() => {
    const volEl = volumeContainerRef.current;
    if (!volEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const step = 0.05;
      nudgeVolume(e.deltaY < 0 ? step : -step);
    };

    volEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => volEl.removeEventListener("wheel", handleWheel);
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;

    if (nextMuted) {
      video.muted = true;
      setIsMuted(true);
      showIndicator("mute", "Mute", VolumeX);
    } else {
      const restoredVolume = volume === 0 ? 0.5 : volume;
      video.muted = false;
      video.volume = restoredVolume;
      setIsMuted(false);
      setVolume(restoredVolume);
      showIndicator("mute", `${Math.round(restoredVolume * 100)}%`, getVolumeIcon(restoredVolume, false));
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val) || !videoRef.current) return;
    setCurrentTime(val);
    videoRef.current.currentTime = val;
  };

  const skipTime = (amount) => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + amount));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettingsPopover(false);
    setActiveSettingsMenu("main");
  };

  // Rewritten to be race-free: only ever one pending quality switch is
  // tracked at a time, and switching again mid-load cleanly cancels the
  // previous one instead of leaving orphaned listeners around.
  const changeQuality = (newQuality) => {
    const video = videoRef.current;
    if (!video) return;

    const newSrc = getQualityUrl(src, newQuality);

    setShowSettingsPopover(false);
    setActiveSettingsMenu("main");

    if (newQuality === quality && newSrc === videoSrc) return;

    // Cancel any switch already in flight.
    if (qualitySwitchRef.current) {
      video.removeEventListener("canplay", qualitySwitchRef.current.onCanPlay);
      video.removeEventListener("error", qualitySwitchRef.current.onError);
      qualitySwitchRef.current = null;
    }

    const savedTime = video.currentTime;
    const wasPlaying = !video.paused && !video.ended;

    setQuality(newQuality);
    setIsBuffering(true);
    setHasError(false);
    setVideoSrc(newSrc);

    const onCanPlay = () => {
      cleanup();
      if (isFinite(savedTime) && savedTime > 0) {
        video.currentTime = Math.min(savedTime, video.duration || savedTime);
      }
      setIsBuffering(false);
      if (wasPlaying) {
        video.play().catch(() => {});
      }
    };

    const onError = () => {
      cleanup();
      setIsBuffering(false);
      setHasError(true);
    };

    function cleanup() {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      if (qualitySwitchRef.current && qualitySwitchRef.current.onCanPlay === onCanPlay) {
        qualitySwitchRef.current = null;
      }
    }

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    qualitySwitchRef.current = { onCanPlay, onError };
  };

  // Reset to the requested quality whenever the underlying src prop changes
  // (e.g. navigating to a different video), instead of only on mount.
  useEffect(() => {
    if (!src) return;
    if (qualitySwitchRef.current && videoRef.current) {
      videoRef.current.removeEventListener("canplay", qualitySwitchRef.current.onCanPlay);
      videoRef.current.removeEventListener("error", qualitySwitchRef.current.onError);
      qualitySwitchRef.current = null;
    }
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    setVideoSrc(getQualityUrl(src, quality));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    const { isPlaying: playing, isAdjusting: adjusting, showSettingsPopover: settingsOpen } = stateRef.current;
    if (playing && !adjusting && !settingsOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Close the settings popover on outside click or Escape, so it never
  // gets stuck open over the video.
  useEffect(() => {
    if (!showSettingsPopover) return;

    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettingsPopover(false);
        setActiveSettingsMenu("main");
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowSettingsPopover(false);
        setActiveSettingsMenu("main");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showSettingsPopover]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleDurationChange = () => {
      if (isFinite(video.duration)) setDuration(video.duration);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlayThrough = () => setIsBuffering(false);
    const handleVideoError = () => setHasError(true);

    video.addEventListener("play", handlePlayEvent);
    video.addEventListener("pause", handlePauseEvent);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplaythrough", handleCanPlayThrough);
    video.addEventListener("error", handleVideoError);

    return () => {
      video.removeEventListener("play", handlePlayEvent);
      video.removeEventListener("pause", handlePauseEvent);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.removeEventListener("error", handleVideoError);
    };
  }, []);

  // Global keyboard shortcuts — bound once, reads live values from
  // stateRef so it never needs to re-subscribe (and never goes stale).
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          resetControlsTimeout();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          resetControlsTimeout();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          resetControlsTimeout();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-5);
          triggerLeftSeek();
          resetControlsTimeout();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(5);
          triggerRightSeek();
          resetControlsTimeout();
          break;
        case "ArrowUp":
          e.preventDefault();
          nudgeVolume(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          nudgeVolume(-0.05);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isAdjusting, showSettingsPopover, resetControlsTimeout]);

  // Clean up all outstanding timeouts/listeners on unmount.
  useEffect(() => {
    return () => {
      if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
      if (leftSeekTimeoutRef.current) clearTimeout(leftSeekTimeoutRef.current);
      if (rightSeekTimeoutRef.current) clearTimeout(rightSeekTimeoutRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (qualitySwitchRef.current && videoRef.current) {
        videoRef.current.removeEventListener("canplay", qualitySwitchRef.current.onCanPlay);
        videoRef.current.removeEventListener("error", qualitySwitchRef.current.onError);
      }
    };
  }, []);

  const VolumeIcon = getVolumeIcon(volume, isMuted);
  const safeDuration = isFinite(duration) ? duration : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full h-full bg-black group select-none overflow-hidden"
    >
      <video
        ref={videoRef}
        src={videoSrc || undefined}
        poster={poster}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        autoPlay
      />

      {/* Play/Pause Overlay Animation on Click */}
      <div
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 active:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="h-16 w-16 text-white bg-black/40 p-4 rounded-full" />
        ) : (
          <Play className="h-16 w-16 text-white bg-black/40 p-4 rounded-full ml-1" />
        )}
      </div>

      {/* Buffering spinner (initial load, seeking, or quality switch) */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 className="h-10 w-10 text-white/90 animate-spin" />
        </div>
      )}

      {/* Playback error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-2 bg-zinc-950/85 backdrop-blur-md text-white px-6 py-5 rounded-2xl border border-zinc-800/80">
            <span className="text-xs font-semibold">Playback error. Try a different quality.</span>
          </div>
        </div>
      )}

      {/* Visual Indicator Overlay */}
      {indicator && (
        <div key={indicator.key} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-3 bg-zinc-950/85 backdrop-blur-md text-white px-6 py-5 rounded-3xl border border-zinc-800/80 shadow-2xl animate-popup">
            <indicator.IconComponent className="h-9 w-9 text-purple-400" />
            <span className="text-xs font-extrabold tracking-wider">{indicator.value}</span>
          </div>
        </div>
      )}

      {/* Left Fast Rewind (Seek Back) Sweep Overlay */}
      {showLeftSeek && (
        <div className="absolute left-0 top-0 bottom-0 w-1/3 flex flex-col items-center justify-center bg-gradient-to-r from-black/60 via-black/35 to-transparent text-white rounded-r-[120px] border-r border-white/5 pointer-events-none z-20 animate-pulse-left">
          <div className="flex items-center text-purple-400">
            <ChevronLeft className="h-7 w-7 animate-chevron-left [animation-delay:200ms]" />
            <ChevronLeft className="h-7 w-7 animate-chevron-left [animation-delay:100ms]" />
            <ChevronLeft className="h-7 w-7 animate-chevron-left [animation-delay:0ms]" />
          </div>
          <span className="text-[10px] font-black mt-2 tracking-widest text-white/90">-5 SEC</span>
        </div>
      )}

      {/* Right Fast Forward (Seek Ahead) Sweep Overlay */}
      {showRightSeek && (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 flex flex-col items-center justify-center bg-gradient-to-l from-black/60 via-black/35 to-transparent text-white rounded-l-[120px] border-l border-white/5 pointer-events-none z-20 animate-pulse-right">
          <div className="flex items-center text-purple-400">
            <ChevronRight className="h-7 w-7 animate-chevron-right [animation-delay:0ms]" />
            <ChevronRight className="h-7 w-7 animate-chevron-right [animation-delay:100ms]" />
            <ChevronRight className="h-7 w-7 animate-chevron-right [animation-delay:200ms]" />
          </div>
          <span className="text-[10px] font-black mt-2 tracking-widest text-white/90">+5 SEC</span>
        </div>
      )}

      {/* Inline styles for custom keyframe animations */}
      <style>{`
        @keyframes popupAnim {
          0% { transform: scale(0.85); opacity: 0; }
          15% { transform: scale(1.05); opacity: 1; }
          80% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .animate-popup {
          animation: popupAnim 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulseLeft {
          0% { opacity: 0; transform: scaleX(0.85); }
          20% { opacity: 1; transform: scaleX(1); }
          80% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0.9); }
        }
        @keyframes pulseRight {
          0% { opacity: 0; transform: scaleX(0.85); }
          20% { opacity: 1; transform: scaleX(1); }
          80% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0.9); }
        }
        @keyframes chevronLeft {
          0% { opacity: 0; transform: translateX(6px); }
          40% { opacity: 1; }
          80% { opacity: 0; transform: translateX(-6px); }
          100% { opacity: 0; }
        }
        @keyframes chevronRight {
          0% { opacity: 0; transform: translateX(-6px); }
          40% { opacity: 1; }
          80% { opacity: 0; transform: translateX(6px); }
          100% { opacity: 0; }
        }
        .animate-pulse-left {
          animation: pulseLeft 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-right {
          animation: pulseRight 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-chevron-left {
          animation: chevronLeft 800ms infinite;
        }
        .animate-chevron-right {
          animation: chevronRight 800ms infinite;
        }
      `}</style>

      {/* Control Bar Overlay */}
      <div
        className={`absolute bottom-4 left-4 right-4 bg-zinc-950/75 backdrop-blur-md border border-zinc-800/60 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Progress Bar / Seek Slider */}
        <div className="flex items-center gap-2 group/progress">
          <input
            type="range"
            min={0}
            max={safeDuration || 100}
            value={Math.min(currentTime, safeDuration || currentTime)}
            onChange={handleSeek}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            disabled={!safeDuration}
            className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-1.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-purple-400 transition-colors" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button onClick={() => skipTime(-5)} className="hover:text-purple-400 transition-colors" title="Rewind 5s">
              <SkipBack className="h-4 w-4" />
            </button>
            <button onClick={() => skipTime(5)} className="hover:text-purple-400 transition-colors" title="Fast Forward 5s">
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Volume Container */}
            <div ref={volumeContainerRef} className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="hover:text-purple-400 transition-all active:scale-95" title={isMuted ? "Unmute" : "Mute"}>
                <VolumeIcon
                  className={`h-5 w-5 transition-all duration-200 hover:scale-110 ${
                    isMuted || volume === 0 ? "text-red-500" : "text-purple-400"
                  }`}
                />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onMouseDown={() => setIsAdjusting(true)}
                onMouseUp={() => setIsAdjusting(false)}
                onTouchStart={() => setIsAdjusting(true)}
                onTouchEnd={() => setIsAdjusting(false)}
                className="w-0 opacity-0 pointer-events-none group-hover/volume:w-20 group-hover/volume:opacity-100 group-hover/volume:pointer-events-auto transition-all duration-300 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-white outline-none"
              />
            </div>

            {/* Time display */}
            <span className="font-semibold tabular-nums">
              {formatDuration(currentTime)} / {formatDuration(safeDuration)}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Settings Controller with Submenus */}
            <div ref={settingsRef}>
              <button
                onClick={() => {
                  setShowSettingsPopover((prev) => !prev);
                  setActiveSettingsMenu("main");
                }}
                className="hover:text-purple-400 transition-colors flex items-center gap-1 font-semibold"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span>{playbackRate}x / {quality}</span>
              </button>

              {showSettingsPopover && (
                <div className="absolute right-0 bottom-10 bg-zinc-950/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl py-2 w-44 flex flex-col shadow-2xl z-30 text-white text-xs font-semibold select-none">
                  {activeSettingsMenu === "main" && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => setActiveSettingsMenu("quality")}
                        className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <span>Quality</span>
                        <span className="text-[10px] text-zinc-400">{quality}</span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsMenu("speed")}
                        className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <span>Speed</span>
                        <span className="text-[10px] text-zinc-400">{playbackRate}x</span>
                      </button>
                    </div>
                  )}

                  {activeSettingsMenu === "quality" && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => setActiveSettingsMenu("main")}
                        className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 hover:bg-zinc-800 transition-colors text-left text-purple-400 font-bold"
                      >
                        <span>&larr;</span>
                        <span>Quality</span>
                      </button>
                      {["Auto", "1080p", "720p", "480p", "360p"].map((q) => (
                        <button
                          key={q}
                          onClick={() => changeQuality(q)}
                          className={`px-4 py-2 hover:bg-zinc-800 transition-colors text-left flex items-center justify-between ${
                            quality === q ? "text-purple-400" : ""
                          }`}
                        >
                          <span>{q}</span>
                          {quality === q && <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsMenu === "speed" && (
                    <div className="flex flex-col max-h-48 overflow-y-auto">
                      <button
                        onClick={() => setActiveSettingsMenu("main")}
                        className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 hover:bg-zinc-800 transition-colors text-left text-purple-400 font-bold"
                      >
                        <span>&larr;</span>
                        <span>Playback Speed</span>
                      </button>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className={`px-4 py-2 hover:bg-zinc-800 transition-colors text-left flex items-center justify-between ${
                            playbackRate === rate ? "text-purple-400" : ""
                          }`}
                        >
                          <span>{rate}x</span>
                          {playbackRate === rate && <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;