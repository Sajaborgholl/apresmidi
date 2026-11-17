// For pages that are cached and rebuilt in the background (the homepage and
// the /templates pages, `revalidate` in each). A Supabase error there must not
// quietly become "no templates" or a 404, because that broken page would then
// be cached and shown to everyone until the next rebuild. Throwing instead
// makes Next.js keep serving the last good copy (and fails a deploy rather
// than shipping an empty homepage).
export function mustQuery<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}
