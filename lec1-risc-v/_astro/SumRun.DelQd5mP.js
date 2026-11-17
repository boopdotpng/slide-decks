import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{S as i,et as a}from"./viz.3mionHVt.js";import{BASE as o,MEM0 as s,MemRow as c,hex as l}from"./MemoryWalk.CoaB2Wcn.js";var u=`
0x11158  _start: la   t0, nums
0x11160          li   t1, 8
0x11164          li   t2, 0
0x11168  loop:   ld   t3, 0(t0)
0x1116c          add  t2, t2, t3
0x11170          addi t0, t0, 8
0x11174          addi t1, t1, -1
0x11178          bne  t1, zero, loop
0x1117c          la   t4, total
0x11184          sd   t2, 0(t4)
0x11188          ebreak
0x1118c          mv   a0, t2
0x11190          li   a7, 93
0x11194          ecall`,d=[3,4,5,6,7],f=[],p=3;for(let t=2;t<=8;t++)p+=s[t-1],f.push({hl:d,pc:t<8?`0x11168 (jumped)`:70012,touch:t-1,set:{t0:o+8*t,t1:8-t,t2:p,t3:s[t-1]},text:t===2?n(e,{children:`lap 2: the same five instructions. t2 = 3 + 1 = 4`}):t<8?n(e,{children:[`lap `,t,`: + `,s[t-1],` → `,p]}):n(e,{children:[`lap 8: + 6 → `,n(`b`,{children:`31`}),`. t1 is 0 now, so bne falls through`]})});var m=[{hl:[],pc:69976,text:n(e,{children:[`the os copies the program into memory and sets pc = `,n(`code`,{children:`_start`}),`. every register starts at 0`]})},{hl:[0],pc:69984,set:{t0:o},text:n(e,{children:`t0 = the address of nums. (la is really two instructions, so it's 8 bytes long. why: in a few slides)`})},{hl:[1],pc:69988,set:{t1:8},text:`8 numbers left`},{hl:[2],pc:69992,set:{t2:0},text:`the sum starts at 0`},{hl:[3],pc:69996,touch:0,set:{t3:3},text:`load the number t0 points at: nums[0] = 3`},{hl:[4],pc:7e4,set:{t2:3},text:`sum += 3`},{hl:[5],pc:70004,set:{t0:o+8},text:`t0 moves 8 bytes: now it points at nums[1]`},{hl:[6],pc:70008,set:{t1:7},text:`7 left`},{hl:[7],pc:`0x11168 (jumped)`,text:`t1 ≠ 0: jump back to loop`},...f,{hl:[8],pc:70020,set:{t4:o+64},text:n(e,{children:`t0 walked off the end of nums: it points at total now, same as t4`})},{hl:[9],pc:70024,touch:8,write:!0,text:`store the sum into total`},{hl:[10],pc:70028,text:n(e,{children:`ebreak: the emulator prints the registers. t2 = 31, t3 = 6, t0 = t4 = 0x121d8. same as here`})},{hl:[11,12,13],pc:`—`,set:{a0:31},text:n(e,{children:[`a0 = 31, a7 = 93 (exit), ecall: the os ends the program. `,n(`code`,{children:`echo $?`}),` prints 31. 8 laps × 5 instructions`]})}],h=[`t0`,`t1`,`t2`,`t3`,`t4`,`a0`],g={t0:`where we are`,t1:`how many left`,t2:`sum`,t3:`the number`,a0:`exit code`},_=e=>Object.assign({},...m.slice(0,e+1).map(e=>e.set??{})),v=m.length-1;function y(){let e=t(null),d=Math.min(m.length-1,r(e)),f=m[d],p=_(d),v=[...s];d>=m.length-3&&(v[8]=31);let y={};for(let e of[`t0`,`t4`])p[e]!==void 0&&(y[(p[e]-o)/8]??=[]).push(e);let b=(e,t)=>t===void 0?`0`:e===`t0`||e===`t4`?l(t):String(t);return n(`div`,{class:`sum-run`,ref:e,children:[n(c,{mem:v,ptrs:y,touch:f.touch,write:f.write}),n(`div`,{class:`sr-cols`,children:[n(a,{lang:`asm`,code:u,hl:f.hl}),n(i,{vars:[{name:`pc`},...h.map(e=>({name:e,reg:!0,note:g[e]}))],state:{pc:typeof f.pc==`number`?l(f.pc):f.pc,...Object.fromEntries(h.map(e=>[e,b(e,p[e])]))},changed:[`pc`,...Object.keys(f.set??{})]})]}),n(`div`,{class:`caption sr-text`,children:f.text}),n(`style`,{children:`
        .sum-run .mem-row { font-size: .55em; margin-bottom: .6em; }
        .sum-run .sr-cols { display: flex; gap: 2em; align-items: flex-start; font-size: .55em; }
        .sum-run .sr-cols pre { margin: 0; flex: none; width: 62%; font-size: 1em; }
        .sum-run .sr-text { font-size: .75em; min-height: 2.6em; margin-top: .6em; }
      `})]})}export{v as STEP_COUNT,y as default};