import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const returnTo = request.nextUrl.searchParams.get("returnTo") || "/"

    // Create a simple auth page that redirects to Warpcast
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in with Farcaster</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
      margin-bottom: 2rem;
    }
    .button {
      background: #8a63d2;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }
    .button:hover {
      background: #6b4ba6;
    }
    .note {
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign in with Farcaster</h1>
    <p>You'll be redirected to Warpcast to connect your Farcaster account.</p>
    <a href="https://warpcast.com" class="button">Continue to Warpcast</a>
    <p class="note">Note: For full functionality, please open this app in Warpcast or connect your wallet separately.</p>
  </div>
  
  <script>
    // For now, just show instructions
    // In production, you would implement proper Farcaster Auth Kit integration
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({
          type: 'FARCASTER_AUTH_CANCELLED'
        }, window.location.origin);
      }
    }, 5000);
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error in Farcaster auth:", error)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }
}
