export async function GET() {
  const manifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/019ae4e2-2306-a7a6-e1e4-c07c554280b1"

  return new Response(null, {
    status: 307,
    headers: {
      Location: manifestUrl,
    },
  })
}
