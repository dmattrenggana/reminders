/**
 * Script untuk setup Neynar webhook
 * 
 * Run dengan: npx tsx scripts/setup-neynar-webhook.ts
 * 
 * Atau bisa juga setup manual via Neynar Dashboard:
 * https://neynar.com/dashboard/webhooks
 */

import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEYNAR_API_KEY;
const webhookUrl = process.env.NEYNAR_WEBHOOK_URL || 'https://remindersbase.vercel.app/api/webhooks/neynar-cast';

if (!apiKey) {
  console.error('❌ NEYNAR_API_KEY not found in environment variables');
  console.error('Please set NEYNAR_API_KEY in .env.local');
  process.exit(1);
}

async function setupWebhook() {
  try {
    console.log('🚀 Setting up Neynar webhook...');
    console.log('Webhook URL:', webhookUrl);
    
    const config = new Configuration({
      apiKey: apiKey,
    });
    const client = new NeynarAPIClient(config);

    // Publish webhook dengan subscription untuk cast.created events
    // Filter: casts yang mengandung "Tick-tock" atau "Don't forget" dan URL app
    const webhook = await client.publishWebhook({
      name: "Reminders Base Verification",
      url: webhookUrl,
      subscription: {
        "cast.created": {
          // Match casts yang mengandung reminder keywords atau app URL
          text: "(?i)(Tick-tock|Don't forget|Beat the clock|approaching|remindersbase\\.vercel\\.app)",
        },
      },
    });

    console.log('✅ Webhook created successfully!');
    console.log('Webhook ID:', webhook.id);
    console.log('Webhook URL:', webhook.url);
    console.log('Subscription:', JSON.stringify(webhook.subscription, null, 2));
    
    console.log('\n📝 Next steps:');
    console.log('1. Test webhook dengan membuat cast yang match criteria');
    console.log('2. Check webhook logs di Neynar Dashboard');
    console.log('3. Monitor application logs untuk webhook events');
    
  } catch (error: any) {
    console.error('❌ Failed to setup webhook:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    
    if (error.message?.includes('already exists')) {
      console.log('\n💡 Webhook mungkin sudah ada. Coba:');
      console.log('1. Delete existing webhook dari Neynar Dashboard');
      console.log('2. Atau update webhook yang sudah ada');
    }
    
    process.exit(1);
  }
}

setupWebhook();

