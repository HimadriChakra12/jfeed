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
