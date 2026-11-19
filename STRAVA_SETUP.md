# Strava setup for Movata

Do these once, in order. About 15 minutes.

## 1. Create the Strava API app
1. Go to https://www.strava.com/settings/api (signed in to your own Strava account).
2. Fill in:
   - **Application Name:** Movata (don't use "Strava" in the name)
   - **Category:** Training (or whatever fits)
   - **Website:** https://movata.vercel.app
   - **Authorization Callback Domain:** `txaicetmxfehpnhjmjpc.supabase.co`
     (just the domain, no `https://` and no path)
3. Upload an icon, save, and copy the **Client ID** and **Client Secret**.

New apps can connect only **1 athlete** (you) at first. Strava lets you raise that to 10 without review.
Going past 10 requires their review.

## 2. Create the database tables
Supabase dashboard → **SQL Editor** → New query → paste all of
`supabase/migrations/20261119000000_strava_sync.sql` → **Run**.

## 3. Add the function secrets
Supabase dashboard → **Edge Functions** → **Secrets** (Manage secrets). Add:

| Name | Value |
|---|---|
| `APP_URL` | `https://movata.vercel.app` |
| `STRAVA_CLIENT_ID` | the Client ID from step 1 |
| `STRAVA_CLIENT_SECRET` | the Client Secret from step 1 |
| `STRAVA_STATE_SECRET` | any long random string (e.g. from https://www.uuidgenerator.net, paste two together) |
| `STRAVA_TOKEN_ENCRYPTION_KEY` | a *different* long random string. **Never change it later**, or saved connections stop working. |

Leave `STRAVA_REQUIRE_SUBSCRIPTION` unset while testing (Strava stays free).

## 4. Deploy the functions
Push this code (Dyad → GitHub). Then make sure both `strava-oauth` and `strava-sync` show up under
Edge Functions in Supabase. If Dyad doesn't deploy them automatically, use the Supabase CLI:
`supabase functions deploy strava-oauth --no-verify-jwt` and `supabase functions deploy strava-sync`.

**Important:** open `strava-oauth` in the Supabase dashboard → Details, and turn **off**
"Enforce JWT Verification". Strava sends the browser back to that function without a Movata login token,
so with verification on, every connection fails.

## 5. Test
1. Sign in at https://movata.vercel.app → Dashboard → **Connect Strava**.
2. Approve on Strava. You'll land back on the dashboard and a sync starts automatically.
3. The banner should say "Powered by Strava · N runs" and the stat cards should show your real numbers.
4. If something fails, check Supabase → Edge Functions → strava-oauth / strava-sync → **Logs**.

## How the data rules are handled
- Strava runs are stored in `strava_activities` as a cache. Every sync refreshes it, and rows older than
  7 days are deleted (Strava API Policy §6.2). The dashboard re-syncs automatically if the cache is more than 6 hours old.
- Only the athlete who owns the runs can read them, enforced by row-level security (§2.3).
- Runs deleted on Strava disappear on the next sync (§6.3).
- **Disconnect** revokes Movata's Strava access and deletes all of that user's Strava data.
- Public profile pages (`/:username`) never read Strava data.
