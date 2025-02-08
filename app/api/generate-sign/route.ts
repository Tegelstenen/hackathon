// /app/api/generate-sign/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Read the incoming payload.
    const payload = await request.json();

    // Forward the payload to the Docker container running the sign-generator.
    const response = await fetch("http://localhost:8000/generate-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Sign generation failed." },
        { status: response.status }
      );
    }

    // Return the JSON response directly.
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error in /api/generate-sign:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}