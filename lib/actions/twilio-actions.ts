import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function makeCall(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  to: string,
  joinUrl: string
) {
  try {
    if (!accountSid || !authToken || !fromNumber || !to || !joinUrl) {
      return {
        success: false,
        error: "Missing required parameters for Twilio call",
      };
    }

    const response = await fetch("/api/twilio/call", {
      method: "POST",
      headers: {
        content: "application/json",
      },
      body: JSON.stringify({
        accountSid,
        authToken,
        fromNumber,
        to,
        joinUrl,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error while making Twilio call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getTwilioCredentials(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const { data, error } = await supabase
      .from("twilio_credentials")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching Twilio credentials:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get Twilio credentials",
    };
  }
}
