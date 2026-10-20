# 13-convention

- same grid, now from the point of view of one call
- 3–4 is the whole rule: a and t are the callee's to trash, s and sp must come back unchanged
- that's why compiled code moves values it needs after a call into s registers (you'll see `mv s0, a0` a lot), and why a function that uses s0 saves it first

