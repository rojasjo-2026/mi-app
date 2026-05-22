import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServerClient";
import { recordInstallationFileActivitySafely } from "@/lib/files/fileActivityLog.service";

function getStoragePathFromPublicUrl(fileUrl: string) {
  const marker = "/storage/v1/object/public/files/";

  if (!fileUrl.includes(marker)) {
    return null;
  }

  return fileUrl.split(marker)[1] || null;
}

function isMultipartRequest(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  return contentType.includes("multipart/form-data");
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");

    if (!entityType || !entityId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing entity_type or entity_id",
          data: [],
        },
        { status: 400 },
      );
    }

    const files = await prisma.file.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error("GET /api/files error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load files",
        data: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    if (isMultipartRequest(req)) {
      const formData = await req.formData();

      const uploadedFile = formData.get("file");
      const entityType = String(formData.get("entity_type") || "").trim();
      const entityId = String(formData.get("entity_id") || "").trim();

      if (!(uploadedFile instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            message: "Missing file",
            data: null,
          },
          { status: 400 },
        );
      }

      if (!entityType || !entityId) {
        return NextResponse.json(
          {
            success: false,
            message: "Missing entity_type or entity_id",
            data: null,
          },
          { status: 400 },
        );
      }

      const safeFileName = sanitizeFileName(uploadedFile.name);
      const storagePath = `${entityType}/${entityId}/${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabaseServer.storage
        .from("files")
        .upload(storagePath, uploadedFile, {
          contentType: uploadedFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload file error:", uploadError);

        return NextResponse.json(
          {
            success: false,
            message: "Failed to upload file",
            data: null,
          },
          { status: 500 },
        );
      }

      const { data: publicUrlData } = supabaseServer.storage
        .from("files")
        .getPublicUrl(storagePath);

      const fileUrl = publicUrlData.publicUrl;

      const file = await prisma.file.create({
        data: {
          entity_type: entityType,
          entity_id: entityId,
          file_name: uploadedFile.name,
          file_url: fileUrl,
          file_path: storagePath,
          file_type: uploadedFile.type || "application/octet-stream",
        },
      });

      await recordInstallationFileActivitySafely({
        entityType,
        entityId,
        fileName: uploadedFile.name,
        action: "FILE_ADDED",
      });

      return NextResponse.json(
        {
          success: true,
          data: file,
        },
        { status: 201 },
      );
    }

    const body = await req.json();

    const entityType = String(body.entity_type || "").trim();
    const entityId = String(body.entity_id || "").trim();
    const fileName = String(body.file_name || "").trim();

    const file = await prisma.file.create({
      data: {
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        file_name: body.file_name,
        file_url: body.file_url,
        file_path: body.file_path,
        file_type: body.file_type,
      },
    });

    await recordInstallationFileActivitySafely({
      entityType,
      entityId,
      fileName,
      action: "FILE_ADDED",
    });

    return NextResponse.json(
      {
        success: true,
        data: file,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/files error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save file",
        data: null,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing file_id",
          data: null,
        },
        { status: 400 },
      );
    }

    const file = await prisma.file.findUnique({
      where: {
        file_id: fileId,
      },
    });

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "File not found",
          data: null,
        },
        { status: 404 },
      );
    }

    const storagePath =
      file.file_path || getStoragePathFromPublicUrl(file.file_url);

    if (storagePath) {
      const { error } = await supabaseServer.storage
        .from("files")
        .remove([storagePath]);

      if (error) {
        console.error("Supabase delete file error:", error);
      }
    }

    await prisma.file.delete({
      where: {
        file_id: fileId,
      },
    });

    await recordInstallationFileActivitySafely({
      entityType: file.entity_type,
      entityId: file.entity_id,
      fileName: file.file_name,
      action: "FILE_REMOVED",
    });

    return NextResponse.json({
      success: true,
      message: "File deleted",
      data: file,
    });
  } catch (error) {
    console.error("DELETE /api/files error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete file",
        data: null,
      },
      { status: 500 },
    );
  }
}
