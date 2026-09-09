.PHONY: build clean watch

build: tools/build
	./tools/build

tools/build: tools/build.c tools/build.h
	$(CC) -O2 -Wall -Wextra -Wno-unused-function -o tools/build tools/build.c

clean:
	rm -rf dist tools/build

watch: tools/build
	@while true; do \
		./tools/build; \
		inotifywait -qre modify src tools/VERSION > /dev/null; \
	done
