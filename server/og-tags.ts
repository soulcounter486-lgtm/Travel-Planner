import { db } from "./db";
import { eq } from "drizzle-orm";
import { posts } from "@shared/schema";

interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
}

function extractFirstImage(htmlContent: string): string | null {
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function getPostOgData(postId: number): Promise<OgData | null> {
  try {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) return null;

    const contentText = stripHtml(post.content).slice(0, 200);
    const image = post.imageUrl || extractFirstImage(post.content) || "https://vungtau.blog/og-image.png";

    return {
      title: `${post.title} - 붕따우 도깨비`,
      description: contentText || "베트남 붕따우 여행의 모든것",
      image,
      url: `https://vungtau.blog/board/${post.id}`,
    };
  } catch {
    return null;
  }
}

export function injectOgTags(html: string, og: OgData): string {
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(og.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(og.description)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeHtml(og.image)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(og.url)}" />`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="article" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(og.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(og.description)}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${escapeHtml(og.image)}" />`
  );
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(og.title)}</title>`
  );
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function getOgDataForPath(urlPath: string): Promise<OgData | null> {
  const boardMatch = urlPath.match(/^\/board\/(\d+)/);
  if (boardMatch) {
    const postId = parseInt(boardMatch[1], 10);
    return getPostOgData(postId);
  }
  return null;
}
