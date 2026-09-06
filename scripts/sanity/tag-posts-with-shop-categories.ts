#!/usr/bin/env node
/** Migration: back-fill category slugs + link posts to store categories. Single script, native fetch. */
const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID) as string;
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET) as string;
const token = (process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN) as string;
const version = process.env.SANITY_API_VERSION || '2021-10-21';
const isDryRun = process.argv.includes('--dry-run');
const gqlBase = `https://${projectId}.api.sanity.io/v${version}/data/query/${dataset}`;
const mutBase = `https://${projectId}.api.sanity.io/v${version}/data/mutate/${dataset}?returnDocuments=false`;
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;
type SlugField = { current?: string | null };

async function gROQ<T = unknown>(query: string, params: Record<string, unknown> = {}): Promise<T> {
    const r = await fetch(gqlBase, { method: 'POST', headers, body: JSON.stringify({ query, params }) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`Sanity ${r.status}: ${JSON.stringify(j)}`);
  return j.result as T;
}
async function commitPatch(docId: string, set: Record<string, unknown>): Promise<void> {
    const r = await fetch(mutBase, { method: 'POST', headers, body: JSON.stringify({ mutations: [{ patch: { id: docId, set } }] }) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`Mutation failed: ${JSON.stringify(j)}`);
}
const slugify = (input: string): string =>
  input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const idTail = (id: string) => id.slice(0, 9);

// All 12 category documents (ids verified from the live dataset). In-stock book counts shown.
const CATEGORY_DOCS = [
  { id: 'f3B9PuFrOuEr1B8Bww1SAq', title: 'Other' },                  // 0 books
  { id: 'FCRjSKJY23zddSI4kBQluQ', title: 'Seerah' },                 // 0 books
  { id: 'dd1c013a-7701-464e-ad36-05ce1f8e78a9', title: 'adab' },      // 2 books
  { id: '1a488529-487b-4e5e-80a6-14cd052afa10', title: 'aqeedah' },  // 12 books
  { id: '600d5c97-3dc7-4edd-be82-bb7d0bd728d3', title: 'fiqh' },     // 5 books
  { id: '334d713d-cc08-44c9-b411-cab1b54a03db', title: 'hadith' },   // 5 books
  { id: '25384fc7-8846-42a2-a35a-b7b26ca96a63', title: 'history' },  // 1 book
  { id: 'abfd8ee4-75b6-48ce-aa7a-a83b9b69e496', title: 'poetry' },   // 0 books
  { id: '6950997a-dcef-4246-81e2-a254939a1004', title: 'quran' },    // 2 books
  { id: 'b195b789-120e-43a1-9abe-806117c04993', title: 'related-to-m4ktaba' }, // 0 books
  { id: 'ebfbc7ab-82f6-4af3-9f50-bc051879e2b9', title: 'reminders' }, // 1 book
  { id: '0651810d-a923-42a2-8462-967b79e67a2a', title: 'sidr-honey' }, // 0 books
];
const POST_CATEGORY_LINKS: { postSlug: string; categorySlugs: string[] }[] = [
  { postSlug: 'why-ibn-taymiyyah-is-hard-to-read-prerequisites', categorySlugs: ['aqeedah'] },
  { postSlug: 'the-guide-to-the-best-shafi-i-book-editions-and-which-one-you-actually-need', categorySlugs: ['fiqh'] },
  { postSlug: 'gender-roles-in-islam-are-they-unfair', categorySlugs: ['reminders'] },
  { postSlug: 'what-islamic-scholars-say-about-hitting-children', categorySlugs: ['fiqh'] },
  { postSlug: 'top-5-arabic-books-to-learn-arabic-in-2026', categorySlugs: ['adab'] },
  { postSlug: 'can-the-hadiths-of-the-prophet-be-used-as-a-linguistic-proof', categorySlugs: ['hadith'] },
  { postSlug: 'how-to-recite-the-quran-like-how-it-was-revealed', categorySlugs: ['quran'] },
  { postSlug: 'mindset-shift-on-money-from-the-quran', categorySlugs: ['quran'] },
  { postSlug: 'the-5-types-of-reading-you-should-do', categorySlugs: ['quran'] },
  { postSlug: 'we-fear-people-more-than-allah', categorySlugs: ['reminders'] },
  { postSlug: 'the-greatest-need-of-the-human-soul-in-islam', categorySlugs: ['aqeedah'] },
  { postSlug: 'qiraat-quran-readings-guide', categorySlugs: ['quran'] },
  { postSlug: 'hadith-jibreel-islam-iman-ihsan', categorySlugs: ['hadith'] },
  { postSlug: 'women-in-islam', categorySlugs: ['fiqh'] },
  { postSlug: 'prophets-in-islam', categorySlugs: ['aqeedah'] },
  { postSlug: 'months-in-islam', categorySlugs: ['fiqh'] },
  { postSlug: 'zakat-in-islam', categorySlugs: ['fiqh'] },
  { postSlug: 'best-arabic-book-to-teach-kids-islamic-creed-aqidah', categorySlugs: ['aqeedah'] },
  { postSlug: 'teaching-quran-with-purpose-a-simple-guide-for-educators', categorySlugs: ['quran'] },
  { postSlug: 'peices-of-advice-around-reflecting-on-the-quran', categorySlugs: ['quran'] },
  { postSlug: 'the-art-of-self-reckoning-lessons-from-ibn-al-muqaffa', categorySlugs: ['aqeedah'] },
  { postSlug: 'there-is-nothing-like-him-the-precision-of-quranic-expression', categorySlugs: ['quran'] },
  { postSlug: 'the-dangers-of-sins-from-ibn-al-qayyim-ad-daa-wad-dawaa', categorySlugs: ['aqeedah'] },
  { postSlug: 'the-keys-to-the-science-of-fiqh', categorySlugs: ['fiqh'] },
  { postSlug: 'the-religion-is-sincerity', categorySlugs: ['hadith'] },
  { postSlug: 'the-benefit-of-reminders', categorySlugs: ['reminders'] },
];

async function resolveCategoryRef(s: string): Promise<string | null> {
  const doc = await gROQ<{ _id: string } | null>(`*[_type == "category" && (slug.current == $s || title == $s)][0]{ _id }`, { s });
  return doc ? doc._id : null;
}
async function backfillCategorySlugs() {
  let would = 0, skipped = 0;
  console.log('\n=== Phase A: category slug back-fill (never overwrites) ===');
  for (const c of CATEGORY_DOCS) {
    const cur = await gROQ<{ slug?: SlugField | null }>(`*[_id == $id][0]{ "slug": slug }`, { id: c.id });
    const existing = cur?.slug?.current;
    if (existing) { skipped++; console.log(`   [skip] category "${c.title}" (_id ${c.id}) already has slug="${existing}"`); continue; }
    const next = slugify(c.title);
    if (isDryRun) { would++; console.log(`   [WOULD] set category "${c.title}" (_id ${c.id}) -> slug.current="${next}"`); }
    else { await commitPatch(c.id, { slug: { _type: 'slug', current: next } }); would++; console.log(`   [set]  category "${c.title}" -> slug.current="${next}"`); }
  }
  return { would, skipped };
}

async function tagPostsWithShopCategories() {
  let would = 0, skipped = 0, notFoundPost = 0, noCategory = 0;
  console.log('\n=== Phase B: post shopCategories back-fill (never overwrites) ===');
  for (const link of POST_CATEGORY_LINKS) {
    const post = await gROQ<{ _id: string; title: string; shopCount: number } | null>(
      `*[_type == "post" && slug.current == $s][0]{ _id, title, "shopCount": count(shopCategories[]) }`,
      { s: link.postSlug }
    );
    if (!post) { notFoundPost++; console.warn(`   ⚠️  post not found: "${link.postSlug}" — skipped`); continue; }
    if (post.shopCount > 0) { skipped++; console.log(`   [skip] post "${post.title}" already has ${post.shopCount} shopCategories — NOT overwriting`); continue; }

    const refs: string[] = [];
    for (const candidate of link.categorySlugs) {
      const ref = await resolveCategoryRef(candidate);
      if (ref && !refs.includes(ref)) refs.push(ref);
    }
    if (!refs.length) { noCategory++; console.warn(`   ⚠️  no matching category for post "${post.title}" (tried: ${link.categorySlugs.join(', ')}) — skipped`); continue; }

    const detail = await Promise.all(refs.map(async (r) => {
      const d = await gROQ<{ title?: string } | null>(`*[_id == $id][0]{ title }`, { id: r });
      const books = await gROQ<number>(`count(*[_type == "book" && quantity > 0 && selectedCategory._ref == $r])`, { r });
      return `${idTail(r)} (${d?.title ?? 'untitled'}, ${books} books)`;
    }));

    if (isDryRun) {
      would++;
      console.log(`   [WOULD] PATCH post "${idTail(post._id)} ${post.title}" -> shopCategories=[${detail.join(', ')}]`);
    } else {
      await commitPatch(post._id, { shopCategories: refs.map((ref) => ({ _type: 'reference', _ref: ref })) });
      would++;
      console.log(`   [set]  post "${post.title}" -> shopCategories=[${detail.join(', ')}]`);
    }
  }
  return { would, skipped, notFoundPost, noCategory };
}

async function main() {
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no writes committed)' : 'WRITE (commits to Sanity)'}`);
  const a = await backfillCategorySlugs();
  const b = await tagPostsWithShopCategories();
  console.log('\n=== SUMMARY ===');
  if (isDryRun) {
    console.log('  DRY-RUN — NOTHING COMMITTED. Intended writes:');
    console.log(`    Phase A  category slug sets        : ${a.would}   (skipped/already-set: ${a.skipped})`);
    console.log(`    Phase B  post shopCategories sets : ${b.would}   (skipped no-overwrite: ${b.skipped}, post-not-found: ${b.notFoundPost}, no-matching-category: ${b.noCategory})`);
  } else {
    console.log(`  WROTE ${a.would} category slug(s) (already-set skipped: ${a.skipped})`);
    console.log(`  set ${b.would} post shopCategories (skipped no-overwrite: ${b.skipped}, post-not-found: ${b.notFoundPost}, no-matching-category: ${b.noCategory})`);
  }
  console.log(isDryRun ? '  ✅ DRY-RUN complete — no changes written to Sanity.' : '  ✅ DONE — writes committed.');
}

main().catch((e) => { console.error('❌ failed:', e); process.exit(1); });