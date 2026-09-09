    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Find RSS feeds on this page', onTogglePanel);
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.shiftKey && e.code === 'KeyR') {
            onTogglePanel();
        }
    });
