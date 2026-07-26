// Shared data shape for an invite, used by every template component.
// This is the one place the field names are defined — templates import
// this instead of each declaring their own version, so they can never
// silently disagree about what a field is called.
export type Invite = {
  id: string;
  host_names: string;
  event_date: string | null;
  venue_name: string | null;
  venue_map_url: string | null;
  primary_color: string | null;
  photo_urls: string[] | null;
  music_url: string | null;
  whatsapp_number: string | null;
};
