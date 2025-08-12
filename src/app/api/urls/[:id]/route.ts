import { query } from "@/db/connect-db";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

const UrlCreateSchema = z.object({
  name: z.string().min(1),
  mainUrl: z.string().min(1),
  subUrls: z.record(z.string(), z.string()).optional(),
});

export const PUT = async (req: NextRequest) => {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // get id from URL
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id parameter" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const body = await req.json();
    const parse = UrlCreateSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: parse.error.message },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { name, mainUrl, subUrls = {} } = parse.data;

    // Check exists and not deleted
    const checkQ = `SELECT id FROM urls WHERE id = $1 AND "isDeleted" = false LIMIT 1`;
    const check = await query(checkQ, [id]);
    if (check.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "URL not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const q = `
      UPDATE urls
      SET name = $1, "mainUrl" = $2, "subUrls" = $3::jsonb, "updatedAt" = NOW()
      WHERE id = $4
      RETURNING id, name, "mainUrl", "subUrls", "isDeleted", "createdAt", "updatedAt", "deletedAt"
    `;
    const result = await query(q, [name, mainUrl, JSON.stringify(subUrls), id]);
    const row = result.rows[0];

    const serializedRow = {
      ...row,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    };

    return NextResponse.json(
      { success: true, data: serializedRow },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("Error updating URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update URL" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // get id from URL
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id parameter" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const q = `
      UPDATE urls
      SET "isDeleted" = true, "deletedAt" = NOW()
      WHERE id = $1
      RETURNING id
    `;
    const result = await query(q, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "URL not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { success: true, message: "URL deleted successfully" },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("Error deleting URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete URL" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
