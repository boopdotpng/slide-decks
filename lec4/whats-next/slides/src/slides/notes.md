# 01-title

**runbook:** `cd lec4/whats-next/slides && bun run dev`, open http://localhost:4321, `f` fullscreen, `p` for these notes. or present straight from the site. the live demo (slide 11) needs a browser tab with claude or codex open and `examples/common/copy_tile.ttrv` from blackhole-py on the clipboard.

**say:** this is the last in-person blackhole meeting, at least for now. it isn't a goodbye. it's about what happens next: what's still open, how you can work on it, and who's going to carry it.

**time:** ~25 min of slides, ~5 min of demo, and at least 20 min of discussion at the end. don't let the slides eat the discussion.

# 02-semester

**say:** quick look back. four sessions: the cpu and gpt-2, then the os, attention and training, then gpus and matmul, and the ai day booth. every deck is still on the site, so nothing here is gone.

**steps:** one column per →.

**sources:** facts.json `semester` (deck titles and slide counts from this repo).

# 03-halves

**say:** the plan from the start was two halves. how ml models work inside, and how computers actually compute. *(step)* you've now done both. *(step)* the piece that's left is where they meet: a compiler that turns a model into kernels this chip runs. we never got to it in a lecture, and that's what the rest of this is about.

**sources:** ai-day/blackhole slide 09 (what we're learning).

# 04-hard

**say:** why is this hard? the chip first: no cache, every core has its own 1.5 mb scratchpad, and each core runs five programs that have to agree with each other. forget one wait and you get a fast wrong answer. *(step)* then the official software: 163 repos, 2.4 million lines, llvm built from source at one exact commit, around 40 minutes for a first build. *(step)* that's why blackhole-py exists: we skipped almost all of it.

**sources:** facts.json `card`, `stack` (from the ai day deck: gh repo list tenstorrent, line counts, our build experience); lec3/tenstorrent slide 05 for the fast-wrong-answer line.

# 05-point

**say:** here's the thing about that difficulty. a normal cs assignment has a spec, an autograder and a thousand solutions online, and ai one-shots it. *(step)* a blackhole kernel has five programs that have to agree, almost no examples, and tools that changed last week. ai helps you start, then it's wrong. *(step)* so when ai can do the assignment, the assignment stops showing what you can do. this still does.

**likely questions**
- *isn't that just saying "do hard things"?* partly. the specific claim: work where the ai is often wrong is where your own understanding shows up.

# 06-checkin

**say:** to be honest about the semester. we never got to the compiler. *(step)* the lectures were mostly us talking, and you don't learn this chip by watching. *(step)* rafan is leaving the country, so there won't be in-person meetings after this. *(step)* and almost none of you learn with ai, or at least nobody says so. we'll come back to that.

# 07-roadmap

**say:** this is the roadmap from ai day: a kernel language, a compiler, then tinygrad on the card. *(step)* the kernel language exists now. it's called ttrv, and every kernel in blackhole-py is written in it. the compiler has started: a small tinygrad-style uop core and a design doc. tinygrad on the card is wide open. *(step)* every step needs people, and the last two have almost nobody.

**likely questions**
- *what's ttrv?* a small language that compiles to the five risc-v cores and the tensix engines in each core. ~7.9k lines of python in `ttrv/`.
- *what models run now?* nanbeige4.3 33b, qwen3.8 27b and inkling 2 mini, served through an openai-compatible api (`examples/serve.py`).

**sources:** facts.json `blackhole_py` (blackhole-py master @ 4f01270: ttrv/, compiler/uop.py, compiler/DESIGN.md, README).

# 08-tracks

**say:** four ways in, each with a real first task. kernels: read the small kernels, then a ~30-line change to noc.read that research.md already describes, and measure it. compiler: the exercise from the design doc, dumping what tinygrad hands a backend for five ops. no card needed. serving: run the server and help with the batched backends. study: if you want to catch up first, the decks and their exercises are all online.

**steps:** one track per →.

**likely questions**
- *which one should i pick?* no card: compiler or study. if you liked lecture 3: kernels. if you'd rather ship something people use: serving.

**sources:** blackhole-py research.md §4 (hard-coded in-flight cap of 128 in ttrv/noc.py; the `cap=` fix, ~30 lines), compiler/DESIGN.md §9 (reading guide + the five-op ast exercise), README (batched qwen and inkling backends in progress).

# 09-online

**say:** after today there are no meetings. it works more like people building a project together. a home: the repo and the channel. *(step)* a rhythm: every two weeks, a short demo of what you did, even if it's broken. *(step)* owners: whoever ships a piece owns it. *(step)* and an open question: who keeps the card, and how does everyone else run kernels? bring that to the discussion.

# 10-taboo

**say:** everyone uses ai. nobody admits it. *(step)* calling it larp doesn't stop anyone using it, it just stops people talking about how. *(step)* so nobody learns the difference between using it to skip the work and using it to do the work faster. *(step)* in this project, say how you used it. it's part of the demo.

# 11-demo

**do:** paste copy_tile.ttrv into claude or codex, live.

**say:** here's a kernel none of you were taught. first, ask it to explain line by line and say what the first stall waits for. *(step)* then poke it: what happens if i delete that stall? *(step)* then check: open ttrv/ and the isa docs and see whether it was right. it'll get some of this wrong, and catching that is the skill. *(step)* the rules: check against the source, run it, and explain it back with the chat closed.

**if the demo breaks:** that's fine. talk through what you'd ask and what you'd check.

**sources:** blackhole-py examples/common/copy_tile.ttrv @ 4f01270 (the one-line replay split over three lines to fit).

# 12-gpa

**say:** about gpa. don't tank it: clear the bar that resume filters and grad schools look at. past that, an extra tenth buys you very little. *(step)* public work keeps adding up. tinygrad won't consider an application without contributions, and pays bounties while it figures out whether you fit. tenstorrent pays $500 to $3,000 bounties for bringing models up. and the blackhole mac post got 14k views in a day. nobody asked about anyone's gpa.

**likely questions**
- *so should i drop a class to do this?* no. the point is to stop optimizing grades past the bar, not to ignore them.

**sources:** tinygrad.org (hiring section: no contributions, no consideration; bounties pay while judging fit); docs.tenstorrent.com bounty program lesson ($500–$3000); facts.json `post`.

# 13-ask

**say:** so how do we find out who carries this? the work picks. this week, pick a track and say which in the channel. *(step)* in two weeks, show something, broken is fine. *(step)* after that, if you shipped it, you own it. the qr code is the repo.

# 14-discuss

**say:** that's the slides. what do you want to build, what's in the way, and what should we figure out together?

**leave this up** for the whole discussion. the prompts are fallbacks if the room goes quiet.

# 15-links

**say:** everything's here. thanks for showing up all semester.
