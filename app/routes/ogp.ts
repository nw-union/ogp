import type { LoaderFunction } from "react-router";

// レスポンスの型
interface ResponseJson {
  domain: string;
  url: string;
  icon: string;
  author: string;
  publishedTime: string;
  og: {
    title: string;
    siteName: string;
    description: string;
    image: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

class IconParser {
  icon: string | null;

  constructor() {
    this.icon = null;
  }

  element(element: Element) {
    if (element.getAttribute("rel") === "icon") {
      this.icon = element.getAttribute("href");
    }
  }
}

class TwitterParser {
  card: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;

  constructor() {
    this.card = "";
    this.title = "";
    this.description = "";
    this.imageUrl = "";
    this.author = "";
  }

  element(element: Element) {
    switch (element.getAttribute("name")) {
      case "twitter:card":
        this.card = element.getAttribute("content") ?? "";
        break;
      case "twitter:title":
        this.title = element.getAttribute("content") ?? "";
        break;
      case "twitter:description":
        this.description = element.getAttribute("content") ?? "";
        break;
      case "twitter:image":
        this.imageUrl = element.getAttribute("content") ?? "";
        break;
      case "author":
        this.author = element.getAttribute("content") ?? "";
        break;
      default:
        break;
    }
  }
}

class OgpParser {
  title: string;
  siteName: string;
  description: string;
  imageUrl: string;
  publishedTime: string;

  constructor() {
    this.title = "";
    this.description = "";
    this.imageUrl = "";
    this.siteName = "";
    this.publishedTime = "";
  }
  element(element: Element) {
    switch (element.getAttribute("property")) {
      case "og:title":
        this.title = element.getAttribute("content") ?? "";
        break;
      case "og:description":
        this.description = element.getAttribute("content") ?? "";
        break;
      case "og:image":
        this.imageUrl = element.getAttribute("content") ?? "";
        break;
      case "og:site_name":
        this.siteName = element.getAttribute("content") ?? "";
        break;
      case "article:published_time":
        this.publishedTime = element.getAttribute("content") ?? "";
        break;
      default:
        break;
    }
  }
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const env = context.cloudflare.env;
  const kv = env.OGP_CACHE;

  // url クエリがない場合は 400
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return new Response("url is required", { status: 400 });
  }

  // 検索先のURLを取得
  let target: URL;
  try {
    target = new URL(url);
  } catch (e) {
    return new Response(`bad request. err: ${e}`, { status: 400 });
  }

  // KV キャッシュキー（URLのハッシュ値を使用）
  const cacheKey = `ogp:${target.toString()}`;

  // キャッシュをチェック
  const cached = await kv.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "X-KV-Cache": "HIT",
      },
    });
  }

  // 検索先サイトにアクセス
  const siteRes = await fetch(target);
  if (!siteRes.ok) {
    return new Response("not found", { status: 404 });
  }

  // メタ情報を取得
  const ogpParser = new OgpParser();
  const twitterParser = new TwitterParser();
  const iconParser = new IconParser();
  const rewriter = new HTMLRewriter()
    .on("meta", ogpParser)
    .on("meta", twitterParser)
    .on("link", iconParser);
  await rewriter.transform(new Response(siteRes.body)).text();

  // レスポンスを作成
  const responseData: ResponseJson = {
    domain: target.hostname,
    url: target.toString(),
    icon:
      iconParser.icon ?? `${target.protocol}//${target.hostname}/favicon.ico`,
    author: twitterParser.author,
    publishedTime: ogpParser.publishedTime,
    og: {
      title: ogpParser.title,
      siteName: ogpParser.siteName,
      description: ogpParser.description,
      image: ogpParser.imageUrl,
    },
    twitter: {
      card: twitterParser.card,
      title: twitterParser.title,
      description: twitterParser.description,
      image: twitterParser.imageUrl,
    },
  };

  const response = JSON.stringify(responseData);

  // KV にキャッシュを保存（TTL: 7日間）
  await kv.put(cacheKey, response, {
    expirationTtl: 60 * 60 * 24 * 7, // 7 days
  });

  return new Response(response, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "X-KV-Cache": "MISS",
    },
  });
};
