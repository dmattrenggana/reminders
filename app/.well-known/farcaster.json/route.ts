import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
     "accountAssociation": {
    "header": "eyJmaWQiOjUwOTU3OCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDI2NzdDMjNmMkViYjY3NjBFZTkzMjRCNmExZDNkRTIyNTg4NWU5N0QifQ",
    "payload": "eyJkb21haW4iOiJodHRwczovL3JlbWluZGVyc2Jhc2UudmVyY2VsLmFwcC8ifQ",
    "signature": "LrrqsMt+SkBcyLKgUB6qgc6degXStI90COxtYy2/qUljRz242+/netA78kfUhU/Hteig4ofAeM5qzkBY2xvVyRs="
    }
  });
}
