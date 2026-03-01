// Cloudflare Pages Function - Delete cron job
// Path: /api/crons-delete

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequestPost(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const cronId = searchParams.get('id');
    
    if (!cronId) {
      return new Response(JSON.stringify({ 
        error: 'Missing cronId parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Call openclaw cron delete <id>
    const command = `openclaw cron delete ${cronId}`;
    const { stdout, stderr } = await execAsync(command);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cron job deleted',
      cronId,
      output: stdout || stderr
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to delete cron:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to delete cron',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
