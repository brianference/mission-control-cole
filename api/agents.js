// Cloudflare Pages Function - Real OpenClaw agent data
// Path: /api/agents

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequest(context) {
  try {
    // Call openclaw sessions list to get real agent data
    const { stdout } = await execAsync('openclaw sessions list --json');
    const sessions = JSON.parse(stdout);
    
    return new Response(JSON.stringify({ sessions }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch agent data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
