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
