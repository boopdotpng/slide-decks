import{t as e}from"./hooks.module.U3JihANK.js";import{o as t,r as n}from"./hooks.CTQS5bFp.js";import{E as r,J as i,T as a,V as o,et as s,tt as c}from"./viz.3mionHVt.js";var l=29590451,u=[0,1,2,3].map(e=>l>>>8*e&255),d=[{name:`funct7`,hi:31,lo:25,color:i.amber,value:`0`},{name:`rs2`,hi:24,lo:20,color:i.blue,value:`x28`},{name:`rs1`,hi:19,lo:15,color:i.blue,value:`x7`},{name:`funct3`,hi:14,lo:12,color:i.amber,value:`0`},{name:`rd`,hi:11,lo:7,color:i.green,value:`x7`},{name:`opcode`,hi:6,lo:0,color:i.slate,value:`0x33`}],f=`
u32 inst   = load32(pc);
u32 opcode = inst & 0x7f;
u32 rd     = (inst >> 7)  & 0x1f;
u32 funct3 = (inst >> 12) & 0x7;
u32 rs1    = (inst >> 15) & 0x1f;
u32 rs2    = (inst >> 20) & 0x1f;
u32 funct7 = inst >> 25;

switch (opcode) {
case 0x33:                          // register-register
    if (funct3 == 0 && funct7 == 0)
        x[rd] = x[rs1] + x[rs2];    // add
    ...
case 0x13: /* addi, slli, ... */    ...
case 0x03: /* ld, lw, lb, ... */    ...
case 0x73: /* ecall */              ...
}
pc += 4;`,p={4:[0,1,2,3,4,5,6],5:[8,9,10,11],6:[9,10,11,17]},m=[`fetch: the 4 bytes at the address in pc (0x1116c, our add)`,`read them as one 32-bit number (little-endian: lowest byte first)`,`now it's just bits. the cpu does the encode slide backwards`,`the format puts each field at a fixed position`,`shift and mask to pull each field out. this is what our emulator (or a real decoder) does`,`decode: switch on the opcode, then funct3 / funct7`,`execute: add x7, x7, x28. then pc += 4, and do it all again`];function h(){let i=e(null),h=n(i);return t(`div`,{ref:i,style:{fontSize:`.74em`},children:[t(`div`,{style:{display:`flex`,gap:`1.2em`,alignItems:`center`},children:[t(r,{data:u,addr:69996,label:`mem[pc]`}),t(`div`,{class:`fade ${h>=1?`on`:``}`,style:{paddingBottom:`1.6em`},children:[t(`span`,{class:`muted`,children:`→`}),` `,t(`code`,{children:[`0x`,o(l,8)]})]}),t(`div`,{class:`fade ${h>=6?`on`:``}`,style:{paddingBottom:`1.6em`},children:[t(`span`,{class:`muted`,children:`=`}),` `,t(`code`,{children:c(`add t2, t2, t3`,`asm`)}),t(`span`,{class:`muted`,children:` → t2 = t2 + t3`})]})]}),t(`div`,{class:`fade ${h>=2?`on`:``}`,children:t(a,{word:l,fields:d,split:h>=3,values:h>=4})}),t(`div`,{style:{display:`flex`,gap:`2em`,alignItems:`flex-start`,marginTop:`.6em`},children:[t(`div`,{class:`fade ${h>=4?`on`:``}`,style:{fontSize:`.78em`},children:t(s,{lang:`c`,code:f,hl:p[h]})}),t(`div`,{class:`caption`,style:{flex:1,fontSize:`1em`,paddingTop:`.6em`},children:m[h]})]})]})}export{h as default};