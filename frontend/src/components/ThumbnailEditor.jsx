import React, { useRef, useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Move, Check, X, RefreshCw } from "lucide-react";

export const ThumbnailEditor = ({ file, onSave, onCancel }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offsetX,
      y: e.touches[0].clientY - offsetY,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleCrop = () => {
    if (!imageRef.current) return;
    setProcessing(true);

    const img = new Image();
    img.src = imgSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");

      // Math mirroring the contain center-zoom translation
      const W = 320;
      const H = 180;
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const coverW = img.naturalWidth * scale;
      const coverH = img.naturalHeight * scale;
      const initX = (W - coverW) / 2;
      const initY = (H - coverH) / 2;

      const F = 1280 / W;

      const imgCenterX = initX + coverW / 2 + offsetX;
      const imgCenterY = initY + coverH / 2 + offsetY;

      const halfW = (coverW / 2) * zoom;
      const halfH = (coverH / 2) * zoom;

      const finalX = imgCenterX - halfW;
      const finalY = imgCenterY - halfH;

      const drawX = finalX * F;
      const drawY = finalY * F;
      const drawW = coverW * zoom * F;
      const drawH = coverH * zoom * F;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: file.type || "image/jpeg",
              lastModified: Date.now(),
            });
            onSave(croppedFile);
          } else {
            onSave(file);
          }
          setProcessing(false);
        },
        file.type || "image/jpeg",
        0.92
      );
    };
    img.onerror = () => {
      onSave(file);
      setProcessing(false);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[999] p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg flex flex-col gap-6 shadow-2xl animate-zoom-in animate-duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white">Adjust Thumbnail</h3>
            <span className="text-[10px] text-zinc-500 mt-0.5">Drag to reposition, use slider to zoom</span>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Box (Aspect-ratio 16:9) */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-zinc-800 cursor-move select-none"
        >
          {imgSrc && (
            <img
              ref={imageRef}
              src={imgSrc}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          )}
          
          {/* Guide Grid */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/5">
            <div className="border-r border-b border-white/5"></div>
            <div className="border-r border-b border-white/5"></div>
            <div className="border-b border-white/5"></div>
            <div className="border-r border-b border-white/5"></div>
            <div className="border-r border-b border-white/5"></div>
            <div className="border-b border-white/5"></div>
            <div className="border-r border-white/5"></div>
            <div className="border-r border-white/5"></div>
            <div></div>
          </div>

          {/* Reposition Mode Guide Icon */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] text-white/80 flex items-center gap-1 font-bold">
            <Move className="h-3 w-3" />
            <span>Repositionable</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-zinc-500" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
            />
            <ZoomIn className="h-4 w-4 text-zinc-500" />
            <span className="text-[10px] text-zinc-400 font-bold w-8 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
            <button
              onClick={handleReset}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={processing}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{processing ? "Saving..." : "Save Crop"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
