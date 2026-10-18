import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentEngine } from '@/lib/deployment-engine';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await extractAuth(req);
    const engine = getDeploymentEngine();

    const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Site — Deployed with Drop</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="badge">Live Demo Site</div>
      <h1>Hello, World!</h1>
      <p class="subtitle">This static site was deployed in less than 1 second on Drop.</p>
    </header>

    <div class="card">
      <div class="card-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="window-title">drop-demo.html</span>
      </div>
      <div class="card-body">
        <p><strong>Deployment Features Verified:</strong></p>
        <ul class="feature-list">
          <li>Zero forced branding or injected ads</li>
          <li>Real static asset resolution (HTML + CSS + JS)</li>
          <li>Instant live public URL</li>
          <li>Sub-second deployment pipeline</li>
        </ul>
        <div class="interactive-box">
          <button id="counter-btn" class="btn">Click me: <span id="count">0</span></button>
          <button id="time-btn" class="btn secondary">Get Server Time</button>
        </div>
        <p id="msg" class="status-text"></p>
      </div>
    </div>

    <footer class="footer">
      <p>Clean code. Zero tracking. Hosted completely free.</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

    const demoCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #09090b;
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}
.container {
  max-width: 600px;
  width: 100%;
}
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.badge {
  display: inline-block;
  background: #18181b;
  border: 1px solid #27272a;
  color: #a1a1aa;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;
}
h1 {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #a1a1aa;
  font-size: 1rem;
}
.card {
  background: #121215;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}
.card-header {
  background: #18181b;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-bottom: 1px solid #27272a;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }
.window-title {
  color: #71717a;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  font-family: monospace;
}
.card-body {
  padding: 1.5rem;
}
.feature-list {
  margin: 1rem 0 1.5rem 1.25rem;
  color: #d4d4d8;
  font-size: 0.9rem;
  line-height: 1.6;
}
.interactive-box {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.btn:hover { opacity: 0.9; }
.btn.secondary {
  background: #27272a;
  color: #f4f4f5;
}
.status-text {
  font-size: 0.825rem;
  color: #10b981;
  font-family: monospace;
  min-height: 1.2rem;
}
.footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.8rem;
  color: #71717a;
}`;

    const demoJs = `let count = 0;
const countSpan = document.getElementById('count');
const btn = document.getElementById('counter-btn');
const timeBtn = document.getElementById('time-btn');
const msg = document.getElementById('msg');

btn.addEventListener('click', () => {
  count++;
  countSpan.textContent = count;
  msg.textContent = 'Interactivity verified! Counter clicked ' + count + ' times.';
});

timeBtn.addEventListener('click', () => {
  msg.textContent = 'Browser local time: ' + new Date().toLocaleTimeString();
});`;

    const result = await engine.deployFileMap(
      [
        { path: 'index.html', content: demoHtml },
        { path: 'style.css', content: demoCss },
        { path: 'script.js', content: demoJs },
      ],
      {
        name: 'Demo Project',
        ownerId: auth.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Demo website deployed successfully',
      url: result.url,
      deployment: result.deployment,
      claim_token: result.claimToken,
      deletion_token: result.deletionToken,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to deploy demo' }, { status: 500 });
  }
}
