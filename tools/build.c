#define OUTFILE "dist/jfeed.user.js" //OUTPUT
//#define BUILD_WITH_MUJS
#include "build.h"
//#include "mujscompiler.h"

#define NAME        "Jfeed"
#define NAMESPACE   "https://github.com/HimadriChakra12/jfeed.git"
#define DESCRIPTION "A rss get using userscript"

listmatch(
    "*://*/*",
    );

listgrant(
        "GM_xmlhttpRequest" \
        "GM_setClipboard" \
        "GM_registerMenuCommand" \
        "GM_addStyle" \
    );

/* Custom @tag lines that don't have a fixed build_meta_t field. */
listextra(
    { "Source", "https://github.com/shevabam/get-rss-feed-url-extension.git" },
    );

#define CRAFT group( \
        "src/craft/functions.js", \
        "src/craft/rules.js", \
        "src/craft/fetch.js", \
        "src/craft/panel.js", \
        "src/craft/launch.js", \
    )
 
listorder(
    "src/start.js",
    CRAFT
    "src/end.js",
    );

declaremeta(
    .name = NAME,
    .namespace_ = NAMESPACE,
    .description = DESCRIPTION,
    .match = MATCH, .match_count = MATCH_COUNT,
    .grant = GRANT, .grant_count = GRANT_COUNT,
    .run_at = "document-start",
    .extra = EXTRA, .extra_count = EXTRA_COUNT,
);

int main(void) {
    build_t b;
    build_init(&b, NULL, "__HLS_SAVER_VERSION__"); 
    build_userscript_header(&b, &META);
    build_add_all(&b, ORDER, ORDER_COUNT, "src/");
    build_finish(&b, NULL); 
    return 0;
}
