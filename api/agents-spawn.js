// Cloudflare Pages Function - Spawn a new OpenClaw agent
// Path: /api/agents-spawn

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { task, model, label } = body;
    
    if (!task) {
      return new Response(JSON.stringify({ 
        error: 'Missing task parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Build openclaw sessions spawn command
    let cmd = `openclaw sessions spawn --task="${task.replace(/"/g, '\\"')}"`;
    if (model) cmd += ` --model="${model}"`;
    if (label) cmd += ` --label="${label}"`;
    
    // Call openclaw sessions spawn
    const { stdout, stderr } = await execAsync(cmd);
    
    // Parse output to get session ID
    const output = stdout || stderr;
    const sessionIdMatch = output.match(/session[:\s]+([a-f0-9-]+)/i);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Agent spawned successfully',
      sessionId,
      output
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to spawn agent:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to spawn agent',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
