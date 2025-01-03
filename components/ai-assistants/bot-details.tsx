'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/ui/icons";
import { TranscriptView } from "../dashboard/transcript-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startCall, endCall, startTwilioCall } from "@/lib/callFunctions";
import { Transcript, UltravoxSessionStatus } from "ultravox-client";
import { CallConfig, TwilioConfig } from "@/lib/types";
import { BotAppointmentConfig } from "./bot-appointment-config";
import { useVoices } from "@/hooks/use-voices";
import { useBots } from "@/hooks/use-bots";

const formSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  phone_number: z.string().optional(),
  voice: z.string().min(1, "Please select a voice"),
  system_prompt: z.string().min(1, "System prompt is required"),
});

type FormData = z.infer<typeof formSchema>;


interface TwilioNumber {
  id: number;
  account_sid: string;
  auth_token: string;
  from_phone_number: string;
}

export function BotDetails() {
  const [loading, setLoading] = useState(false);
  const [selectedTwilioNumber, setSelectedTwilioNumber] = useState<
    string | null
  >(null);
  const [loadingTwilioNumbers, setLoadingTwilioNumbers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>("off");
  const [callTranscript, setCallTranscript] = useState<Transcript[] | null>(
    null
  );
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });


  const { voices , error: voicesError , isLoading: voicesLoading , twilioInfo: twilioNumbers} = useVoices();
  const { selectedBotId : botId , bots , updateBot } = useBots();
  const selectedVoice = watch("voice");


  // useEffect(() => {
  //   if (transcriptContainerRef.current) {
  //     transcriptContainerRef.current.scrollTop =
  //       transcriptContainerRef.current.scrollHeight;
  //   }
  // }, [callTranscript]);

  

  useEffect(() => {
      
      const bot = bots.find((bot) => bot.id === botId);

      if (!bot) {
        toast({
          title: "Error",
          description: "Bot not found",
          variant: "destructive",
        });
        return;
      }

        setValue("name", bot.name);
        setValue("phone_number", bot.phone_number);
        setValue("voice", bot.voice);
        setValue("system_prompt", bot.system_prompt);

  }, [botId , bots]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    if(!botId || !data){
      toast({
        title: "Error",
        description: "Invalid data",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("bots")
        .update(data)
        .eq("id", botId);

      if (error) {
        toast({
          title: "Error updating bot",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      updateBot(botId , {
        ...bots.find((bot) => bot.id === botId) ,
        name: data.name,
        id: botId,
        //@ts-ignore
        phone_number: data.phone_number,
        voice: data.voice,
        system_prompt: data.system_prompt
      });

      toast({
        title: "Success",
        description: "Bot updated successfully",
      });

    } catch (error) {
      console.error("Error updating bot:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback(
    (status: UltravoxSessionStatus | string | undefined) => {
      if (status) {
        setAgentStatus(status);
      } else {
        setAgentStatus("off");
      }
    },
    []
  );

  const handleTranscriptChange = useCallback(
    (transcripts: Transcript[] | undefined) => {
      if (transcripts) {
        setCallTranscript([...transcripts]);
      }
    },
    []
  );

  const initiateCall = async () => {
    setIsCallActive(true);

    const callConfig: CallConfig = {
      systemPrompt: watch("system_prompt"),
      voice: watch("voice"),
    };
    try {
      await startCall(callConfig, handleStatusChange, handleTranscriptChange);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const terminateCall = async () => {
    setIsCallActive(false);
    try {
      await endCall();
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleCall = async () => {
    // setIsCallActive(true);

    const callConfig: CallConfig = {
      systemPrompt: watch("system_prompt"),
      voice: watch("voice"),
      medium: {
        twilio: {},
      },
      botId: botId,
    };

    const twilioNumber: TwilioNumber | undefined = twilioNumbers.find(
      (elem) => elem.from_phone_number === selectedTwilioNumber
    );

    if (!twilioNumber) {
      console.error("cound not get from tweilio number");
      return;
    }

    const twilioConfig: TwilioConfig = {
      account_sid: twilioNumber.account_sid,
      auth_token: twilioNumber.auth_token,
      from_number: twilioNumber.from_phone_number,
      to_number: watch("phone_number"),
    };


    try {
      await startTwilioCall(
        twilioConfig,
        callConfig,
        handleStatusChange,
        handleTranscriptChange
      );
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Bot unmuted" : "Bot muted",
      description: `The bot has been ${isMuted ? "unmuted" : "muted"}.`,
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Bot Configuration */}
      <div className="w-1/2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {/* <h2 className="text-lg font-semibold mb-4">Bot Configuration</h2> */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Bot Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="My Assistant"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number (Optional)</Label>
              <Input
                id="phone_number"
                {...register("phone_number")}
                placeholder="+1234567890"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">
                  {errors.phone_number.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Twilio Phone Number</Label>
              {loadingTwilioNumbers ? (
                <div className="text-sm text-gray-500">
                  Loading phone numbers...
                </div>
              ) : twilioNumbers.length === 0 ? (
                <div className="text-sm text-red-500">
                  Please add your Twilio integration first to get available
                  phone numbers.
                </div>
              ) : (
                <Select
                  onValueChange={(value) => setSelectedTwilioNumber(value)}
                  value={selectedTwilioNumber || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {twilioNumbers.map((number) => (
                      <SelectItem
                        key={number.id}
                        value={number.from_phone_number}
                      >
                        {number.from_phone_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select
                onValueChange={(value) => setValue("voice", value)}
                value={selectedVoice}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceId} value={voice.voiceId}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.voice && (
                <p className="text-sm text-red-500">{errors.voice.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                {...register("system_prompt")}
                placeholder="Enter the system prompt..."
                className="h-32"
              />
              {errors.system_prompt && (
                <p className="text-sm text-red-500">
                  {errors.system_prompt.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Actions & Transcripts */}
      <div className="w-1/2 space-y-6">
        {/* Transcripts Section */}
        {/* <div
          className="bg-white p-6 rounded-lg shadow-sm flex-1"
          ref={transcriptContainerRef}
        >
          <h2 className="text-lg font-semibold mb-4">Transcripts</h2>
          <TranscriptView botId={botId} initialTranscripts={callTranscript} />
        </div> */}

          
          {/* Appointment Configuratio */}
          <BotAppointmentConfig />
        

        {/* Actions Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 mt-auto">
          <h2 className="text-lg font-semibold">Actions</h2>
          <div className="flex gap-2">
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleCall}
              disabled={isCallActive}
            >
              <Icon name="phone-call" className="h-4 w-4" />
              Start Call
            </Button>

            <Button
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={terminateCall}
              disabled={!isCallActive}
            >
              <Icon name="phone-off" className="h-4 w-4" />
              End Call
            </Button>

            <Button
              variant={isMuted ? "destructive" : "outline"}
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleToggleMute}
            >
              <Icon
                name={isMuted ? "volume-mute" : "volume-up"}
                className="h-4 w-4"
              />
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
