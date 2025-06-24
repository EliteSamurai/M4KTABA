import { MetadataRoute } from "next";
import { readClient } from "@/studio-m4ktaba/client";

// Base URL for the site - replace with your actual domain
const BASE_URL = process.env.SITE_URL || "https://m4ktaba.com";

// Types for dynamic content
interface BlogPost {
  slug: string;
  publishedAt: string;
  updatedAt?: string;
}

interface Book {
  id: string;
  title: string;
  updatedAt?: string;
}

// Helper function to get the last modified date
const getLastModified = (date?: string) => {
  return date ? new Date(date) : new Date();
};

// Example function to fetch all blog posts
// Replace this with your actual data fetching logic
async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await readClient.fetch(`
      *[_type == "post" && publishedAt != null] {
        "slug": slug.current,
        publishedAt,
        updatedAt
      }
    `);
    return posts;
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
    return [];
  }
}

// Example function to fetch all books
// Replace this with your actual data fetching logic
async function getAllBooks(): Promise<Book[]> {
  // Example implementation - replace with your actual data source
  try {
    // Example: Fetch from Sanity or your API
    // const books = await client.fetch('*[_type == "book"]{ _id, title, updatedAt }')

    // For now, returning empty array - implement based on your data source
    return [];
  } catch (error) {
    console.error("Error fetching books for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic content
  const [blogPosts, books] = await Promise.all([
    getAllBlogPosts(),
    getAllBooks(),
  ]);

  // Static routes with their metadata
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/honey`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic blog post routes
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: getLastModified(post.updatedAt || post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic book routes
  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${BASE_URL}/books/${book.id}`,
    lastModified: getLastModified(book.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Combine all routes
  return [...staticRoutes, ...blogRoutes, ...bookRoutes];
}
