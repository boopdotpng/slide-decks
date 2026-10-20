# 10-loop-run-c
- a = {3, 1, 4, 1} at 0x2000, n = 4. addresses are made up, the values are what the code computes
- step through the first lap one instruction at a time, then go faster: laps 2–4 are one step each
- watch a0 walk across the array and stop at a1, one past the end
- this exact loop comes back in the cache section: each ld here is a memory access
