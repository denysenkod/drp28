const APP_NAME = 'DRP28';
const API_MESSAGE = 'Backend is running on Cloudflare Workers.';

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers
    }
  });
}

function html(content: string, init: ResponseInit = {}): Response {
  return new Response(content, {
    ...init,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...init.headers
    }
  });
}

function renderHome(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${APP_NAME}</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        color: #111827;
        background: #f8fafc;
      }

      main {
        max-width: 720px;
        margin: 0 auto;
        padding: 64px 20px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 40px;
      }

      p {
        font-size: 18px;
        line-height: 1.5;
      }

      #api-response {
        margin-top: 24px;
        padding: 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${APP_NAME}</h1>
      <p>A minimal frontend served by a TypeScript Cloudflare Worker.</p>
      <div id="api-response">Loading backend status...</div>
    </main>
    <script>
      async function loadStatus() {
        const target = document.getElementById('api-response');

        try {
          const response = await fetch('/api/status');
          const data = await response.json();
          target.textContent = data.message;
        } catch (error) {
          target.textContent = 'Unable to reach backend.';
        }
      }

      loadStatus();
    </script>
  </body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return html(renderHome());
    }

    if (url.pathname === '/api/status') {
      return json({
        ok: true,
        app: APP_NAME,
        message: API_MESSAGE
      });
    }

    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    });
  }
};
