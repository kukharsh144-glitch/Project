import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, FileVideo, FileImage, X } from "lucide-react";
import { publishAVideo } from "../../api/videos.js";
import ThumbnailEditor from "../../components/ThumbnailEditor.jsx";

export const Upload = () => {
  const { register, handleSubmit, reset } = useForm();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [rawThumbnail, setRawThumbnail] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedPreview, setCroppedPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [croppedPreview, videoPreview]);

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRawThumbnail(e.target.files[0]);
      setShowCropper(true);
    }
  };

  const handleCropSave = (croppedFile) => {
    setThumbnailFile(croppedFile);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setCroppedPreview(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const onSubmit = async (data) => {
    if (!videoFile) {
      toast.error("Video file is required");
      return;
    }
    if (!thumbnailFile) {
      toast.error("Thumbnail image is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("videoFile", videoFile);
      formData.append("thumbnail", thumbnailFile);

      await publishAVideo(formData);
      toast.success("Video published successfully!");
      reset();
      setVideoFile(null);
      setThumbnailFile(null);
      setRawThumbnail(null);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
      setCroppedPreview("");
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview("");
      navigate("/studio/videos");
    } catch (err) {
      toast.error(err.message || "Failed to publish video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">Upload Content</h1>
        <p className="text-sm text-zinc-500 mt-1">Publish new video content and custom thumbnails</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col gap-6 shadow-sm">
        {/* Upload Dropzones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Dropzone */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-500">Video File (MP4/WebM)</span>
            <label className={`border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-zinc-100/30 transition-colors h-48 text-center overflow-hidden ${videoPreview ? "p-0" : "p-6"}`}>
              {videoPreview ? (
                <div className="w-full h-full relative group">
                  <video src={videoPreview} controls className="w-full h-full object-contain bg-black" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setVideoFile(null);
                      if (videoPreview) URL.revokeObjectURL(videoPreview);
                      setVideoPreview("");
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-1.5 rounded-full text-white/80 hover:text-white transition-all active:scale-95 z-10"
                    title="Remove Video"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-zinc-400" />
                  <span className="text-xs font-bold">Select video file</span>
                  <span className="text-[10px] text-zinc-400">Click or drag files here</span>
                </>
              )}
              <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
            </label>
          </div>

          {/* Thumbnail Dropzone */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-500">Thumbnail Image (PNG/JPG)</span>
            <label className={`border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-zinc-100/30 transition-colors h-48 text-center overflow-hidden ${croppedPreview ? "p-0" : "p-6"}`}>
              {croppedPreview ? (
                <div className="w-full h-full relative group">
                  <img src={croppedPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl text-white text-xs font-bold">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowCropper(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      Edit Crop
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setThumbnailFile(null);
                        setRawThumbnail(null);
                        if (croppedPreview) URL.revokeObjectURL(croppedPreview);
                        setCroppedPreview("");
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-zinc-400" />
                  <span className="text-xs font-bold">Select thumbnail</span>
                  <span className="text-[10px] text-zinc-400">Click or drag images here</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            </label>
          </div>
        </div>

        {showCropper && rawThumbnail && (
          <ThumbnailEditor
            file={rawThumbnail}
            onSave={handleCropSave}
            onCancel={() => setShowCropper(false)}
          />
        )}

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-zinc-500">Title</label>
          <input
            type="text"
            placeholder="Add a title that catches interest"
            {...register("title", { required: true })}
            className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-zinc-500">Description</label>
          <textarea
            placeholder="Tell viewers what your video is about"
            rows={5}
            {...register("description")}
            className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-98 disabled:opacity-50"
        >
          {loading ? "Publishing Video & Processing Files..." : "Publish Video"}
        </button>
      </form>
    </div>
  );
};

export default Upload;
