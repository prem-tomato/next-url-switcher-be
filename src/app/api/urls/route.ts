import { query } from "@/db/connect-db";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Replace '*' with your Vite URL if needed, e.g. "http://localhost:5173"
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  // Handle CORS preflight request
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export const GET = async () => {
  try {
    const res = await query(
      `SELECT * FROM urls WHERE "isDeleted" = false ORDER BY "createdAt" DESC`
    );

    return NextResponse.json(
      {
        success: true,
        data: res.rows.map((row) => ({
          ...row,
          createdAt: row.createdAt?.toISOString(),
          updatedAt: row.updatedAt?.toISOString(),
          deletedAt: row.deletedAt?.toISOString(),
        })),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Query error:", err);
      return NextResponse.json(
        { error: err.message },
        {
          status: 500,
          headers: CORS_HEADERS,
        }
      );
    }
    console.error("Unknown error", err);
    return NextResponse.json(
      { error: "Unknown error occurred" },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    // You can add explicit typing for request body here
    interface UrlRequestBody {
      name: string;
      mainUrl: string;
      subUrls?: Record<string, string>;
    }

    const { name, mainUrl, subUrls = {} } = body as UrlRequestBody;

    const res = await query(
      `INSERT INTO urls (
            "name", 
            "mainUrl", 
            "subUrls",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3::jsonb, NOW(), NOW()) RETURNING *`,
      [name, mainUrl, JSON.stringify(subUrls)]
    );

    const row = res.rows[0];
    const serializedRow = {
      ...row,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedRow,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Query error:", err);
      return NextResponse.json(
        { error: err.message },
        {
          status: 500,
          headers: CORS_HEADERS,
        }
      );
    }
    console.error("Unknown error", err);
    return NextResponse.json(
      { error: "Unknown error occurred" },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};
