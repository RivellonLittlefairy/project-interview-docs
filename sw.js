// 由 /root/workspace/.serve/gen-sw.py 自动生成，勿手改
const CACHE = "interview-docs-v3";
const PRECACHE = [
  "/",
  "/00-repository-inventory.html",
  "/10-android-business-repositories.html",
  "/20-android-infrastructure-media.html",
  "/2026-07-24-all-repositories-analysis-plan.html",
  "/30-cross-platform-rn-web.html",
  "/31-tools-samples-and-assets.html",
  "/40-android-docs-evidence-review.html",
  "/41-full-workspace-coverage-review.html",
  "/50-interview-project-summary.html",
  "/60-interview-question-bank.html",
  "/70-resume-and-star-stories.html",
  "/ANALYSIS-TEMPLATE.html",
  "/android-3-5-years-interview-guide.html",
  "/android-componentization-interview-guide.html",
  "/android-handler-looper-guide.html",
  "/android-home-performance-interview.html",
  "/android-interview-10-day-plan.html",
  "/android-lifecycle-process-death-guide.html",
  "/android-network-net-vipnet-guide.html",
  "/android-routing-arouter-zrouter-guide.html",
  "/android-storage-guide.html",
  "/android-view-touch-dispatch-interview.html",
  "/assets/app-icon-180.png",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/app-icon-maskable-512.png",
  "/assets/app-icon.svg",
  "/assets/docs.css",
  "/assets/docs.js",
  "/assets/home.css",
  "/assets/search-data.js",
  "/assets/site-theme.css",
  "/assets/site-theme.js",
  "/guides/android-custom-view-interview-guide.html",
  "/guides/claude-code-handbook.html",
  "/guides/devkit-mvi-packaging-analysis.html",
  "/guides/devkit-mvi-paging3-guide.html",
  "/guides/kotlin-keywords-interview-guide-design.html",
  "/guides/kotlin-keywords-interview-guide-plan.html",
  "/guides/kotlin-keywords-interview-guide.html",
  "/index.html",
  "/interview-spoken-answers.html",
  "/kotlin-data-structures-guide.html",
  "/manifest.json",
  "/mqtt-principles-guide.html",
  "/react-basics-for-android.html",
  "/react-native-0.72-principles.html",
  "/repositories/8j52srpw6x_matchfile.html",
  "/repositories/account.html",
  "/repositories/audio.html",
  "/repositories/barrage.html",
  "/repositories/blurview.html",
  "/repositories/bootstrap.html",
  "/repositories/bottomnav.html",
  "/repositories/camera.html",
  "/repositories/comment.html",
  "/repositories/common.html",
  "/repositories/cuda-samples.html",
  "/repositories/dependencies.html",
  "/repositories/devkit.html",
  "/repositories/feed.html",
  "/repositories/futureve.html",
  "/repositories/futureveglobal.html",
  "/repositories/html-anything.html",
  "/repositories/km-android-tools.html",
  "/repositories/km-attention.html",
  "/repositories/km_home_base.html",
  "/repositories/kmaudio.html",
  "/repositories/kmbase.html",
  "/repositories/kmcommon.html",
  "/repositories/kmdetailpage.html",
  "/repositories/kmreporter.html",
  "/repositories/knowledgemarket.html",
  "/repositories/liteknowledgemarket.html",
  "/repositories/mcp-financial-calculator.html",
  "/repositories/media.html",
  "/repositories/mediax.html",
  "/repositories/mercury-core.html",
  "/repositories/mercury.html",
  "/repositories/meter.html",
  "/repositories/moonlight-android.html",
  "/repositories/net.html",
  "/repositories/netdns.html",
  "/repositories/obsidian-skills.html",
  "/repositories/photos.html",
  "/repositories/picasa.html",
  "/repositories/picture.html",
  "/repositories/premium.html",
  "/repositories/purrfolio.html",
  "/repositories/readersdk-cmake.html",
  "/repositories/share.html",
  "/repositories/sharecore.html",
  "/repositories/videoentity.html",
  "/repositories/vip-skills.html",
  "/repositories/vipandroid.html",
  "/repositories/vipchannelcard.html",
  "/repositories/vipcomment.html",
  "/repositories/vipcommon.html",
  "/repositories/vipgrowth.html",
  "/repositories/viphome.html",
  "/repositories/vipkmaudio.html",
  "/repositories/vipmanuscript.html",
  "/repositories/vipmercury.html",
  "/repositories/vipnet.html",
  "/repositories/vippassport.html",
  "/repositories/vipprerender.html",
  "/repositories/vipprofile.html",
  "/repositories/vipreader.html",
  "/repositories/zheditor.html",
  "/repositories/zhihulite.html",
  "/repositories/zhplayer.html",
  "/repositories/zim.html",
  "/repositories/zrouter.html",
  "/repositories.html",
  "/sw.js",
];

const OFFLINE = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>页面打不开</title>
<style>body{font:16px/1.7 system-ui,sans-serif;margin:0;padding:32px 24px;color:#1f2321;background:#f7f7f5}
h1{font-size:20px;margin:0 0 12px}p{margin:0 0 12px;color:#4b524e}
code{background:#e4f0e9;padding:2px 6px;border-radius:4px;font-size:14px}
a{display:inline-block;margin-top:8px;color:#245d47;font-weight:600}</style></head>
<body><h1>这个页面没有缓存</h1>
<p>本地服务没在运行，网络请求失败，这份页面也不在离线缓存里。</p>
<p>在终端执行 <code>/root/workspace/.serve/serve.sh</code> 启动服务，再刷新即可。</p>
<a href="/index.html">回到首页</a></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 网络优先；拿不到就用缓存；仍然没有就明确告断，而不是偷偷跳到首页
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === "navigate") {
        return new Response(OFFLINE, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return Response.error();
    }
  })());
});
