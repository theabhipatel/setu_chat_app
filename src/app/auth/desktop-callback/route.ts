import { NextResponse } from "next/server";

/**
 * Desktop OAuth Callback
 *
 * This route receives the OAuth code from Supabase and redirects it to the
 * Tauri desktop app via the setu:// deep link.
 *
 * IMPORTANT: We do NOT exchange the code here on the server. The code exchange
 * must happen client-side in the Tauri webview because the PKCE code_verifier
 * is stored in the webview's cookie/storage (set during signInWithOAuth).
 *
 * Flow:
 *   1. Supabase redirects here with ?code=xxx after Google OAuth
 *   2. This route renders an HTML page that redirects to setu://auth/callback?code=xxx
 *   3. Windows intercepts the setu:// URL and opens the Tauri app
 *   4. The TauriDeepLinkHandler exchanges the code client-side (has PKCE verifier)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new NextResponse(
      renderPage(
        "Authentication Failed",
        "No authorization code was received. Please try again.",
        null
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Build deep link URL — pass the code to the Tauri app
  const deepLinkUrl = `setu://auth/callback?code=${encodeURIComponent(code)}`;

  return new NextResponse(
    renderPage(
      "Authentication Successful!",
      "Redirecting you back to the Setu desktop app...",
      deepLinkUrl
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function renderPage(
  title: string,
  message: string,
  deepLinkUrl: string | null
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #0a0a0a;
      color: #ffffff;
    }
    .container { text-align: center; padding: 2rem; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #888; font-size: 0.875rem; }
    a { color: #7c3aed; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    ${deepLinkUrl ? '<div class="spinner"></div>' : ''}
    <h2>${title}</h2>
    <p>${message}</p>
    ${
      deepLinkUrl
        ? `<p style="margin-top: 1rem; font-size: 0.75rem;">
            If the app doesn't open automatically,
            <a href="${deepLinkUrl}">click here</a>.
          </p>
          <script>
            setTimeout(function() {
              window.location.href = "${deepLinkUrl}";
            }, 500);
          </script>`
        : ""
    }
  </div>
</body>
</html>`;
}
