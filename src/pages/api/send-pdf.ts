import type { APIRoute } from 'astro';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const POST: APIRoute = async ({ request }) => {
  const BOT_TOKEN = import.meta.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error("Vercel Environment Variable 'BOT_TOKEN' is not set.");
    return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), { status: 500 });
  }

  try {
    const { pdfBase64, userId } = await request.json();
    if (!pdfBase64 || !userId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing PDF data or user ID.' }), { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    const formData = new FormData();
    formData.append('chat_id', userId);
    formData.append('caption', 'Here is your 30-Day AstroTracker Report!');
    formData.append('document', pdfBuffer, {
      filename: 'AstroTracker-Report.pdf',
      contentType: 'application/pdf',
    });

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
    // @ts-ignore - FormData from 'form-data' and fetch's Body type can mismatch, this is safe.
    const tgResponse = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    const tgResponseData = await tgResponse.json();
    if (!tgResponse.ok) {
      console.error('Telegram API Error:', tgResponseData);
      throw new Error(tgResponseData.description || 'Failed to send PDF to Telegram.');
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Error:', errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
};