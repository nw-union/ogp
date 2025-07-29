import { useState } from "react";

/**
 * トップページ loader
 *
 */
interface OgpResponse {
  domain: string;
  url: string;
  icon: string;
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

/**
 * トップページ Show
 *
 */
export default function Show() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OgpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`エラー: ${response.status} ${response.statusText}`);
      }
      const data: OgpResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-6">
      <h1 className="text-3xl mb-8">OGP 情報取得ツール</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URLを入力してください (例: https://example.com)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "取得中..." : "取得"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="font-medium w-24">ドメイン:</dt>
                <dd className="text-gray-700">{result.domain}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-24">URL:</dt>
                <dd className="text-gray-700 break-all">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {result.url}
                  </a>
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="font-medium w-24">アイコン:</dt>
                <dd>
                  <img src={result.icon} alt="favicon" className="w-6 h-6" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">OGP情報</h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">タイトル:</dt>
                <dd className="text-gray-700">
                  {result.og.title || "（未設定）"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">サイト名:</dt>
                <dd className="text-gray-700">
                  {result.og.siteName || "（未設定）"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">説明:</dt>
                <dd className="text-gray-700">
                  {result.og.description || "（未設定）"}
                </dd>
              </div>
              {result.og.image && (
                <div>
                  <dt className="font-medium mb-2">画像:</dt>
                  <dd>
                    <img
                      src={result.og.image}
                      alt="OGP画像"
                      className="max-w-md max-h-64 w-full h-auto object-contain rounded-lg shadow-sm"
                    />
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Twitter Card情報</h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">カードタイプ:</dt>
                <dd className="text-gray-700">
                  {result.twitter.card || "（未設定）"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">タイトル:</dt>
                <dd className="text-gray-700">
                  {result.twitter.title || "（未設定）"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">説明:</dt>
                <dd className="text-gray-700">
                  {result.twitter.description || "（未設定）"}
                </dd>
              </div>
              {result.twitter.image &&
                result.twitter.image !== result.og.image && (
                  <div>
                    <dt className="font-medium mb-2">画像:</dt>
                    <dd>
                      <img
                        src={result.twitter.image}
                        alt="Twitter Card画像"
                        className="max-w-md max-h-64 w-full h-auto object-contain rounded-lg shadow-sm"
                      />
                    </dd>
                  </div>
                )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
