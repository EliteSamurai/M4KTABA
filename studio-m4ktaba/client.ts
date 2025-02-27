import {createClient} from '@sanity/client'

export const readClient = createClient({
  projectId: '32kxkt38',
  dataset: 'blog-m4ktaba',
  apiVersion: '2025-02-19',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: true,
})

export const writeClient = createClient({
  projectId: '32kxkt38',
  dataset: 'blog-m4ktaba',
  apiVersion: '2025-02-19',
  token: process.env.NEXT_PUBLIC_SANITY_API_TOKEN!,
  useCdn: false,
})

export async function getTopSellers() {
  return readClient.fetch(`
    *[_type == "book"] | order(sales desc) [0...5] {
      _id,
      title,
      "author": author->name,
      "sales": coalesce(sales, 0),
      price
    }
  `)
}

export async function getAllBooks() {
  return readClient.fetch(`
    *[_type == "book"] {
      _id,
      title,
      "author": author->name,
      price,
      "sales": coalesce(sales, 0),
      "seller": seller->{
        name,
        email,
        "image": image.asset->url
      }
    }
  `)
}

// Fetch data every 30 minutes using ISR
export async function fetchLatestBooks() {
  const query = `*[_type == "book"] | order(_createdAt desc)[0...5]{
  _id,
  title,
  "photos[0]": photos[0].asset->url
}`

  try {
    const latestBooks = await readClient.fetch(query)
    return latestBooks
  } catch (error) {
    console.error('Error fetching latest books:', error)
    return []
  }
}
