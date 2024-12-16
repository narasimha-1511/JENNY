import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

async function createCall(
  TWILIO_ACCOUNT_SID: string,
  TWILIO_AUTH_TOKEN: string,
  joinUrl: string,
  phoneNumber: string,
  from: string
) {
  try {
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Twiml: `<Response><Say>Hello, this is a test call.</Say><Connect><Stream url="${joinUrl}" /></Connect></Response>`,
          From: from,
          To: phoneNumber,
        }).toString(),
      }
    );

    if (!twilioResponse.ok) {
      throw new Error(`Twilio API error: ${await twilioResponse.text()}`);
    }

    const data = await twilioResponse.json();
    console.log("Twilio API response:", data);

    return data;
  } catch (error) {
    console.error("Failed to create twilio call:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { accountSid, authToken, fromNumber, to, joinUrl } =
      await request.json();

    if (!accountSid || !authToken || !fromNumber || !to || !joinUrl) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const result = await createCall(
      accountSid,
      authToken,
      joinUrl,
      to,
      fromNumber
    );

    console.log("Twilio API response:", result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in /api/twilio/call:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
