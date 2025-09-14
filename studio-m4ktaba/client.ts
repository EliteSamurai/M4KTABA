import {readClient, writeClient} from '@/lib/sanity-clients'

export {readClient, writeClient}

export async function getTopSellers() {
  return (readClient as any).fetch(`
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
  return (readClient as any).fetch(`
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
    const latestBooks = await (readClient as any).fetch(query)
    return latestBooks
  } catch (error) {
    console.error('Error fetching latest books:', error)
    return []
  }
}
