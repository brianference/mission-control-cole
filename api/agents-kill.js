// Cloudflare Pages Function - Kill an OpenClaw agent
// Path: /api/agents-kill

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequestPost(context) {
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
    
    // Call openclaw subagents kill <sessionId>
    const { stdout, stderr } = await execAsync(`openclaw subagents kill ${sessionId}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Agent ${sessionId} killed`,
      output: stdout || stderr
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to kill agent:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to kill agent',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
