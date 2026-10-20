# 12-call-ret
- a function call is not magic: two jumps and one register
- 1: jal writes the address of the next instruction into ra, then jumps. that's the whole "remember where I came from"
- 3: ret is jalr through ra. square doesn't know or care who called it
- 5: the problem: ra is one register. a function that calls another loses its own way back unless it saves ra first. → the stack
- footnote: call/ret/li/mv are assembler shorthands. objdump shows the real instructions
