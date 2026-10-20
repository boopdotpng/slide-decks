# 08-branch-c
- every if, while, for, && and || becomes compare-and-branch
- 1: the branch jumps *over* the then-block, so its condition is the opposite of the c. read compiler output with that in mind
- 2: try two calls: clamp(3, 5) jumps (3 < 5), clamp(9, 5) falls through and sets x = 5
- 3: labels cost nothing, they're names for addresses
