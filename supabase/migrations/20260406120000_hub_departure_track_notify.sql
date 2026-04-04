-- Hub departure scan → schedule "Track your order" notification for next day 11:00 (Tunis time)
alter table public.orders
  add column if not exists hub_departure_scanned_at timestamptz,
  add column if not exists track_notify_scheduled_at timestamptz,
  add column if not exists track_notify_sent_at timestamptz;

comment on column public.orders.hub_departure_scanned_at is 'Driver scanned package leaving hub / cave handoff';
comment on column public.orders.track_notify_scheduled_at is 'When to remind customer to open Track (default: next calendar day 11:00 Africa/Tunis)';
comment on column public.orders.track_notify_sent_at is 'Set when in-app notification was shown / email sent';

create or replace function public.everest_set_track_notify_from_hub_scan()
returns trigger as $$
begin
  if new.hub_departure_scanned_at is not null
     and (tg_op = 'insert' or old.hub_departure_scanned_at is null or old.hub_departure_scanned_at is distinct from new.hub_departure_scanned_at)
     and new.track_notify_sent_at is null then
    new.track_notify_scheduled_at := (
      (date_trunc('day', new.hub_departure_scanned_at at time zone 'Africa/Tunis') + interval '1 day' + interval '11 hours')
      at time zone 'Africa/Tunis'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_everest_track_notify on public.orders;
create trigger trg_everest_track_notify
  before insert or update of hub_departure_scanned_at on public.orders
  for each row
  execute procedure public.everest_set_track_notify_from_hub_scan();

notify pgrst, 'reload schema';
