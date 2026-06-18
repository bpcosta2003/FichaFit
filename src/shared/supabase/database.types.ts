// Tipos do schema Supabase — manter em sincronia com supabase/migrations/.
// Regenerar com:
// npx supabase gen types typescript --linked > src/shared/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      perfis_usuario: {
        Row: {
          id: string;
          nome: string | null;
          avatar_id: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          avatar_id?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          avatar_id?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      exercicio_definicoes: {
        Row: {
          id: string;
          wger_id: number | null;
          nome: string;
          grupo_muscular: string | null;
          descricao: string | null;
          is_custom: boolean;
          usuario_id: string | null;
          criado_em: string;
          atualizado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id?: string;
          wger_id?: number | null;
          nome: string;
          grupo_muscular?: string | null;
          descricao?: string | null;
          is_custom?: boolean;
          usuario_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          wger_id?: number | null;
          nome?: string;
          grupo_muscular?: string | null;
          descricao?: string | null;
          is_custom?: boolean;
          usuario_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
      fichas_treino: {
        Row: {
          id: string;
          usuario_id: string;
          nome: string;
          descricao: string | null;
          grupo_id: string | null;
          criado_em: string;
          atualizado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id: string;
          usuario_id: string;
          nome: string;
          descricao?: string | null;
          grupo_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          nome?: string;
          descricao?: string | null;
          grupo_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
      grupos_ficha: {
        Row: {
          id: string;
          usuario_id: string;
          nome: string;
          criado_em: string;
          atualizado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id: string;
          usuario_id: string;
          nome: string;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          nome?: string;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
      exercicios_ficha: {
        Row: {
          id: string;
          ficha_id: string;
          exercicio_definicao_id: string | null;
          usuario_id: string;
          nome: string;
          ordem: number;
          series: number;
          repeticoes_min: number;
          repeticoes_max: number;
          carga_referencia_kg: number | null;
          descanso_segundos: number;
          observacoes: string | null;
          criado_em: string;
          atualizado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id: string;
          ficha_id: string;
          exercicio_definicao_id?: string | null;
          usuario_id: string;
          nome: string;
          ordem?: number;
          series?: number;
          repeticoes_min?: number;
          repeticoes_max?: number;
          carga_referencia_kg?: number | null;
          descanso_segundos?: number;
          observacoes?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          ficha_id?: string;
          exercicio_definicao_id?: string | null;
          usuario_id?: string;
          nome?: string;
          ordem?: number;
          series?: number;
          repeticoes_min?: number;
          repeticoes_max?: number;
          carga_referencia_kg?: number | null;
          descanso_segundos?: number;
          observacoes?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
      sessoes_treino: {
        Row: {
          id: string;
          client_id: string;
          usuario_id: string;
          ficha_id: string;
          nome_ficha: string;
          status: string;
          iniciada_em: string;
          concluida_em: string | null;
          criado_em: string;
          atualizado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id: string;
          client_id: string;
          usuario_id: string;
          ficha_id: string;
          nome_ficha: string;
          status?: string;
          iniciada_em: string;
          concluida_em?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          usuario_id?: string;
          ficha_id?: string;
          nome_ficha?: string;
          status?: string;
          iniciada_em?: string;
          concluida_em?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
      series_realizadas: {
        Row: {
          id: string;
          sessao_id: string;
          exercicio_ficha_id: string;
          usuario_id: string;
          nome_exercicio: string;
          numero_serie: number;
          repeticoes: number;
          peso_kg: number;
          realizada_em: string;
          criado_em: string;
          deletado_em: string | null;
        };
        Insert: {
          id: string;
          sessao_id: string;
          exercicio_ficha_id: string;
          usuario_id: string;
          nome_exercicio: string;
          numero_serie: number;
          repeticoes: number;
          peso_kg: number;
          realizada_em: string;
          criado_em?: string;
          deletado_em?: string | null;
        };
        Update: {
          id?: string;
          sessao_id?: string;
          exercicio_ficha_id?: string;
          usuario_id?: string;
          nome_exercicio?: string;
          numero_serie?: number;
          repeticoes?: number;
          peso_kg?: number;
          realizada_em?: string;
          criado_em?: string;
          deletado_em?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
