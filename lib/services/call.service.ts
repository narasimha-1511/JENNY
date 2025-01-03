import { UltravoxSession } from "ultravox-client";
import { CallConfig, JoinUrlResponse, ParameterLocation, SelectedTool, TwilioConfig } from "@/lib/types";
import { makeCall as twilioMakeCall } from "../actions/twilio-actions";
import { SupabaseService } from "./supabase.service";
import { parseSystemPrompt } from "../prompt-parser";
import { Bot } from "@/types/database";

export class CallService {
  private static instance: CallService;
  private ultravoxSession: UltravoxSession | null = null;
  private debugMessages: Set<string> = new Set(["debug"]);
  private supabaseService: SupabaseService;

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  async createCall(
    callConfig: CallConfig,
    showDebugMessages?: boolean
  ): Promise<JoinUrlResponse> {
    try {
      if (showDebugMessages) {
        console.log(`Using model ${callConfig.model}`);
      }
      console.log("callConfig hehehe", callConfig);
      await this.configureAppointments(callConfig);

      if(callConfig.selectedTools){
        console.log("selectedTools this is crazyy", callConfig.selectedTools);
      }

      const response = await fetch(`/api/ultravox/createcall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callConfig),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${await response.text()}`
        );
      }

      return await response.json();
     
    } catch (error) {
      console.error("Error in createCall:", error);
      throw error;
    }
  }

  private async configureAppointments(callConfig: CallConfig): Promise<void> {

    const bot = await this.supabaseService.getLatestBotData(callConfig.botId || "");

    const isAppointmentsEnabled = bot?.is_appointment_booking_allowed;
    const appointmentId = bot?.appointment_tool_id;


    if (isAppointmentsEnabled && appointmentId) {
      await this.setupAppointmentTool(bot, appointmentId , callConfig);
    }

    delete callConfig.botId;
  }

  async startCall(
    callConfig: CallConfig,
    callbacks: {
      onStatusChange: (status: string | undefined) => void;
      onTranscriptChange: (transcript: any[] | undefined) => void;
      onDebugMessage?: (msg: any) => void;
    },
    showDebugMessages?: boolean
  ): Promise<void> {
    try {
      const callData = await this.createCall(callConfig);
      if (!callData.joinUrl) {
        throw new Error("Join URL is required");
      }

      this.initializeUltravoxSession(callbacks, showDebugMessages);
      this.ultravoxSession?.joinCall(callData.joinUrl);
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }

  async startTwilioCall(
    twilioConfig: TwilioConfig,
    callConfig: CallConfig,
    callbacks: {
      onStatusChange: (status: string | undefined) => void;
      onTranscriptChange: (transcript: any[] | undefined) => void;
      onDebugMessage?: (msg: any) => void;
    },
    showDebugMessages?: boolean
  ): Promise<boolean> {
    try {
      const callData = await this.createCall(callConfig);

      if (!callData.joinUrl || !twilioConfig.to_number) {
        throw new Error("Join URL and Twilio number are required");
      }

      const result = await twilioMakeCall(
        twilioConfig.account_sid,
        twilioConfig.auth_token,
        twilioConfig.from_number,
        twilioConfig.to_number,
        callData.joinUrl
      );

      if (!result.success) {
        throw new Error(`Failed to initiate Twilio call: ${result.error}`);
      }

      return true;
    } catch (error) {
      console.error("Error starting Twilio call:", error);
      throw error;
    }
  }

  endCall(): void {
    if (this.ultravoxSession) {
      this.ultravoxSession = null;
    }
  }

  private initializeUltravoxSession(
    callbacks: {
      onStatusChange: (status: string | undefined) => void;
      onTranscriptChange: (transcript: any[] | undefined) => void;
      onDebugMessage?: (msg: any) => void;
    },
    showDebugMessages?: boolean
  ): void {
    this.ultravoxSession = new UltravoxSession({
      experimentalMessages: this.debugMessages,
    });

    this.setupEventListeners(callbacks, showDebugMessages);
  }

  private setupEventListeners(
    callbacks: {
      onStatusChange: (status: string | undefined) => void;
      onTranscriptChange: (transcript: any[] | undefined) => void;
      onDebugMessage?: (msg: any) => void;
    },
    showDebugMessages?: boolean
  ): void {
    if (!this.ultravoxSession) return;

    this.ultravoxSession.addEventListener("status", () => {
      callbacks.onStatusChange(this.ultravoxSession?.status);
    });

    this.ultravoxSession.addEventListener("transcripts", () => {
      callbacks.onTranscriptChange(this.ultravoxSession?.transcripts);
    });

    this.ultravoxSession.addEventListener("experimental_message", (msg: any) => {
      if (showDebugMessages) {
        callbacks.onDebugMessage?.(msg);
      }
    });
  }

  private async setupAppointmentTool(bot: Bot, appointmentId: string , callConfig: CallConfig) {
    // This should be implemented based on your appointment tools implementation

    const calendarAccount = await this.supabaseService.getUserCalendarAccount(bot.user_id);

    const appointmentTool = await this.supabaseService.getLastestAppointmentTool(appointmentId);

    if(!calendarAccount || !appointmentTool){
      console.log("User calendar account or appointment tool not found -> not configured the appoinement tool");
      return;
    }

    const systemPrompt =  parseSystemPrompt(appointmentTool?.description || "", bot);
      
    const selectedTool: SelectedTool[] = [{
      temporaryTool:{
        modelToolName: "bookAppointment",
        description: systemPrompt,
        dynamicParameters: [
          {
            name: "appointmentDetails",
            location: ParameterLocation.BODY,
            schema: {
              type: "object",
              properties: {
                appointmentType: {
                  type: "string",
                  enum: ["consultation", "follow_up", "general", "urgent"],
                },
                preferredDate: {
                  type: "string",
                  format: "date",
                },
                preferredTime: {
                  type: "string",
                  pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
                },
                firstName: {
                  type: "string",
                },
                lastName: {
                  type: "string",
                },
                email: {
                  type: "string",
                  format: "email",
                },
                notes: {
                  type: "string",
                },
              },
              required: [
                "appointmentType",
                "preferredDate",
                "preferredTime",
                "firstName",
                "lastName",
                "email",
              ],
            },
            required: true,
          },
        ],
        http: {
          baseUrlPattern: `https://1c70-183-83-230-229.ngrok-free.app/api/bookAppointment`,
          httpMethod: "POST",
        },
        staticParameters: [
          {
            name: "access_token",
            location: ParameterLocation.QUERY,
            value: calendarAccount?.access_token || "not_found",
          },
          {
            name: "refresh_token",
            location: ParameterLocation.QUERY,
            value: calendarAccount?.refresh_token || "not_found",
          }
        ]
      }
    }]

    callConfig.selectedTools = selectedTool;

  }

  
}
