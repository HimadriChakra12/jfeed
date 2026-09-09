// ==UserScript==
// @name         Jfeed
// @namespace    https://github.com/HimadriChakra12/jfeed.git
// @version      1.0.0
// @description  A rss get using userscript
// @match        *://*/*
// @grant        GM_xmlhttpRequestGM_setClipboardGM_registerMenuCommandGM_addStyle
// @Source       https://github.com/shevabam/get-rss-feed-url-extension.git
// @run-at       document-start
// ==/UserScript==

// ---- start.js ----
(() => {
  'use strict';

// ---- craft/functions.js ----
    const FEED_MIME_TYPES = [
        'application/rss+xml', 'application/atom+xml', 'application/rdf+xml',
        'application/rss', 'application/atom', 'application/rdf',
        'text/rss+xml', 'text/atom+xml', 'text/rdf+xml',
        'text/rss', 'text/atom', 'text/rdf'
    ];

    const GUESS_PATHS = [
        '/feed', '/feed/', '/rss', '/rss/', '/rss.xml', '/feed.xml',
        '/rss/news.xml', '/articles/feed', '/rss/index.html',
        '/blog/feed/', '/blog/feed.xml', '/blog/rss/', '/blog/rss.xml',
        '/feed/posts/default', '/rss/featured'
    ];

    const REQUEST_TIMEOUT_MS = 6000;

// ---- craft/rules.js ----
    const SITE_RULES = [
        {
            name: 'YouTube channel/user',
            test: /^https?:\/\/(www\.)?youtube\.com\/(channel|c|user)\/([^/?#]+)/i,
            build(url) {
                const path = new URL(url).pathname;
                let param = null;
                if (path.startsWith('/channel/')) param = 'channel_id=' + path.split('/')[2];
                else if (path.startsWith('/c/')) param = 'user=' + path.split('/')[2];
                else if (path.startsWith('/user/')) param = 'user=' + path.split('/')[2];
                if (!param) return [];
                return [{ title: 'Channel uploads', url: 'https://www.youtube.com/feeds/videos.xml?' + param }];
            }
        },
        {
            name: 'YouTube playlist',
            test: /^https?:\/\/(www\.)?youtube\.com\/playlist\?.*list=/i,
            build(url) {
                const id = new URL(url).searchParams.get('list');
                if (!id) return [];
                return [{ title: 'Playlist', url: 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + id }];
            }
        },
        {
            name: 'Reddit front page',
            test: /^https?:\/\/(www\.)?reddit\.com\/?$/i,
            build(url) {
                const base = url.endsWith('/') ? url : url + '/';
                return [{ title: 'Reddit front page', url: base + '.rss' }];
            }
        },
        {
            name: 'Reddit post comments',
            test: /^https?:\/\/(www\.)?reddit\.com\/r\/[^/]+\/comments\/[^/]+\/[^/]+/i,
            build(url) {
                const base = url.replace(/\/$/, '');
                return [{ title: 'Post comments', url: base + '.rss' }];
            }
        },
        {
            name: 'Reddit user',
            test: /^https?:\/\/(www\.)?reddit\.com\/user\/[^/?#]+/i,
            build(url) {
                const base = url.replace(/\/$/, '');
                return [{ title: 'User activity', url: base + '.rss' }];
            }
        },
        {
            name: 'Subreddit',
            test: /^https?:\/\/(www\.)?reddit\.com\/r\/[^/?#]+\/?$/i,
            build(url) {
                const base = url.replace(/\/$/, '');
                return [{ title: 'Subreddit', url: base + '.rss' }];
            }
        },
        {
            name: 'GitHub repo',
            test: /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+\/?$/i,
            build(url) {
                const u = new URL(url);
                const base = u.origin + u.pathname.replace(/\/$/, '');
                return [
                    { title: 'Releases', url: base + '/releases.atom' },
                    { title: 'Commits', url: base + '/commits.atom' },
                    { title: 'Tags', url: base + '/tags.atom' }
                ];
            }
        },
        {
            name: 'GitHub user',
            test: /^https?:\/\/(www\.)?github\.com\/[^/]+\/?$/i,
            build(url) {
                const base = url.replace(/\/$/, '');
                return [{ title: 'User activity', url: base + '.atom' }];
            }
        },
        {
            name: 'GitLab repo',
            test: /^https?:\/\/(www\.)?gitlab\.com\/[^/]+\/[^/]+\/?$/i,
            build(url) {
                const base = url.replace(/\/$/, '');
                return [{ title: 'Commits', url: base + '.atom' }];
            }
        },
        {
            name: 'Medium tag',
            test: /^https?:\/\/(www\.)?medium\.com\/tag\/[^/?#]+/i,
            build(url) {
                return [{ title: 'Medium tag', url: url.replace('/tag/', '/feed/tag/') }];
            }
        },
        {
            name: 'itch.io',
            test: /^https?:\/\/(www\.)?itch\.io\/[^/?#]+/i,
            build(url) {
                return [{ title: 'itch.io feed', url: url + '.xml' }];
            }
        },
        {
            name: 'mirror.xyz',
            test: /^https?:\/\/[a-z0-9-]+\.mirror\.xyz\/[^/?#]+/i,
            build(url) {
                const u = new URL(url);
                return [{ title: 'mirror.xyz feed', url: u.origin + '/feed/atom' }];
            }
        },
        {
            name: 'Vimeo user',
            test: /^https?:\/\/(www\.)?vimeo\.com\/[a-zA-Z][^/?#]*/i,
            build(url) {
                const base = url.replace(/\/videos\/?$/, '');
                return [{ title: 'Vimeo uploads', url: base + '/videos/rss' }];
            }
        },
        {
            name: 'Kickstarter project',
            test: /^https?:\/\/(www\.)?kickstarter\.com\//i,
            build(url) {
                const base = url.split('?')[0].replace(/\/$/, '');
                return [{ title: 'Project updates', url: base + '/posts.atom' }];
            }
        },
        {
            name: 'Facebook page',
            test: /^https?:\/\/(www\.)?facebook\.com\/([^/?#]+)\/?$/i,
            build(url) {
                const m = url.match(/facebook\.com\/([^/?#]+)/i);
                if (!m) return [];
                const slug = m[1];
                if (['profile.php', 'groups', 'events', 'watch', 'marketplace', 'photo', 'photo.php'].includes(slug)) return [];
                return [{ title: 'Facebook page (legacy endpoint, may be dead)', url: 'https://www.facebook.com/feeds/page.php?format=rss20&id=' + slug }];
            }
        }
    ];

// ---- craft/fetch.js ----
    function gmFetch(url, opts = {}) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: opts.method || 'GET',
                url,
                timeout: REQUEST_TIMEOUT_MS,
                headers: opts.headers || {},
                onload: (res) => resolve(res),
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
            });
        });
    }

    function feedsFromHeadLinks() {
        const found = [];
        document.querySelectorAll('link[rel="alternate"][type], link[type]').forEach((el) => {
            const type = (el.getAttribute('type') || '').toLowerCase();
            if (!FEED_MIME_TYPES.includes(type)) return;
            let href = el.getAttribute('href');
            if (!href) return;
            href = new URL(href, location.href).href;
            found.push({ title: el.getAttribute('title') || href, url: href });
        });
        return found;
    }

    function matchSiteRule(url) {
        for (const rule of SITE_RULES) {
            if (rule.test.test(url)) {
                const feeds = rule.build(url);
                if (feeds.length) return feeds;
            }
        }
        return null;
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function truncateMiddle(str, max) {
        if (str.length <= max) return str;
        const half = Math.floor((max - 1) / 2);
        return str.slice(0, half) + '…' + str.slice(str.length - half);
    }

    function looksLikeFeed(text) {
        return /<rss[\s>]/i.test(text) || /<feed[\s>]/i.test(text);
    }

    async function guessFeedByProbing(origin) {
        for (const path of GUESS_PATHS) {
            const candidate = origin + path;
            const res = await gmFetch(candidate);
            if (res && res.status >= 200 && res.status < 300 && looksLikeFeed(res.responseText)) {
                return { title: candidate, url: candidate };
            }
        }
        return null;
    }

    async function findFeeds() {
        const pageUrl = location.href;

        const siteMatch = matchSiteRule(pageUrl);
        if (siteMatch) return siteMatch;

        const headFeeds = feedsFromHeadLinks();
        if (headFeeds.length) return headFeeds;

        const guessed = await guessFeedByProbing(location.origin);
        return guessed ? [guessed] : [];
    }

// ---- craft/panel.js ----
    GM_addStyle(`
        #rfu-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 340px;
            max-height: 440px;
            display: flex;
            flex-direction: column;
            background: #17181c;
            color: #e8e8ea;
            border: 1px solid #2a2b31;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.02);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-size: 13px;
            z-index: 2147483647;
            opacity: 0;
            transform: translateY(8px) scale(.98);
            pointer-events: none;
            transition: opacity .16s ease, transform .16s ease;
        }
        #rfu-panel.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        #rfu-panel .rfu-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 14px;
            border-bottom: 1px solid #2a2b31;
            flex-shrink: 0;
        }
        #rfu-panel .rfu-header .rfu-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ee802f;
            flex-shrink: 0;
        }
        #rfu-panel .rfu-header .rfu-title {
            font-weight: 600;
            letter-spacing: .1px;
        }
        #rfu-panel .rfu-header .rfu-count {
            color: #82838a;
            font-size: 11px;
        }
        #rfu-panel .rfu-header .rfu-close {
            margin-left: auto;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            cursor: pointer;
            color: #82838a;
            font-size: 15px;
            line-height: 1;
        }
        #rfu-panel .rfu-header .rfu-close:hover {
            background: #23242a;
            color: #e8e8ea;
        }
        #rfu-panel .rfu-body {
            overflow-y: auto;
        }
        #rfu-panel .rfu-body::-webkit-scrollbar { width: 8px; }
        #rfu-panel .rfu-body::-webkit-scrollbar-track { background: transparent; }
        #rfu-panel .rfu-body::-webkit-scrollbar-thumb {
            background: #34353c;
            border-radius: 4px;
        }
        #rfu-panel .rfu-item {
            padding: 10px 14px;
            border-bottom: 1px solid #212227;
            transition: background .1s ease;
        }
        #rfu-panel .rfu-item:last-child { border-bottom: none; }
        #rfu-panel .rfu-item:hover { background: #1c1d22; }
        #rfu-panel .rfu-item a.rfu-name {
            color: #f2f2f3;
            text-decoration: none;
            display: block;
            word-break: break-word;
            font-weight: 600;
        }
        #rfu-panel .rfu-item a.rfu-name:hover { color: #ee802f; }
        #rfu-panel .rfu-item .rfu-url {
            color: #82838a;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 11px;
            margin-top: 3px;
            word-break: break-all;
        }
        #rfu-panel .rfu-copy {
            margin-top: 6px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #23242a;
            border: 1px solid #2f3038;
            padding: 3px 9px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            color: #c7c8cc;
            transition: background .1s ease, border-color .1s ease;
        }
        #rfu-panel .rfu-copy:hover { background: #2a2b32; border-color: #3a3b44; }
        #rfu-panel .rfu-copy.rfu-copied { color: #6fce8a; border-color: #2c4a37; }
        #rfu-panel .rfu-empty, #rfu-panel .rfu-loading {
            padding: 24px 14px;
            text-align: center;
            color: #82838a;
        }
        #rfu-panel .rfu-copyall {
            display: block;
            text-align: center;
            padding: 10px;
            cursor: pointer;
            color: #ee802f;
            font-weight: 600;
            flex-shrink: 0;
            border-top: 1px solid #2a2b31;
        }
        #rfu-panel .rfu-copyall:hover { background: #1c1d22; }
    `);

    let panelOpen = false;
    let panel;

    function buildPanelShell() {
        panel = document.createElement('div');
        panel.id = 'rfu-panel';
        panel.innerHTML = `
            <div class="rfu-header">
                <span class="rfu-dot"></span>
                <span class="rfu-title">RSS feeds</span>
                <span class="rfu-count"></span>
                <span class="rfu-close" title="Close">&times;</span>
            </div>
            <div class="rfu-body"></div>
        `;
        document.body.appendChild(panel);

        panel.querySelector('.rfu-close').addEventListener('click', () => closePanel());

        document.addEventListener('click', (e) => {
            if (panelOpen && !panel.contains(e.target)) closePanel();
        });
    }

    function setBody(html) {
        panel.querySelector('.rfu-body').innerHTML = html;
    }

    function setCount(text) {
        panel.querySelector('.rfu-count').textContent = text;
    }

    function openPanel() {
        panelOpen = true;
        panel.classList.add('open');
    }

    function closePanel() {
        panelOpen = false;
        panel.classList.remove('open');
    }

    async function onTogglePanel() {
        if (panelOpen) {
            closePanel();
            return;
        }
        openPanel();

        setCount('');
        setBody('<div class="rfu-loading">Scanning page…</div>');
        const feeds = await findFeeds();

        if (feeds.length === 0) {
            setBody('<div class="rfu-empty">No feed found for this page.</div>');
            setTimeout(closePanel, 2000);
            return;
        }

        setCount(feeds.length + (feeds.length === 1 ? ' feed' : ' feeds'));

        const items = feeds.map((f, i) => `
            <div class="rfu-item">
                <a class="rfu-name" href="${f.url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(f.url)}">${escapeHtml(f.title)}</a>
                <div class="rfu-url">${escapeHtml(truncateMiddle(f.url, 50))}</div>
                <span class="rfu-copy" data-idx="${i}">Copy URL</span>
            </div>
        `).join('');

        setBody(items + (feeds.length > 1 ? '<div class="rfu-copyall">Copy all URLs</div>' : ''));

        panel.querySelectorAll('.rfu-copy').forEach((el) => {
            el.addEventListener('click', () => {
                const idx = Number(el.dataset.idx);
                GM_setClipboard(feeds[idx].url);
                el.textContent = 'Copied';
                el.classList.add('rfu-copied');
                setTimeout(() => {
                    el.textContent = 'Copy URL';
                    el.classList.remove('rfu-copied');
                }, 1200);
            });
        });

        const copyAll = panel.querySelector('.rfu-copyall');
        if (copyAll) {
            copyAll.addEventListener('click', () => {
                GM_setClipboard(feeds.map((f) => f.url).join('\n'));
                copyAll.textContent = 'Copied all!';
                setTimeout(() => (copyAll.textContent = 'Copy all URLs'), 1200);
            });
        }

        setTimeout(closePanel, 5000);
    }

    buildPanelShell();

// ---- craft/launch.js ----
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Find RSS feeds on this page', onTogglePanel);
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.shiftKey && e.code === 'KeyR') {
            onTogglePanel();
        }
    });

// ---- end.js ----
})();

