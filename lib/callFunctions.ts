import { CallConfig, JoinUrlResponse, TwilioConfig } from "@/lib/types";
import { UltravoxSession } from "ultravox-client";
import { makeCall as twilioMakeCall } from "./actions/twilio-actions";

let ultravoxSession: UltravoxSession | null = null;
let debugMessages: Set<string> = new Set(["debug"]);

async function createCall(
  callConfig: CallConfig,
  showDebugMessages?: boolean
): Promise<JoinUrlResponse> {
  try {
    if (showDebugMessages) {
      console.log(`Using model ${callConfig.model}`);
    }

    const response = await fetch(`/api/ultravox/createcall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...callConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data: JoinUrlResponse = await response.json();

    if (showDebugMessages) {
      console.log(`Call created. Join URL: ${data.joinUrl}`);
    }

    return data;
  } catch (error) {
    console.error("Error creating call:", error);
    throw error;
  }
}

export async function startCall(
  callConfig: CallConfig,
  statusCallback: (status: string | undefined) => void,
  transcriptCallback: (transcript: any[] | undefined) => void,
  showDebugMessages?: boolean
) {
  const callbacks = {
    onStatusChange: statusCallback,
    onTranscriptChange: transcriptCallback,
    onDebugMessage: (msg: any) => {
      if (showDebugMessages) {
        console.log("Debug message:", msg);
      }
    },
  };
  try {
    const callData = await createCall(callConfig);
    const joinUrl = callData.joinUrl;

    if (!joinUrl && !ultravoxSession) {
      console.error("Join URL is required");
      return;
    } else {
      // console.log("Joining call:", joinUrl);

      // Start up our Ultravox Session
      ultravoxSession = new UltravoxSession({
        experimentalMessages: debugMessages,
      });

      if (showDebugMessages) {
        console.log("ultravoxSession created:", ultravoxSession);
        console.log(
          "ultravoxSession methods:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(ultravoxSession))
        );
      }

      if (ultravoxSession) {
        ultravoxSession.addEventListener("status", (event: any) => {
          callbacks.onStatusChange(ultravoxSession?.status);
        });

        ultravoxSession.addEventListener("transcripts", (event: any) => {
          callbacks.onTranscriptChange(ultravoxSession?.transcripts);
        });

        ultravoxSession.addEventListener("experimental_message", (msg: any) => {
          callbacks?.onDebugMessage?.(msg);
        });

        ultravoxSession.joinCall(joinUrl);
        console.log("Session status:", ultravoxSession.status);
      } else {
        return;
      }
    }
  } catch (error) {
    console.error("Error starting call:", error);
  }
}

export async function startTwilioCall(
  twilioConfig: TwilioConfig,
  callConfig: CallConfig,
  statusCallback: (status: string | undefined) => void,
  transcriptCallback: (transcript: any[] | undefined) => void,
  showDebugMessages?: boolean
) {
  const callbacks = {
    onStatusChange: statusCallback,
    onTranscriptChange: transcriptCallback,
    onDebugMessage: (msg: any) => {
      if (showDebugMessages) {
        console.log("Debug message:", msg);
      }
    },
  };
  try {
    const callData = await createCall(callConfig);
    const joinUrl = callData.joinUrl;

    console.log(callConfig, callData);

    console.log("join url", joinUrl);

    if (!joinUrl && !ultravoxSession) {
      console.error("Join URL is required");
      return;
    }

    if (showDebugMessages) {
      console.log("ultravoxSession created:", ultravoxSession);
      console.log(
        "ultravoxSession methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(ultravoxSession))
      );
    }

    if (!twilioConfig.to_number) {
      console.error("twilio to number not provided");
      return;
    }

    const result = await twilioMakeCall(
      twilioConfig.account_sid,
      twilioConfig.auth_token,
      twilioConfig.from_number,
      twilioConfig.to_number,
      joinUrl
    );

    if (!result.success) {
      console.error("Failed to initiate Twilio call:", result.error);
      return;
    }

    return true;
  } catch (error) {
    console.error("Error starting call:", error);
  }
}

export async function endCall() {
  console.log("call ended.");
  if (ultravoxSession) {
    ultravoxSession.leaveCall();
    ultravoxSession = null;
  }
}
