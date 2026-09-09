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
