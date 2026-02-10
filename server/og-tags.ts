import { db } from "./db";
import { eq } from "drizzle-orm";
import { posts, siteSettings } from "@shared/schema";

const DEFAULT_OG_IMAGE = "https://vungtau.blog/og-image.png";
const DEFAULT_OG_IMAGE_WIDTH = 1053;
const DEFAULT_OG_IMAGE_HEIGHT = 1053;

interface OgData {
  title: string;
  description: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  url: string;
  video?: string;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i;

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url);
}

function extractFirstImage(content: string): string | null {
  const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(content)) !== null) {
    const alt = match[1] || "";
    const src = match[2];
    if (alt === "동영상" || alt === "video" || isVideoUrl(src)) continue;
    return src;
  }

  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && !isVideoUrl(imgMatch[1])) return imgMatch[1];

  const urlMatch = content.match(/(https?:\/\/[^\s"'<>]+\/objects\/uploads\/[^\s"'<>]+)/);
  if (urlMatch && !isVideoUrl(urlMatch[1])) return urlMatch[1];

  return null;
}

function extractFirstVideo(content: string): string | null {
  const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(content)) !== null) {
    const alt = match[1] || "";
    const src = match[2];
    if (alt === "동영상" || alt === "video" || isVideoUrl(src)) return src;
  }
  return null;
}

function stripContent(content: string): string {
  let text = content;
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}

async function getPostOgData(postId: number): Promise<OgData | null> {
  try {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) return null;

    const contentText = stripContent(post.content).slice(0, 200);
    const postImage = post.imageUrl || extractFirstImage(post.content);
    const postVideo = extractFirstVideo(post.content);
    const image = postImage || DEFAULT_OG_IMAGE;

    return {
      title: `${post.title} - 붕따우 도깨비`,
      description: contentText || "베트남 붕따우 여행의 모든것",
      image,
      imageWidth: postImage ? undefined : DEFAULT_OG_IMAGE_WIDTH,
      imageHeight: postImage ? undefined : DEFAULT_OG_IMAGE_HEIGHT,
      url: `https://vungtau.blog/board/${post.id}`,
      video: postVideo || undefined,
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
  const imageMetaExtra = [];
  if (og.imageWidth && og.imageHeight) {
    imageMetaExtra.push(`<meta property="og:image:width" content="${og.imageWidth}" />`);
    imageMetaExtra.push(`<meta property="og:image:height" content="${og.imageHeight}" />`);
  }

  html = html.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeHtml(og.image)}" />\n    ${imageMetaExtra.join("\n    ")}`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(og.url)}" />`
  );
  if (og.video) {
    html = html.replace(
      /<meta property="og:type" content="[^"]*"\s*\/?>/,
      `<meta property="og:type" content="video.other" />\n    <meta property="og:video" content="${escapeHtml(og.video)}" />\n    <meta property="og:video:type" content="video/mp4" />\n    <meta property="og:video:width" content="720" />\n    <meta property="og:video:height" content="1280" />`
    );
  } else {
    html = html.replace(
      /<meta property="og:type" content="[^"]*"\s*\/?>/,
      `<meta property="og:type" content="article" />`
    );
  }
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(og.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(og.description)}" />`
  );
  if (og.video) {
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${escapeHtml(og.image)}" />\n    <meta name="twitter:card" content="player" />\n    <meta name="twitter:player" content="${escapeHtml(og.video)}" />`
    );
  } else {
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${escapeHtml(og.image)}" />`
    );
  }
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

export async function getSeoSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });
    return map;
  } catch {
    return {};
  }
}

export function injectSeoMeta(html: string, settings: Record<string, string>): string {
  const seoTitle = settings["seo_title"];
  const seoDesc = settings["seo_description"];
  const seoKeywords = settings["seo_keywords"];

  if (seoTitle) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seoTitle)}</title>`);
    html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(seoTitle)}" />`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(seoTitle)}" />`);
  }
  if (seoDesc) {
    html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(seoDesc)}" />`);
    html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(seoDesc)}" />`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(seoDesc)}" />`);
  }
  if (seoKeywords) {
    html = html.replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${escapeHtml(seoKeywords)}" />`);
  }
  return html;
}

