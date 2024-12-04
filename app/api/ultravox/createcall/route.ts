import { NextResponse, NextRequest } from "next/server";
import { CallConfig } from "@/lib/types";

export const runtime = "nodejs"; // Specify Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const body: CallConfig = await request.json();

    if (!process.env.ULTRAVOX_API_KEY) {
      throw new Error("ULTRAVOX_API_KEY is not configured");
    }

    console.log("Attempting to call Ultravox API...");
    const response = await fetch("https://api.ultravox.ai/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ULTRAVOX_API_KEY,
      },
      body: JSON.stringify(body),
    });

    console.log("Ultravox API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ultravox API error:", errorText);
      throw new Error(`Ultravox API error: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        error: "Error calling Ultravox API",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
