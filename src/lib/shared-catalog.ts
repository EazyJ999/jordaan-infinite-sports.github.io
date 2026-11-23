import type { Sql } from "@/lib/db";
import { readDataFile, writeDataFile } from "@/lib/disk-store";

const PATH = "catalog/shop.json";

type Snap = {
  slug: string;
  name: string;
  team: string;
  sport: string;
  category: string;
  availability: string;
  region: string;
  kind: string;
  price: number;
  fanPrice: number;
  boxPrice: number | null;
  boxFanPrice: number | null;
  image: string;
  gallery: string;
  blurb: string;
  stock: number;
  sizes: string;
  sizeChart: string;
  printable: boolean;
  hidden: boolean;
  season: string;
  sortOrder: number;
  updatedAt: string;
};

function isSnap(value: unknown): value is Snap {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Snap>;
  return typeof row.slug === "string" && row.slug.length > 0 && Number.isInteger(Number(row.price));
}

async function readSnaps(): Promise<Snap[] | null> {
  const local = await readDataFile(PATH);
  if (local) {
    const parsed = JSON.parse(local) as unknown;
    if (Array.isArray(parsed)) {
      const rows = parsed.filter(isSnap);
      if (rows.length > 0) return rows;
    }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { get } = await import("@vercel/blob");
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
  if (!Array.isArray(parsed)) return null;
  const rows = parsed.filter(isSnap);
  if (rows.length > 0 && process.env.DATA_DIR) await writeDataFile(PATH, JSON.stringify(rows));
  return rows.length > 0 ? rows : null;
}

/** Copy the saved rail onto this server. The shop and the desk do not share memory. */
export async function pullSharedCatalog(sql: Sql) {
  try {
    const rows = await readSnaps();
    if (!rows) return;
    const keep = new Set<string>();
    for (const row of rows) {
      const price = Number(row.price);
      keep.add(row.slug);
      await sql`
        insert into products (
          slug, name, team, sport, category, availability, region, kind,
          price, fan_price, box_price, box_fan_price, image, gallery, blurb,
          stock, sizes, size_chart, printable, hidden, season, sort_order, updated_at
        )
        values (
          ${row.slug},
          ${row.name},
          ${row.team},
          ${row.sport},
          ${row.category},
          ${row.availability},
          ${row.region || "international"},
          ${row.kind || "jersey"},
          ${price},
          ${Number(row.fanPrice ?? price)},
          ${row.boxPrice},
          ${row.boxFanPrice},
          ${row.image},
          ${row.gallery || "[]"},
          ${row.blurb || ""},
          ${Number(row.stock) || 0},
          ${row.sizes || ""},
          ${row.sizeChart || ""},
          ${Boolean(row.printable)},
          ${Boolean(row.hidden)},
          ${row.season || ""},
          ${Number(row.sortOrder) || 0},
          ${row.updatedAt || new Date().toISOString()}
        )
        on conflict (slug) do update set
          name = excluded.name,
          team = excluded.team,
          sport = excluded.sport,
          category = excluded.category,
          availability = excluded.availability,
          price = excluded.price,
          fan_price = excluded.fan_price,
          box_price = excluded.box_price,
          box_fan_price = excluded.box_fan_price,
          image = excluded.image,
          gallery = excluded.gallery,
          blurb = excluded.blurb,
          stock = excluded.stock,
          sizes = excluded.sizes,
          size_chart = excluded.size_chart,
          printable = excluded.printable,
          hidden = excluded.hidden,
          season = excluded.season,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at
      `;
    }
    const existing = await sql<{ slug: string }>`select slug from products`;
    for (const row of existing) {
      if (!keep.has(row.slug)) await sql`delete from products where slug = ${row.slug}`;
    }
  } catch {
    // A missing snapshot must not hide the rail.
  }
}

/** Publish the rail so every shop server shows the same prices. */
export async function pushSharedCatalog(sql: Sql) {
  const rows = await sql<{
    slug: string;
    name: string;
    team: string;
    sport: string;
    category: string;
    availability: string;
    region: string;
    kind: string;
    price: number;
    fan_price: number;
    box_price: number | null;
    box_fan_price: number | null;
    image: string;
    gallery: string;
    blurb: string;
    stock: number;
    sizes: string;
    size_chart: string;
    printable: boolean;
    hidden: boolean;
    season: string;
    sort_order: number;
    updated_at: string;
  }>`
    select
      slug, name, team, sport, category, availability, region, kind,
      price, fan_price, box_price, box_fan_price, image, gallery, blurb,
      stock, sizes, size_chart, printable, hidden, season, sort_order,
      updated_at::text as updated_at
    from products
  `;
  const snaps: Snap[] = rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    team: row.team,
    sport: row.sport,
    category: row.category,
    availability: row.availability,
    region: row.region,
    kind: row.kind,
    price: Number(row.price),
    fanPrice: Number(row.fan_price ?? row.price),
    boxPrice: row.box_price == null ? null : Number(row.box_price),
    boxFanPrice: row.box_fan_price == null ? null : Number(row.box_fan_price),
    image: row.image,
    gallery: row.gallery || "[]",
    blurb: row.blurb || "",
    stock: Number(row.stock) || 0,
    sizes: row.sizes || "",
    sizeChart: row.size_chart || "",
    printable: Boolean(row.printable),
    hidden: Boolean(row.hidden),
    season: row.season || "",
    sortOrder: Number(row.sort_order) || 0,
    updatedAt: row.updated_at || new Date().toISOString(),
  }));
  if (process.env.DATA_DIR) {
    await writeDataFile(PATH, JSON.stringify(snaps));
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const { put } = await import("@vercel/blob");
  await put(PATH, JSON.stringify(snaps), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}
