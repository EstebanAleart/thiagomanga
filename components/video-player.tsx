"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings,
} from "lucide-react";

interface VideoSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface Subtitle {
  url: string;
  lang: string;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  subtitles?: Subtitle[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export function VideoPlayer({
  sources,
  subtitles = [],
  intro,
  outro,
  onNextEpisode,
  onPrevEpisode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<string>("default");
  const [showSettings, setShowSettings] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Find the best source (prefer m3u8)
  const m3u8Source = sources.find((s) => s.isM3U8);
  const selectedSource = sources.find((s) => s.quality === selectedQuality) || m3u8Source || sources[0];

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedSource) return;

    if (selectedSource.isM3U8) {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          // Safari native HLS
          video.src = selectedSource.url;
          return;
        }
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(selectedSource.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (playing) video.play();
        });
        hlsRef.current = hls;
      });
    } else {
      video.src = selectedSource.url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedSource?.url]);

  // Subtitles
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Remove existing tracks
    while (video.firstChild) {
      if (video.firstChild instanceof HTMLTrackElement) {
        video.removeChild(video.firstChild);
      } else break;
    }
    subtitles.forEach((sub, i) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = sub.lang;
      track.src = sub.url;
      if (i === 0) track.default = true;
      video.appendChild(track);
    });
  }, [subtitles]);

  // Time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      // Buffered
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      // Skip intro/outro buttons
      if (intro) {
        setShowSkipIntro(video.currentTime >= intro.start && video.currentTime < intro.end);
      }
      if (outro) {
        setShowSkipOutro(video.currentTime >= outro.start && video.currentTime < outro.end);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [intro, outro]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolume(video.volume);
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolume(video.volume);
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          setMuted(video.muted);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [playing, resetHideTimer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      el.requestFullscreen();
      setFullscreen(true);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const qualities = sources.map((s) => s.quality).filter((q) => q !== "default");

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Skip intro button */}
      {showSkipIntro && (
        <button
          onClick={() => { if (videoRef.current && intro) videoRef.current.currentTime = intro.end; }}
          className="absolute bottom-24 right-4 bg-white/90 text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white transition-colors z-20"
        >
          Saltar intro
        </button>
      )}

      {/* Skip outro button */}
      {showSkipOutro && onNextEpisode && (
        <button
          onClick={onNextEpisode}
          className="absolute bottom-24 right-4 bg-white/90 text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white transition-colors z-20"
        >
          Siguiente episodio
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="w-full h-1.5 bg-white/20 cursor-pointer mx-0 group/progress hover:h-3 transition-all"
          onClick={seekTo}
        >
          <div
            className="h-full bg-white/30 absolute"
            style={{ width: duration ? `${(buffered / duration) * 100}%` : "0%" }}
          />
          <div
            className="h-full bg-primary relative z-10"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Prev */}
          {onPrevEpisode && (
            <button onClick={onPrevEpisode} className="text-white/80 hover:text-white p-1">
              <SkipBack className="h-5 w-5" />
            </button>
          )}

          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-white/80 p-1">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>

          {/* Next */}
          {onNextEpisode && (
            <button onClick={onNextEpisode} className="text-white/80 hover:text-white p-1">
              <SkipForward className="h-5 w-5" />
            </button>
          )}

          {/* Volume */}
          <button
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
            className="text-white/80 hover:text-white p-1"
          >
            {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              setMuted(v === 0);
              if (videoRef.current) {
                videoRef.current.volume = v;
                videoRef.current.muted = v === 0;
              }
            }}
            className="w-20 accent-primary"
          />

          {/* Time */}
          <span className="text-white/80 text-xs ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Quality */}
          {qualities.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/80 hover:text-white p-1"
              >
                <Settings className="h-5 w-5" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]">
                  <p className="text-white/50 text-xs mb-1 px-2">Calidad</p>
                  {["default", ...qualities].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setSelectedQuality(q); setShowSettings(false); }}
                      className={`block w-full text-left px-2 py-1 text-sm rounded ${
                        selectedQuality === q ? "text-primary" : "text-white/80 hover:text-white"
                      }`}
                    >
                      {q === "default" ? "Auto" : q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white p-1">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Center play button when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="bg-black/50 rounded-full p-4">
            <Play className="h-12 w-12 text-white" />
          </div>
        </button>
      )}
    </div>
  );
}
