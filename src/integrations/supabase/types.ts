export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      carpool_passengers: {
        Row: {
          carpool_id: string
          id: string
          joined_at: string | null
          passenger_id: string
          status: string
        }
        Insert: {
          carpool_id: string
          id?: string
          joined_at?: string | null
          passenger_id: string
          status?: string
        }
        Update: {
          carpool_id?: string
          id?: string
          joined_at?: string | null
          passenger_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_passengers_carpool_id_fkey"
            columns: ["carpool_id"]
            isOneToOne: false
            referencedRelation: "carpools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carpools: {
        Row: {
          available_seats: number
          created_at: string | null
          departure_time: string
          distance_km: number
          drop_lat: number
          drop_lng: number
          drop_name: string
          fare_per_person: number
          host_id: string
          id: string
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          status: string
          total_seats: number
          vehicle_name: string | null
          vehicle_number: string | null
        }
        Insert: {
          available_seats?: number
          created_at?: string | null
          departure_time: string
          distance_km: number
          drop_lat: number
          drop_lng: number
          drop_name: string
          fare_per_person: number
          host_id: string
          id?: string
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          status?: string
          total_seats?: number
          vehicle_name?: string | null
          vehicle_number?: string | null
        }
        Update: {
          available_seats?: number
          created_at?: string | null
          departure_time?: string
          distance_km?: number
          drop_lat?: number
          drop_lng?: number
          drop_name?: string
          fare_per_person?: number
          host_id?: string
          id?: string
          pickup_lat?: number
          pickup_lng?: number
          pickup_name?: string
          status?: string
          total_seats?: number
          vehicle_name?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carpools_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          driver_id: string
          id: string
          latitude: number
          longitude: number
          updated_at: string | null
        }
        Insert: {
          driver_id: string
          id?: string
          latitude: number
          longitude: number
          updated_at?: string | null
        }
        Update: {
          driver_id?: string
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_locations: {
        Row: {
          address_name: string
          created_at: string
          id: string
          label: string
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          address_name: string
          created_at?: string
          id?: string
          label: string
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          address_name?: string
          created_at?: string
          id?: string
          label?: string
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          ride_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          ride_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          ride_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          name: string
          phone: string | null
          rating: number | null
          role: string
          seats: number | null
          total_rides: number | null
          vehicle_name: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_available?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          role?: string
          seats?: number | null
          total_rides?: number | null
          vehicle_name?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          role?: string
          seats?: number | null
          total_rides?: number | null
          vehicle_name?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          ratee_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          ratee_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          ratee_id?: string
          rater_id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          completed_at: string | null
          created_at: string | null
          distance_km: number
          driver_id: string | null
          drop_lat: number
          drop_lng: number
          drop_name: string
          eta: number | null
          fare: number
          id: string
          otp: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          rider_id: string
          status: string
          vehicle_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          distance_km: number
          driver_id?: string | null
          drop_lat: number
          drop_lng: number
          drop_name: string
          eta?: number | null
          fare: number
          id?: string
          otp?: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          rider_id: string
          status?: string
          vehicle_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number
          driver_id?: string | null
          drop_lat?: number
          drop_lng?: number
          drop_name?: string
          eta?: number | null
          fare?: number
          id?: string
          otp?: string | null
          pickup_lat?: number
          pickup_lng?: number
          pickup_name?: string
          rider_id?: string
          status?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          resolved: boolean
          ride_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolved?: boolean
          ride_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolved?: boolean
          ride_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      haversine_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
