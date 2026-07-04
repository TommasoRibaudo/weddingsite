type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      comments: TableDefinition<
        {
          id: string;
          photo_id: string;
          body: string;
          author: string;
          created_at: string;
        },
        {
          id?: string;
          photo_id: string;
          body: string;
          author: string;
          created_at?: string;
        }
      >;
      gift_contributions: TableDefinition<
        {
          id: string;
          gift_id: string;
          contributed_by: string;
          amount: number;
          created_at: string;
        },
        {
          id?: string;
          gift_id: string;
          contributed_by: string;
          amount: number;
          created_at?: string;
        }
      >;
      gifts: TableDefinition<
        {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          external_link: string | null;
          price: number | null;
          reserved_by: string | null;
          reserved_at: string | null;
          created_at: string;
          sort_order: number;
          divideable: boolean;
        },
        {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          external_link?: string | null;
          price?: number | null;
          reserved_by?: string | null;
          reserved_at?: string | null;
          created_at?: string;
          sort_order?: number;
          divideable?: boolean;
        }
      >;
      guests: TableDefinition<
        {
          id: string;
          slug: string;
          guest_name: string;
          party_label: string | null;
          revoked: boolean;
          created_at: string;
          redeemed_at: string | null;
          last_visited_at: string | null;
        },
        {
          id?: string;
          slug: string;
          guest_name: string;
          party_label?: string | null;
          revoked?: boolean;
          created_at?: string;
          redeemed_at?: string | null;
          last_visited_at?: string | null;
        }
      >;
      guest_profiles: TableDefinition<
        {
          guest_name: string;
          bio: string | null;
          photo_path: string | null;
          updated_at: string;
        },
        {
          guest_name: string;
          bio?: string | null;
          photo_path?: string | null;
          updated_at?: string;
        }
      >;
      menu_responses: TableDefinition<
        {
          id: string;
          account_name: string;
          guest_name: string;
          vegan: boolean;
          vegetarian: boolean;
          gluten_free: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          account_name: string;
          guest_name: string;
          vegan?: boolean;
          vegetarian?: boolean;
          gluten_free?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      photo_likes: TableDefinition<
        {
          id: string;
          photo_id: string;
          guest_name: string;
          created_at: string;
        },
        {
          id?: string;
          photo_id: string;
          guest_name: string;
          created_at?: string;
        }
      >;
      photos: TableDefinition<
        {
          id: string;
          storage_path: string | null;
          thumbnail_path: string | null;
          uploaded_by: string;
          body: string | null;
          created_at: string;
        },
        {
          id?: string;
          storage_path?: string | null;
          thumbnail_path?: string | null;
          uploaded_by: string;
          body?: string | null;
          created_at?: string;
        }
      >;
      gallery_settings: TableDefinition<
        {
          id: number;
          override: 'open' | 'closed' | null;
          updated_at: string;
        },
        {
          id?: number;
          override?: 'open' | 'closed' | null;
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type { Json };
