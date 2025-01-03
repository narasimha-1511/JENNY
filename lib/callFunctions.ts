import { CallConfig, JoinUrlResponse, TwilioConfig } from "@/lib/types";
import { CallService } from "./services/call.service";

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

  await CallService.getInstance().startCall(callConfig, callbacks, showDebugMessages);
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

  return await CallService.getInstance().startTwilioCall(
    twilioConfig,
    callConfig,
    callbacks,
    showDebugMessages
  );
}

export async function endCall() {
  CallService.getInstance().endCall();
}