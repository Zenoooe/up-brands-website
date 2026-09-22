alter table public.projects
add column if not exists subtitle text;

alter table public.projects
alter column category drop not null;

alter table public.projects
alter column category set default '';

update public.projects
set
  title = case
    when position('|' in title) > 0 then trim(split_part(title, '|', 1))
    else title
  end,
  subtitle = case
    when coalesce(nullif(trim(subtitle), ''), '') <> '' then subtitle
    when position('|' in title) > 0 then trim(split_part(title, '|', 2))
    when category like '%|%' or category like '%｜%' then trim(category)
    when category like '%/%' then trim(category)
    when char_length(trim(category)) >= 24 then trim(category)
    else subtitle
  end,
  category = case
    when position('|' in title) > 0 then ''
    when category like '%|%' or category like '%｜%' then ''
    when category like '%/%' then ''
    when char_length(trim(category)) >= 24 then ''
    else coalesce(category, '')
  end
where
  position('|' in title) > 0
  or category is null
  or category like '%|%'
  or category like '%｜%'
  or category like '%/%'
  or char_length(trim(category)) >= 24
  or coalesce(nullif(trim(subtitle), ''), '') = '';
