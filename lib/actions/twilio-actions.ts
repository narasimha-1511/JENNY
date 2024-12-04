export async function makeCall(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  to: string,
  joinUrl: string
) {
  try {
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

    return { success: true, data: response };
  } catch (error) {
    console.log("error while call using twiio", error);
    return { success: false, error: `Failed to make call: ${error}` };
  }
}

export async function getTwilioCredentials(userId: string) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("twilio_credentials")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get Twilio credentials: ${error}`,
    };
  }
}
