// Cloudflare Pages Function - Run cron job immediately
// Path: /api/crons-run

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
    
    // Call openclaw cron run <id>
    const command = `openclaw cron run ${cronId}`;
    const { stdout, stderr } = await execAsync(command);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cron job triggered',
      cronId,
      output: stdout || stderr
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to run cron:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to run cron',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
