const MESSAGE = 'Hello, World! 🚀 Deployed via Cloudflare Workers.';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/') {
      return new Response('Not found', { status: 404 });
    }

    return new Response(MESSAGE, {
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    });
  }
};
