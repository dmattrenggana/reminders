import { NextResponse } from "next/server";

export async function GET() {
  const config = {
     "accountAssociation": {
    "header": "eyJmaWQiOjUwOTU3OCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDI2NzdDMjNmMkViYjY3NjBFZTkzMjRCNmExZDNkRTIyNTg4NWU5N0QifQ",
    "payload": "eyJkb21haW4iOiJodHRwczovL3JlbWluZGVyc2Jhc2UudmVyY2VsLmFwcC8ifQ",
    "signature": "LrrqsMt+SkBcyLKgUB6qgc6degXStI90COxtYy2/qUljRz242+/netA78kfUhU/Hteig4ofAeM5qzkBY2xvVyRs="
  }
    frame: {
      version: "1",
      name: "Reminders",
      iconUrl: "https://remindersbase.vercel.app/logo.jpg", 
      splashImageUrl: "https://remindersbase.vercel.app/logo.jpg",
      splashBackgroundColor: "#4f46e5",
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
