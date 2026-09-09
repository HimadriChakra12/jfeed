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
