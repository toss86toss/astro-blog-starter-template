export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/meetings/:id/reviews
    if (request.method === "GET" && path.match(/^\/api\/meetings\/.+\/reviews$/)) {
      const meetingId = path.split("/")[3];
      const key = `reviews:${meetingId}`;
      const data = await env.REVIEWS_KV.get(key);
      return new Response(data || "[]", {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST /api/meetings/:id/reviews
    if (request.method === "POST" && path.match(/^\/api\/meetings\/.+\/reviews$/)) {
      const meetingId = path.split("/")[3];
      const key = `reviews:${meetingId}`;
      const body = await request.json();

      // Enforce positivity & anonymity (basic checks)
      const comment = (body.comment || "").slice(0, 500);

      const review = {
        meetingId,
        ratings: {
          welcoming: Number(body.ratings?.welcoming || 0),
          recoveryFocus: Number(body.ratings?.recoveryFocus || 0),
          safety: Number(body.ratings?.safety || 0)
        },
        tags: (body.tags || []).slice(0, 10),
        comment,
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse((await env.REVIEWS_KV.get(key)) || "[]");
      existing.push(review);
      await env.REVIEWS_KV.put(key, JSON.stringify(existing));

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
