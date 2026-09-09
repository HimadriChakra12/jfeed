#ifndef MUJSCOMPILER_H
#define MUJSCOMPILER_H

#ifndef BUILD_WITH_MUJS
#error "mujscompiler.h: #define BUILD_WITH_MUJS before #include \"build.h\" -- \
then #include \"mujscompiler.h\" after it. Without BUILD_WITH_MUJS defined \
first, build.h already compiled no-op stubs of these functions, and this \
header can't safely replace them."
#endif

#include <mujs.h>

static void mujs_syntax_check(const char *code, const char *label) {
    const char *what = label ? label : "<bundle>";

    js_State *J = js_newstate(NULL, NULL, JS_STRICT);
    if (!J) {
        fprintf(stderr, "mujscompiler: could not create MuJS state\n");
        exit(1);
    }

    if (js_ploadstring(J, what, code)) {
        fprintf(stderr, "mujscompiler: syntax error in %s:\n  %s\n",
                what, js_trystring(J, -1, "error"));
        js_freestate(J);
        exit(1);
    }

    js_pop(J, 1); /* discard the compiled function -- we only wanted to know it compiles */
    js_freestate(J);
}

static void mujs_check_all(const char *const *paths, size_t count, const char *strip_prefix) {
    for (size_t i = 0; i < count; i++) {
        long len;
        char *content = build__read_file(paths[i], &len);

        const char *display = paths[i];
        if (strip_prefix) {
            size_t plen = strlen(strip_prefix);
            if (strncmp(paths[i], strip_prefix, plen) == 0) display = paths[i] + plen;
        }

        mujs_syntax_check(content, display);
        free(content);
    }
    printf("mujscompiler: %zu file(s) OK\n", count);
}

static void mujs_check_bundle(const build_t *b) {
    char *tmp = malloc(b->out_len + 1);
    if (!tmp) { perror("malloc"); exit(1); }
    memcpy(tmp, b->out, b->out_len);
    tmp[b->out_len] = '\0';

    mujs_syntax_check(tmp, "bundle");
    free(tmp);

    printf("mujscompiler: bundle OK (%zu bytes)\n", b->out_len);
}

#endif /* MUJSCOMPILER_H */
