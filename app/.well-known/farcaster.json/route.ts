import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjUwOTU3OCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDI2NzdDMjNmMkViYjY3NjBFZTkzMjRCNmExZDNkRTIyNTg4NWU5N0QifQ",
      payload: "eyJkb21haW4iOiJyZW1pbmRlcnNiYXNlLnZlcmNlbC5hcHAifQ",
      signature: "O0dZuSBpNKIAHatj2bTSNfbRMXn9wkeLmbovJR6/54dDUIYl5PbpYWYeZ/A3e+umnIVV5dn5mCLSlbD5yMdZnRs="
    },
    frame: {
      version: "1",
      name: "Reminders",
      iconUrl: "https://remindersbase.vercel.app/logo.jpg", 
      splashImageUrl: "https://remindersbase.vercel.app/logo.jpg",
      splashBackgroundColor: "#1e90ff",
      homeUrl: "https://remindersbase.vercel.app",
    },
  };

  return NextResponse.json(config, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
