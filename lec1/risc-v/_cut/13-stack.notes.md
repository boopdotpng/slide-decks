# 13-stack
- the centerpiece. go slowly through the first call (0–2), then speed up: 3–5 are the same thing again
- addresses and values are real: this is what the rv emulator shows for os/examples/05_functions.s with fact(3)
- 1: a frame is just "sp − 16, store two things". nothing allocates it, no bookkeeping
- 3: point at s0 = 3 being saved: that's the calling convention slide in action. fact(2) wants s0 for itself, so it saves fact(3)'s value first
- 4: every recursive call returns to the same address (the mul). the frames are what make each return different
- 7: popped frames are dimmed but the values are still in memory. "freeing" stack memory is just moving sp
- 12: stack overflow = sp walked off the end of the stack region (on linux: into a guard page → segfault)
