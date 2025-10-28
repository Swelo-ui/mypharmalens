import "jsr:@supabase/functions-js/edge-runtime.d.ts";
declare const Deno: any;

Deno.serve(async (req: Request) => {
  console.log('Simplified Edge Function invoked!');
  return new Response(JSON.stringify({ message: 'Hello from simplified Edge Function!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});