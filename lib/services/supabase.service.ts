import { createClient } from '@supabase/supabase-js';
import { AppointmentTool } from '../types/appointment';
import { Bot } from '@/types/database';
import { CalendarAccount } from '../types';
import { useBotStore } from '@/store/use-bot-store';
import { useAppointmentsToolsStore } from '@/store/use-appointments-store';

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase;
  private appointmentTools: AppointmentTool[] | null = null;
  private bots: Bot[] | null = useBotStore.getState().bots;
  private calendarAccounts: CalendarAccount[] | null = null;

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async getUserCalendarAccount(userId: string) {
    
    if(!this.calendarAccounts){
      const { data , error } = await this.supabase
        .from("user_calendar_accounts")
        .select("*")
        .eq("user_id", userId);
        
      if(!data || error){
        console.error('Error fetching calendar accounts:', error);
        return null;
      } 

      this.calendarAccounts = data;
    }
    
    return this.calendarAccounts.find((account) => account.user_id === userId);
  }

  public async getBotData(botId: string) {
    // This should be implemented based on your bot store implementation
    if(!this.bots){
      const bots = useBotStore.getState().bots;
      
      if(bots){
        this.bots = bots;
      } else {
        this.bots = await useBotStore.getState().fetchBots();
        useBotStore.getState().setBots(this.bots);
      }
    }

    return this.bots.find((bot) => bot.id === botId);
  }

  public async getLatestBotData(id: string) {
    // This should be implemented based on your bot store implementation
    
    this.bots = useBotStore.getState().bots;
    if(!this.bots){
      this.bots = await useBotStore.getState().fetchBots();
      useBotStore.getState().setBots(this.bots);
    }

    return this.bots.find((bot: Bot) => bot.id === id);
  }

  public async getLastestAppointmentTool(appointmentId: string) {
    // This should be implemented based on your bot store implementation
    this.appointmentTools = useAppointmentsToolsStore.getState().tools;
    if(!this.appointmentTools){
      const appppointmentTools = await useAppointmentsToolsStore.getState().fetchAppointmentsTools();
      useAppointmentsToolsStore.getState().setTools(appppointmentTools);
      this.appointmentTools = appppointmentTools;
    }

    return this.appointmentTools.find((tool: AppointmentTool) => tool.id === appointmentId);
  }

  public async getAppointmentTool(appointmentId: string) {
    // This should be implemented based on your appointment tools implementation
    if(!this.appointmentTools){
      const appppointmentTools = useAppointmentsToolsStore.getState().tools;
      
      if(appppointmentTools){
        this.appointmentTools = appppointmentTools;      
      }else{
        this.appointmentTools = await useAppointmentsToolsStore.getState().fetchAppointmentsTools();
        useAppointmentsToolsStore.getState().setTools(this.appointmentTools);
      }
    }

    console.log(this.appointmentTools);

    return this.appointmentTools.find((tool) => tool.id === appointmentId);
  }
}
