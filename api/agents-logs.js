// Cloudflare Pages Function - Get OpenClaw agent logs
// Path: /api/agents-logs

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: 'Missing sessionId parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Call openclaw sessions history <sessionId> --json
    const { stdout } = await execAsync(`openclaw sessions history ${sessionId} --json`);
    const history = JSON.parse(stdout);
    
    return new Response(JSON.stringify({ 
      success: true,
      sessionId,
      messages: history.messages || [],
      messageCount: (history.messages || []).length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to fetch agent logs:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch agent logs',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
