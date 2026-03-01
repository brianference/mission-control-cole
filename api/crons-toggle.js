// Cloudflare Pages Function - Toggle cron job enable/disable
// Path: /api/crons-toggle

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequestPost(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const cronId = searchParams.get('id');
    const enable = searchParams.get('enable') === 'true';
    
    if (!cronId) {
      return new Response(JSON.stringify({ 
        error: 'Missing cronId parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Call openclaw cron enable/disable <id>
    const command = `openclaw cron ${enable ? 'enable' : 'disable'} ${cronId}`;
    const { stdout, stderr } = await execAsync(command);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Cron ${enable ? 'enabled' : 'disabled'}`,
      cronId,
      enabled: enable,
      output: stdout || stderr
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to toggle cron:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to toggle cron',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
