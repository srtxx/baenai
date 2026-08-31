-- RATION Database Schema for Supabase (PostgreSQL)
-- 映えない食事記録 ＆ 相互監視ソーシャル機能

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null default 'USER',
  handle text unique,
  avatar_url text,
  friend_code text unique not null default ('RN-' || upper(substring(md5(random()::text) from 1 for 5))),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Friendships Table (相互監視関係)
create table if not exists public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- 3. Meals Table (21マスの食事ログ)
create table if not exists public.meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_key text not null, -- e.g. '2026_08_24'
  day_index smallint not null check (day_index between 0 and 6), -- 0=Mon, 6=Sun
  meal_index smallint not null check (meal_index between 0 and 2), -- 0=Breakfast, 1=Lunch, 2=Dinner
  image_url text,
  note text,
  tags text[] default array[]::text[],
  is_skipped boolean default false not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_key, day_index, meal_index)
);

-- 4. Nudges Table (未記録への催促: 飯食え！/ 生存確認)
create table if not exists public.nudges (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  week_key text not null,
  day_index smallint not null check (day_index between 0 and 6),
  meal_index smallint not null check (meal_index between 0 and 2),
  nudge_type text not null check (nudge_type in ('eat_food', 'alive', 'hurry')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Reactions Table (食事写真へのリアクションスタンプ)
create table if not exists public.reactions (
  id uuid default uuid_generate_v4() primary key,
  meal_id uuid references public.meals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('baenai', 'praise', 'grass', 'tasty')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(meal_id, user_id, reaction_type)
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.meals enable row level security;
alter table public.nudges enable row level security;
alter table public.reactions enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies for Friendships
create policy "Users can view their friendships" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendships" on public.friendships
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their friendships" on public.friendships
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- Policies for Meals
create policy "Meals viewable by friends and owner" on public.meals
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.friendships
      where (user_id = auth.uid() and friend_id = public.meals.user_id and status = 'accepted')
         or (friend_id = auth.uid() and user_id = public.meals.user_id and status = 'accepted')
    )
  );

create policy "Users can insert their own meals" on public.meals
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own meals" on public.meals
  for update using (auth.uid() = user_id);

create policy "Users can delete their own meals" on public.meals
  for delete using (auth.uid() = user_id);

-- Policies for Nudges
create policy "Nudges viewable by sender or receiver" on public.nudges
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send nudges to friends" on public.nudges
  for insert with check (auth.uid() = sender_id);

-- Policies for Reactions
create policy "Reactions viewable by everyone who can see the meal" on public.reactions
  for select using (true);

create policy "Users can add reactions" on public.reactions
  for insert with check (auth.uid() = user_id);

create policy "Users can remove reactions" on public.reactions
  for delete using (auth.uid() = user_id);
