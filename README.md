# slide decks

lecture decks, each an astro project made from the template at [boopdotpng/slides](https://github.com/boopdotpng/slides).

| dir | what |
|---|---|
| `lec1/risc-v` | assembly and the cpu |
| `lec1/gpt-2-arch` | gpt-2 architecture, with real weights |
| `lec2/os` | how an os executes programs, plus `rv`, the risc-v emulator lec 1 runs assembly on |

`lec1/PLAN.md` is the run sheet for lec 1. in any deck: `cd slides && bun install && bun run dev`.

template fixes: `cd ~/code/web/slides && bun run sync ~/code/edu/lec1/*/slides ~/code/edu/lec2/os/slides`.
