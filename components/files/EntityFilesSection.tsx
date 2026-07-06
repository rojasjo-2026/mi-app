"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, TouchEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type FileItem = {
  file_id: string;
  file_name: string;
  file_url: string;
  file_path?: string | null;
  file_type?: string | null;
  created_at?: string | null;
};

type PreviewFile = {
  file: File;
  previewUrl: string;
};

type SortOption = "newest" | "oldest" | "type";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFileItem(value: unknown): value is FileItem {
  return (
    isRecord(value) &&
    typeof value.file_id === "string" &&
    typeof value.file_name === "string" &&
    typeof value.file_url === "string"
  );
}

function getErrorMessage(data: unknown, fallback: string) {
  if (isRecord(data) && typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}

function normalizeFilesPayload(data: unknown) {
  if (Array.isArray(data)) {
    return data.filter(isFileItem);
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.filter(isFileItem);
  }

  return [];
}

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `El endpoint devolvió una respuesta no válida (${res.status}). ${raw.slice(
        0,
        200,
      )}`,
    );
  }

  return JSON.parse(raw) as unknown;
}

function sanitizeFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const name = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension =
    lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : "";

  const safeName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${safeName || "archivo"}${extension}`;
}

function isImage(file: FileItem) {
  return (
    file.file_type?.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(file.file_name)
  );
}

function isPdf(file: FileItem) {
  return file.file_type === "application/pdf" || /\.pdf$/i.test(file.file_name);
}

function isPreviewImage(file: File) {
  return file.type.startsWith("image/");
}

function isPreviewPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function getFileLabel(file: FileItem) {
  if (isImage(file)) return "Imagen";
  if (isPdf(file)) return "PDF";
  return "Archivo";
}

function getPreviewLabel(file: File) {
  if (file.type.startsWith("image/")) return "Imagen";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return "PDF";
  }

  return "Archivo";
}

function getFileTypeOrder(file: FileItem) {
  if (isImage(file)) return 1;
  if (isPdf(file)) return 2;
  return 3;
}

function formatFileDate(
  value?: string | null,
  locale?: string,
  timeZone?: string,
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(
    locale,
    timeZone
      ? {
          timeZone,
        }
      : undefined,
  );
}

type EntityFilesSectionProps = {
  entityType: "follow_up" | "installation";
  entityId: string;
  storageFolder: "follow-ups" | "installations";
  eyebrow: string;
  title: string;
  description: string;
  emptyMessage: string;
  locale?: string;
  timeZone?: string;
};

export default function EntityFilesSection({
  entityType,
  entityId,
  storageFolder,
  eyebrow,
  title,
  description,
  emptyMessage,
  locale,
  timeZone,
}: EntityFilesSectionProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
    null,
  );
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const previewFilesRef = useRef<PreviewFile[]>([]);

  const fileCountLabel = useMemo(() => {
    if (files.length === 1) return "1 archivo";
    return `${files.length} archivos`;
  }, [files.length]);

  const sortedFiles = useMemo(() => {
    const copiedFiles = [...files];

    if (sortOption === "oldest") {
      return copiedFiles.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
    }

    if (sortOption === "type") {
      return copiedFiles.sort((a, b) => {
        const typeA = getFileTypeOrder(a);
        const typeB = getFileTypeOrder(b);

        if (typeA !== typeB) return typeA - typeB;
        return a.file_name.localeCompare(b.file_name);
      });
    }

    return copiedFiles.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [files, sortOption]);

  const selectedFile =
    selectedFileIndex !== null ? sortedFiles[selectedFileIndex] : null;

  const loadFiles = useCallback(
    async (showLoadingState = true) => {
      try {
        if (showLoadingState) {
          setLoading(true);
        }

        const res = await fetch(
          `/api/files?entity_type=${entityType}&entity_id=${entityId}`,
          {
            cache: "no-store",
          },
        );

        const data = await parseResponse(res);

        if (!res.ok) {
          throw new Error(
            getErrorMessage(data, "No se pudieron cargar los archivos"),
          );
        }

        const normalizedFiles = normalizeFilesPayload(data);

        setFiles(normalizedFiles);
        return normalizedFiles;
      } catch (error) {
        console.error("Error loading entity files:", error);
        return [];
      } finally {
        if (showLoadingState) {
          setLoading(false);
        }
      }
    },
    [entityId, entityType],
  );

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    previewFilesRef.current = previewFiles;
  }, [previewFiles]);

  useEffect(() => {
    return () => {
      previewFilesRef.current.forEach((previewFile) => {
        URL.revokeObjectURL(previewFile.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedFileIndex === null) return;

      if (e.key === "Escape") {
        closeFileModal();
      }

      if (e.key === "ArrowLeft") {
        goToPreviousFile();
      }

      if (e.key === "ArrowRight") {
        goToNextFile();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedFileIndex, sortedFiles.length]);

  function addSelectedFiles(selectedFiles: FileList | File[]) {
    const filesArray = Array.from(selectedFiles);

    if (filesArray.length === 0) return;

    setPreviewFiles((currentPreviewFiles) => {
      const nextPreviewFiles = filesArray.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...currentPreviewFiles, ...nextPreviewFiles];
    });
  }

  function removePreviewFile(indexToRemove: number) {
    setPreviewFiles((currentPreviewFiles) => {
      const previewFileToRemove = currentPreviewFiles[indexToRemove];

      if (previewFileToRemove?.previewUrl) {
        URL.revokeObjectURL(previewFileToRemove.previewUrl);
      }

      return currentPreviewFiles.filter((_, index) => index !== indexToRemove);
    });
  }

  function clearPreviewFiles() {
    previewFiles.forEach((previewFile) => {
      URL.revokeObjectURL(previewFile.previewUrl);
    });

    setPreviewFiles([]);
  }

  async function uploadSelectedFiles() {
    if (previewFiles.length === 0 || !entityId) return;

    try {
      setUploading(true);
      setUploadProgress({
        current: 0,
        total: previewFiles.length,
      });

      for (let index = 0; index < previewFiles.length; index += 1) {
        const { file } = previewFiles[index];

        setUploadProgress({
          current: index + 1,
          total: previewFiles.length,
        });

        const safeFileName = sanitizeFileName(file.name);
        const uniqueFileName = `${crypto.randomUUID()}-${safeFileName}`;
        const filePath = `${storageFolder}/${entityId}/${uniqueFileName}`;

        const { error } = await supabase.storage
          .from("files")
          .upload(filePath, file);

        if (error) {
          console.error(error);
          alert(error.message || "No se pudo subir el archivo");
          return;
        }

        const { data } = supabase.storage.from("files").getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const res = await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            file_name: file.name,
            file_url: publicUrl,
            file_path: filePath,
            file_type: file.type,
          }),
        });

        const result = await parseResponse(res);

        if (!res.ok) {
          throw new Error(
            getErrorMessage(result, "No se pudo guardar el archivo"),
          );
        }

        if (isRecord(result) && result.success === false) {
          throw new Error(
            getErrorMessage(result, "No se pudo guardar el archivo"),
          );
        }
      }

      clearPreviewFiles();

      const updatedFiles = await loadFiles(false);

      if (updatedFiles.length > 0) {
        setSelectedFileIndex(0);
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al subir el archivo");
    } finally {
      setUploading(false);
      setUploadProgress({
        current: 0,
        total: 0,
      });
    }
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    addSelectedFiles(selectedFiles);
    e.target.value = "";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const selectedFiles = e.dataTransfer.files;
    if (!selectedFiles) return;

    addSelectedFiles(selectedFiles);
  }

  function openFileModal(index: number) {
    setSelectedFileIndex(index);
  }

  function closeFileModal() {
    setSelectedFileIndex(null);
    setTouchStartX(null);
  }

  function goToPreviousFile() {
    setSelectedFileIndex((currentIndex) => {
      if (currentIndex === null || sortedFiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === 0 ? sortedFiles.length - 1 : currentIndex - 1;
    });
  }

  function goToNextFile() {
    setSelectedFileIndex((currentIndex) => {
      if (currentIndex === null || sortedFiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === sortedFiles.length - 1 ? 0 : currentIndex + 1;
    });
  }

  function handleModalTouchStart(e: TouchEvent<HTMLDivElement>) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleModalTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null || sortedFiles.length <= 1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX;

    if (distance > 60) {
      goToPreviousFile();
    }

    if (distance < -60) {
      goToNextFile();
    }

    setTouchStartX(null);
  }

  async function handleDelete(fileId: string) {
    const confirmDelete = confirm("¿Seguro que desea eliminar este archivo?");

    if (!confirmDelete) return;

    try {
      setDeletingId(fileId);

      const res = await fetch(`/api/files?file_id=${fileId}`, {
        method: "DELETE",
      });

      const result = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          getErrorMessage(result, "No se pudo eliminar el archivo"),
        );
      }

      if (isRecord(result) && result.success === false) {
        throw new Error(
          getErrorMessage(result, "No se pudo eliminar el archivo"),
        );
      }

      await loadFiles(false);

      if (selectedFile?.file_id === fileId) {
        closeFileModal();
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el archivo");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {eyebrow}
            </p>

            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            {fileCountLabel}
          </span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-5 rounded-3xl border border-dashed p-5 transition ${
            isDragging
              ? "border-slate-900 bg-slate-100"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {previewFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-3xl shadow-sm">
                📁
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Arrastre uno o varios archivos aquí
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  También puede seleccionar archivos desde su dispositivo.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {previewFiles.map((previewFile, index) => (
                  <article
                    key={`${previewFile.file.name}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:scale-[1.01] hover:shadow-md"
                  >
                    {isPreviewImage(previewFile.file) ? (
                      <img
                        src={previewFile.previewUrl}
                        alt={previewFile.file.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-50">
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center">
                          <p className="text-3xl">
                            {isPreviewPdf(previewFile.file) ? "📄" : "📎"}
                          </p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            {getPreviewLabel(previewFile.file)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 p-4">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {previewFile.file.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => removePreviewFile(index)}
                        disabled={uploading}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void uploadSelectedFiles()}
                  disabled={uploading}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {uploading
                    ? `Subiendo ${uploadProgress.current}/${uploadProgress.total}`
                    : previewFiles.length === 1
                      ? "Subir archivo"
                      : "Subir archivos"}
                </button>

                <button
                  type="button"
                  onClick={clearPreviewFiles}
                  disabled={uploading}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>

              {uploading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Procesando archivo {uploadProgress.current} de{" "}
                  {uploadProgress.total}.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!loading && files.length > 0 ? (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-600">
              Archivos guardados
            </p>

            <label className="flex items-center gap-2 text-sm text-slate-500">
              Ordenar por
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="type">Tipo de archivo</option>
              </select>
            </label>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Cargando archivos...
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedFiles.map((file, index) => (
              <article
                key={file.file_id}
                onClick={() => openFileModal(index)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm transition hover:scale-[1.01] hover:shadow-md"
              >
                {isImage(file) ? (
                  <div className="block w-full text-left">
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="h-44 w-full object-cover transition hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-white">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                      <p className="text-3xl">
                        {getFileLabel(file) === "PDF" ? "📄" : "📎"}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {getFileLabel(file)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4">
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {file.file_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatFileDate(file.created_at, locale, timeZone)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileModal(index);
                      }}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Ver
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(file.file_id);
                      }}
                      disabled={deletingId === file.file_id}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === file.file_id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div
            onTouchStart={handleModalTouchStart}
            onTouchEnd={handleModalTouchEnd}
            className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedFile.file_name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedFileIndex !== null ? selectedFileIndex + 1 : 1} de{" "}
                  {sortedFiles.length}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFileModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700 transition hover:bg-slate-200"
                aria-label="Cerrar vista previa"
              >
                ×
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-100">
              {sortedFiles.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousFile}
                    className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-700 shadow transition hover:bg-white"
                    aria-label="Archivo anterior"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={goToNextFile}
                    className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-700 shadow transition hover:bg-white"
                    aria-label="Archivo siguiente"
                  >
                    ›
                  </button>
                </>
              ) : null}

              {isImage(selectedFile) ? (
                <img
                  src={selectedFile.file_url}
                  alt={selectedFile.file_name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : isPdf(selectedFile) ? (
                <iframe
                  src={selectedFile.file_url}
                  title={selectedFile.file_name}
                  className="h-full w-full border-0 bg-white"
                />
              ) : (
                <div className="m-6 rounded-3xl bg-white p-8 text-center shadow-sm">
                  <p className="text-4xl">📎</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Vista previa no disponible
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Este tipo de archivo puede abrirse en una nueva pestaña.
                  </p>
                  <a
                    href={selectedFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Abrir archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
