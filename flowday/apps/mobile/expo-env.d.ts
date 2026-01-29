/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_CLAUDE_API_KEY?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID?: string;
  }
}
