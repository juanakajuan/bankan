// Application types (used in the UI)
export interface Card {
  id: string;
  title: string;
  description: string;
  position: number;
}

export interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  createdAt: string;
  lastModified: string;
  isArchived: boolean;
}

export interface BoardMetadata {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
  isArchived: boolean;
  listCount: number;
  cardCount: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Supabase Database types
export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string;
          title: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position: number;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lists_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          list_id: string;
          title: string;
          description: string;
          position: number;
        };
        Insert: {
          id?: string;
          list_id: string;
          title: string;
          description?: string;
          position: number;
        };
        Update: {
          id?: string;
          list_id?: string;
          title?: string;
          description?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cards_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Database row types (for convenience)
export type DbBoard = Database["public"]["Tables"]["boards"]["Row"];
export type DbList = Database["public"]["Tables"]["lists"]["Row"];
export type DbCard = Database["public"]["Tables"]["cards"]["Row"];
