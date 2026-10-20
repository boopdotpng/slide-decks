# 17-ooo
- same loop. the load misses the cache (6 cycles here; a real miss to ram is hundreds)
- 1: anything whose inputs are ready can go. addi and bne don't need a3. the next iteration's ld starts early too
- that ld writes a3 while the add still needs the old a3: how? next slide
- 2: results become visible (commit) in program order, from the reorder buffer. if the ld faulted, nothing after it would have "happened"
- "as if": your program can't tell. this is the contract the isa keeps
