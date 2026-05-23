import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseEnabled = import.meta.env.VITE_USE_SUPABASE === "true";

const isValidSupabaseConfig = Boolean(
  supabaseEnabled &&
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnonKey.includes("your-supabase-anon-key")
);

const noopError = {
  message:
    "Supabase is not configured. Enable it in .env or leave local mode enabled.",
};

const noopResult = Promise.resolve({ data: null, error: noopError });

const createNoopBuilder = () => {
  const builder = {
    select: () => builder,
    insert: () => builder,
    upsert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    limit: () => builder,
    order: () => builder,
    maybeSingle: () => noopResult,
    single: () => noopResult,
    rpc: () => noopResult,
    then: (resolve: (value: { data: null; error: { message: string } }) => void) => noopResult.then(resolve),
    catch: (reject: (reason: unknown) => void) => noopResult.catch(reject),
    finally: (onFinally: () => void) => noopResult.finally(onFinally),
  } as unknown as SupabaseClient;

  return builder;
};

const createNoopSupabaseClient = (): SupabaseClient => ({
  from: () => createNoopBuilder(),
  rpc: () => noopResult,
} as unknown as SupabaseClient);

export const isSupabaseConfigured = isValidSupabaseConfig;

export const supabase: SupabaseClient = isValidSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    })
  : createNoopSupabaseClient();
