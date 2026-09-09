#define OUTFILE "" //OUTPUT
//#define BUILD_WITH_MUJS
#include "build.h"
//#include "mujscompiler.h"

#define NAME        ""
#define NAMESPACE   ""
#define DESCRIPTION ""

listmatch(
    "",
    );

listgrant(
    "unsafeWindow",
    "GM_download"
    );

/* Custom @tag lines that don't have a fixed build_meta_t field. */
listextra(
    { "//NAME", "//Description" },
    );

#define GROUPNAME group( \
    "src/group/script.js", \
    )
 
listorder(
    "src/start.js",
    GROUPNAME
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
