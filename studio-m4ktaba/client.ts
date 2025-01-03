import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: '32kxkt38',
  dataset: 'blog-m4ktaba',
  apiVersion: '2024-01-01',
  token:
    'sk8KlSga9hjImi9qZEE7iiVA1LuRAaIsQYMkM7jjjLnDQGWUc4AfK9tIA8qLULHHWF33yVN1yZguG61Jsflw6SM9ZdB08tLcaeSZBs91yEGtDw9IAnH6rnRk9prdpBsS2kR5yRgo4MCnOkJZPfk3pgeFDeJVDAAeDMzL8dp5R3StlWRxsmGQ',
  useCdn: true, 
})

export async function getTopSellers() {
  return client.fetch(`
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
  return client.fetch(`
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
    const latestBooks = await client.fetch(query)
    return latestBooks
  } catch (error) {
    console.error('Error fetching latest books:', error)
    return []
  }
}
