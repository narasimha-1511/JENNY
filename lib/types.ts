// these are for Ultravox Espescially
export interface JoinUrlResponse {
  callId: string;
  created: Date;
  ended: Date | null;
  model: string;
  systemPrompt: string;
  temperature: number;
  joinUrl: string;
}

// Enums
export enum RoleEnum {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  TOOL_CALL = "TOOL_CALL",
  TOOL_RESULT = "TOOL_RESULT",
}

export enum ParameterLocation {
  UNSPECIFIED = "PARAMETER_LOCATION_UNSPECIFIED",
  QUERY = "PARAMETER_LOCATION_QUERY",
  PATH = "PARAMETER_LOCATION_PATH",
  HEADER = "PARAMETER_LOCATION_HEADER",
  BODY = "PARAMETER_LOCATION_BODY",
}

export enum KnownParamEnum {
  UNSPECIFIED = "KNOWN_PARAM_UNSPECIFIED",
  CALL_ID = "KNOWN_PARAM_CALL_ID",
  CONVERSATION_HISTORY = "KNOWN_PARAM_CONVERSATION_HISTORY",
}

export interface Message {
  ordinal?: number;
  role: RoleEnum;
  text: string;
  invocationId?: string;
  toolName?: string;
}

export interface SelectedTool {
  toolId?: string;
  toolName?: string;
  temporaryTool?: BaseToolDefinition;
  nameOverride?: string;
  authTokens?: { [key: string]: string };
  parameterOverrides?: { [key: string]: any };
}

export interface BaseToolDefinition {
  modelToolName?: string;
  description: string;
  dynamicParameters?: DynamicParameter[];
  staticParameters?: StaticParameter[];
  automaticParameters?: AutomaticParameter[];
  requirements?: ToolRequirements;
  http?: BaseHttpToolDetails;
  client?: {};
}

interface DynamicParameter {
  name: string;
  location: ParameterLocation;
  schema: object;
  required?: boolean;
}

interface StaticParameter {
  name: string;
  location: ParameterLocation;
  value: any;
}

interface AutomaticParameter {
  name: string;
  location: ParameterLocation;
  knownValue: KnownParamEnum;
}

interface BaseHttpToolDetails {
  baseUrlPattern: string;
  httpMethod: string;
}

interface ToolRequirements {
  httpSecurityOptions: SecurityOptions;
  requiredParameterOverrides: string[];
}

interface SecurityOptions {
  options: SecurityRequirements[];
}

interface SecurityRequirements {
  requirements: { [key: string]: SecurityRequirement };
}

interface SecurityRequirement {
  queryApiKey?: QueryApiKeyRequirement;
  headerApiKey?: HeaderApiKeyRequirement;
  httpAuth?: HttpAuthRequirement;
}

interface QueryApiKeyRequirement {
  name: string;
}

interface HeaderApiKeyRequirement {
  name: string;
}

interface HttpAuthRequirement {
  scheme: string;
}

export interface CallConfig {
  systemPrompt: string;
  model?: string;
  languageHint?: string;
  selectedTools?: SelectedTool[];
  initialMessages?: Message[];
  voice?: string;
  temperature?: number;
  maxDuration?: string;
  timeExceededMessage?: string;
  callKey?: string;
  medium?: {
    twilio?: {};
  };
}

export interface DemoConfig {
  title: string;
  overview: string;
  callConfig: CallConfig;
}

// Call Stages
export enum AvailableCallStage {
  STAGE0 = "Stage-0",
  STAGE1 = "Stage-1",
}

export interface CallStageTask {
  stageNumber: number;
  stageName?: AvailableCallStage;
  stageDescription?: string;
  stagePrompt?: string;
}

export interface NavigateConversation {
  data: object;
  new_data: object;
  next_stage: AvailableCallStage | undefined;
  current_stage: AvailableCallStage;
}

export interface TwilioConfig {
  auth_token: string;
  account_sid: string;
  from_number: string;
  to_number: string | undefined;
}