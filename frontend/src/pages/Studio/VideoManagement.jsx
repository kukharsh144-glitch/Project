import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Trash2, Edit3, Eye, Calendar, ToggleLeft, ToggleRight, MessageSquare, ThumbsUp } from "lucide-react";
import { getChannelVideos } from "../../api/dashboard.js";
import { deleteVideo, togglePublishStatus, updateVideo } from "../../api/videos.js";
import Modal from "../../components/Modal.jsx";
import { Skeleton } from "../../components/Skeleton.jsx";
import { formatRelativeTime } from "../../components/VideoCard.jsx";
import ThumbnailEditor from "../../components/ThumbnailEditor.jsx";

export const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVideo, setEditVideo] = useState(null);
  const [editThumbnail, setEditThumbnail] = useState(null);
  const [rawThumbnail, setRawThumbnail] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedPreview, setCroppedPreview] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    return () => {
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    };
  }, [croppedPreview]);

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRawThumbnail(e.target.files[0]);
      setShowCropper(true);
    }
  };

  const handleCropSave = (croppedFile) => {
    setEditThumbnail(croppedFile);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setCroppedPreview(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const fetchVideos = async () => {
    try {
      const response = await getChannelVideos({ page: 1, limit: 100 });
      // Backend returns: { docs: [videos], totalVideos, ... }
      const docs = response.data?.videos || response.data || [];
      setVideos(docs);
    } catch (err) {
      toast.error(err.message || "Failed to load creator videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleTogglePublish = async (videoId) => {
    try {
      await togglePublishStatus(videoId);
      toast.success("Visibility toggled successfully");
      fetchVideos();
    } catch (err) {
      toast.error(err.message || "Failed to toggle visibility");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    const confirm = window.confirm("Are you sure you want to delete this video? (It will be unpublished)");
    if (!confirm) return;

    try {
      await deleteVideo(videoId);
      toast.success("Video deleted successfully");
      fetchVideos();
    } catch (err) {
      toast.error(err.message || "Failed to delete video");
    }
  };

  const handleOpenEditModal = (video) => {
    setEditVideo(video);
    setValue("title", video.title);
    setValue("description", video.description);
    setEditThumbnail(null);
    setRawThumbnail(null);
    setCroppedPreview("");
  };

  const handleCloseEditModal = () => {
    setEditVideo(null);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setCroppedPreview("");
  };

  const handleEditSubmit = async (data) => {
    setEditLoading(true);
    try {
      const formData = new FormData();
      if (data.title?.trim()) {
        formData.append("title", data.title.trim());
      }
      if (data.description?.trim()) {
        formData.append("description", data.description.trim());
      }
      if (editThumbnail) {
        formData.append("thumbnail", editThumbnail);
      }

      await updateVideo(editVideo._id, formData);
      toast.success("Video updated successfully!");
      setEditVideo(null);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
      setCroppedPreview("");
      fetchVideos();
    } catch (err) {
      toast.error(err.message || "Failed to update video");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">Content Manager</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and edit your video catalog</p>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="font-bold text-zinc-700 dark:text-zinc-300">No videos uploaded yet</p>
          <p className="text-xs text-zinc-500 mt-1">Go to the upload page to publish your first content!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-zinc-250 dark:divide-zinc-800 text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Video</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
              {videos.map((video) => (
                <tr key={video._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-6 py-4 flex gap-3 items-center">
                    <img src={video.thumbnail?.url} alt={video.title} className="w-16 h-10 object-cover rounded-md flex-shrink-0" />
                    <span className="font-bold line-clamp-1 max-w-[200px]">{video.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublish(video._id)}
                      className="focus:outline-none"
                      title="Click to toggle publish status"
                    >
                      {video.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <ToggleRight className="h-4 w-4" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <ToggleLeft className="h-4 w-4" /> Unlisted
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">{video.views}</td>
                  <td className="px-6 py-4">{formatRelativeTime(video.createdAt)}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2.5">
                    <button
                      onClick={() => handleOpenEditModal(video)}
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title="Edit metadata"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video._id)}
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-650 dark:hover:bg-zinc-800"
                      title="Delete video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Details Modal */}
      <Modal isOpen={!!editVideo} onClose={handleCloseEditModal} title="Edit Video Metadata">
        <form onSubmit={handleSubmit(handleEditSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500">Video Title</label>
            <input
              type="text"
              {...register("title", { required: true })}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500">Video Description</label>
            <textarea
              rows={4}
              {...register("description")}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500">Replace Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-950/40 dark:file:text-purple-400 hover:file:bg-purple-100"
            />
            {croppedPreview && (
              <div className="mt-2 w-full max-w-[240px] aspect-video border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative group">
                <img src={croppedPreview} alt="Cropped Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-[10px] text-white font-bold">
                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                  >
                    Edit Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditThumbnail(null);
                      setRawThumbnail(null);
                      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
                      setCroppedPreview("");
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 mt-2">
            <button
              onClick={handleCloseEditModal}
              type="button"
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {showCropper && rawThumbnail && (
        <ThumbnailEditor
          file={rawThumbnail}
          onSave={handleCropSave}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
};

export default VideoManagement;
