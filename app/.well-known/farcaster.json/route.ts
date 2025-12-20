import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjUwOTU3OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGJkNThmNTc1ODEzRTM4OEM0OTIwNTlCM0ZhRmUzYzk2YjJGNzRmNzUifQ",
      payload: "eyJkb21haW4iOiJyZW1pbmRlcnNiYXNlLnZlcmNlbC5hcHAifQ",
      signature: "eeni1CPvW8ojznVoby6doMEDMwIG8/U+0IDFjB1S+o18QeDKht4ti8Fv3iPuXYIPQL3AZ7UsPsEUxZvzjjufJxw="
    },
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
      "Cache-Control": "no-store, max-age=0", 
    },
  });
}
