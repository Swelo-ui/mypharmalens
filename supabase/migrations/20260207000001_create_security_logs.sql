-- Create security_logs table to track signups and enforce rate limits
create table if not exists public.security_logs (
    id uuid not null default gen_random_uuid(),
    ip_address text not null,
    device_fingerprint text not null,
    email_domain text,
    event_type text not null check (event_type in ('signup_attempt', 'signup_success', 'signup_blocked')),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone not null default now(),
    constraint security_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.security_logs enable row level security;

-- Policies (Only Service Role can Access)
create policy "Service role can insert security logs"
on public.security_logs
for insert
to service_role
with check (true);

create policy "Service role can read security logs"
on public.security_logs
for select
to service_role
using (true);

-- Indexes for performance
create index if not exists idx_security_logs_fingerprint on public.security_logs(device_fingerprint);
create index if not exists idx_security_logs_ip on public.security_logs(ip_address);
create index if not exists idx_security_logs_created_at on public.security_logs(created_at);
