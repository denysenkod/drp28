const APP_NAME = 'DRP28';
const API_MESSAGE = 'Backend is running on Cloudflare Workers.';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/status') {
      return json({
        ok: true,
        app: APP_NAME,
        message: API_MESSAGE
      });
    }

    return env.ASSETS.fetch(request);
  }
};
