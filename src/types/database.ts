export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          color: string;
          all_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          color?: string;
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          color?: string;
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          completed: boolean;
          due_date: string | null;
          priority: "low" | "medium" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      implementation_stages: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          position: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          position: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          position?: number;
          color?: string;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          stage_id: string | null;
          notes: string | null;
          start_date: string | null;
          expected_end_date: string | null;
          contract_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          stage_id?: string | null;
          notes?: string | null;
          start_date?: string | null;
          expected_end_date?: string | null;
          contract_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          stage_id?: string | null;
          notes?: string | null;
          start_date?: string | null;
          expected_end_date?: string | null;
          contract_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  event_type?: "event" | "meeting" | "deadline";
  client_id?: string | null;
};
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"] & {
  event_type?: "event" | "meeting" | "deadline";
  client_id?: string | null;
};
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"] & {
  event_type?: "event" | "meeting" | "deadline";
  client_id?: string | null;
};

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];

export type Stage = Database["public"]["Tables"]["implementation_stages"]["Row"];
export type StageInsert = Database["public"]["Tables"]["implementation_stages"]["Insert"];
export type StageUpdate = Database["public"]["Tables"]["implementation_stages"]["Update"];

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
