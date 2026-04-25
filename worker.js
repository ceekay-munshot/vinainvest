const REPO_OWNER = "ceekay-munshot";
const REPO_NAME = "vinainvest";
const REFRESH_WORKFLOW = "refresh-investor.yml";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/refresh-investor") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
      if (request.method !== "POST") return json({ error: "POST required" }, 405);
      return handleRefresh(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleRefresh(request, env) {
  if (!env.GH_TOKEN) {
    return json({ error: "GH_TOKEN secret is not configured on this Worker." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const slug = String(body.slug || "").trim();
  const sourceUrl = String(body.url || "").trim();
  if (!slug || !sourceUrl) {
    return json({ error: "slug and url are both required" }, 400);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return json({ error: "slug contains invalid characters" }, 400);
  }
  try {
    new URL(sourceUrl);
  } catch {
    return json({ error: "url is not a valid URL" }, 400);
  }

  const dispatchRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${REFRESH_WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "vinainvest-dashboard"
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { slug, url: sourceUrl }
      })
    }
  );

  if (!dispatchRes.ok) {
    const text = await dispatchRes.text();
    return json({ error: `GitHub dispatch failed (${dispatchRes.status})`, detail: text.slice(0, 500) }, 502);
  }

  return json({
    status: "dispatched",
    message: "Refresh workflow triggered. Reload the page in ~90 seconds.",
    runsUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${REFRESH_WORKFLOW}`
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
