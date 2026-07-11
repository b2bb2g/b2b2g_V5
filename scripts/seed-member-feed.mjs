// Seeds initial public member-feed updates for visual and interaction QA.
// Usage: node scripts/seed-member-feed.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const password = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((line) => line.startsWith("SUPABASE_DB_PASSWORD="))
  ?.slice("SUPABASE_DB_PASSWORD=".length)
  .trim();
if (!password) throw new Error("SUPABASE_DB_PASSWORD missing");

const client = new pg.Client({
  host: "aws-1-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  user: "postgres.ruzamxdsuddjjuqmxokf",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query("begin");
  const { rows: profiles } = await client.query(
    "select id, uid from public.profiles where uid in (100001, 100027)",
  );
  const byUid = new Map(
    profiles.map((profile) => [Number(profile.uid), profile.id]),
  );
  if (!byUid.get(100001) || !byUid.get(100027))
    throw new Error("Seed profiles missing");

  const entries = [
    {
      uid: 100027,
      body: "Completed final dimensional inspection for a new batch of CNC-machined EV inverter housings. The team is now preparing export packaging and material certificates for buyer review.",
      media: [
        "/landing-v2/precision-manufacturing.jpg",
        "/catalog/ev-inverter-housing.jpg",
        "/catalog/automotive-injection-mold.jpg",
        "/generated/events/precision-sourcing-day.jpg",
        "/catalog/sanitary-pipe-fittings.jpg",
        "/generated/epc/electrolyzer-commissioning.jpg",
        "/generated/epc/turbine-hall-commissioning.jpg",
      ],
      hours: 26,
    },
    {
      uid: 100027,
      body: "Our sanitary fitting line added a new surface-finish inspection step this week. Sharing the result early helps buyers align documentation and acceptance criteria before shipment.",
      media: ["/catalog/sanitary-pipe-fittings.jpg"],
      hours: 18,
    },
    {
      uid: 100001,
      body: "A new EPC project brief is now available: 150 MWp solar PV paired with 300 MWh battery storage. The brief maps engineering, procurement, grid integration and commissioning partner packages.",
      media: ["/generated/epc/solar-epc-site.jpg"],
      hours: 8,
    },
  ];

  const inserted = [];
  for (const entry of entries) {
    await client.query(
      "delete from public.member_feed_posts where author_id = $1 and body = $2",
      [byUid.get(entry.uid), entry.body],
    );
    const { rows } = await client.query(
      `insert into public.member_feed_posts (author_id, body, media_paths, created_at)
       values ($1, $2, $3::text[], now() - ($4 * interval '1 hour'))
       returning id, author_id`,
      [byUid.get(entry.uid), entry.body, entry.media, entry.hours],
    );
    inserted.push({ ...rows[0], uid: entry.uid });
  }

  const firstMemberPost = inserted.find((post) => post.uid === 100027);
  const adminPost = inserted.find((post) => post.uid === 100001);
  if (firstMemberPost && adminPost) {
    await client.query(
      `insert into public.member_feed_likes (post_id, profile_id)
       values ($1, $2), ($3, $4)
       on conflict do nothing`,
      [firstMemberPost.id, byUid.get(100001), adminPost.id, byUid.get(100027)],
    );
    await client.query(
      `insert into public.member_feed_comments (post_id, author_id, body, created_at)
       values
         ($1, $2, 'The inspection documentation is clear. Please also share the available material certificates.', now() - interval '3 hours'),
         ($3, $4, 'We are reviewing the EPC package and will share our grid-integration capability shortly.', now() - interval '1 hour')`,
      [firstMemberPost.id, byUid.get(100001), adminPost.id, byUid.get(100027)],
    );
    await client.query(
      `insert into public.member_feed_reposts (post_id, profile_id)
       values ($1, $2), ($3, $4)
       on conflict do nothing`,
      [firstMemberPost.id, byUid.get(100001), adminPost.id, byUid.get(100027)],
    );
    await client.query(
      `insert into public.member_feed_shares (post_id, profile_id)
       values ($1, $2)
       on conflict do nothing`,
      [firstMemberPost.id, byUid.get(100001)],
    );
    await client.query(
      `insert into public.member_follows (follower_id, following_id)
       values ($1, $2), ($2, $1)
       on conflict do nothing`,
      [byUid.get(100001), byUid.get(100027)],
    );
  }
  await client.query("commit");
  console.log(JSON.stringify({ inserted }, null, 2));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
