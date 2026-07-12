"use client";

import React, { useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

interface ProjectViewImage {
  driveFileId: string;
  name: string;
  previewUrl: string;
  viewUrl?: string;
  modifiedAt?: string;
}

interface ProjectViewsCarouselProps {
  images: ProjectViewImage[];
  loading?: boolean;
  uploading?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  showDriveLink?: boolean;
}

const ProjectViewsCarousel: React.FC<ProjectViewsCarouselProps> = ({
  images,
  loading = false,
  uploading = false,
  onUpload,
  showDriveLink = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeIndex = useMemo(() => {
    if (images.length === 0) return 0;
    return Math.min(activeIndex, images.length - 1);
  }, [activeIndex, images.length]);

  const activeImage = images[safeIndex];

  const goPrev = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const openFullscreenView = () => {
    if (!activeImage) return;
    setIsFullscreenOpen(true);
  };

  const closeFullscreenView = () => {
    setIsFullscreenOpen(false);
  };

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!onUpload) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    try {
      await onUpload(selectedFiles);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Project Views
        </h3>
        {onUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-700 dark:hover:bg-brand-800"
            >
              {uploading ? "Uploading..." : "Upload Images"}
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500" />
        </div>
      ) : images.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No images found in the Views folder yet.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div
            role="button"
            tabIndex={0}
            onClick={openFullscreenView}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFullscreenView();
              }
            }}
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-left transition hover:border-brand-400 dark:border-gray-800 dark:bg-gray-900"
            aria-label={`Open ${activeImage.name} in full screen`}
          >
            <div className="aspect-[16/9] w-full">
              <img
                src={activeImage.previewUrl}
                alt={activeImage.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 opacity-0 transition group-hover:opacity-100">
              <span className="text-xs font-medium text-white">
                Click to view full screen
              </span>
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/75"
                  aria-label="Previous image"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/75"
                  aria-label="Next image"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                {activeImage.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(activeImage.modifiedAt)}
              </p>
            </div>
            {showDriveLink && activeImage.viewUrl && (
              <a
                href={activeImage.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Open in Drive
              </a>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image.driveFileId}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsFullscreenOpen(true);
                  }}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition ${
                    safeIndex === index
                      ? "border-brand-500 ring-2 ring-brand-500/30"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  aria-label={`View ${image.name}`}
                >
                  <img
                    src={image.previewUrl}
                    alt={image.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isFullscreenOpen}
        onClose={closeFullscreenView}
        isFullscreen={true}
        showCloseButton={true}
        className="bg-black/95"
      >
        {activeImage && (
          <div className="flex h-full w-full flex-col bg-black/95 text-white">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{activeImage.name}</p>
                <p className="text-xs text-white/60">
                  {formatDate(activeImage.modifiedAt)}
                </p>
              </div>
              {showDriveLink && activeImage.viewUrl && (
                <a
                  href={activeImage.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  Open in Drive
                </a>
              )}
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
              <img
                src={activeImage.previewUrl}
                alt={activeImage.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="border-t border-white/10 px-4 py-3 sm:px-6">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image.driveFileId}
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition ${
                        safeIndex === index
                          ? "border-brand-400 ring-2 ring-brand-400/40"
                          : "border-white/20"
                      }`}
                      aria-label={`View ${image.name}`}
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectViewsCarousel;
