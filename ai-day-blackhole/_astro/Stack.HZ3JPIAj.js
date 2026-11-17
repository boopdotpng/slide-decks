import{o as e,r as t}from"./preact.module.Bl7PEaKa.js";import{i as n,r,t as i}from"./hooks.module.BNbONuGS.js";function a(e){let[t,i]=r(0);return n(()=>{let t=e.current?.closest(`.slide`);if(!t)return;i(Number(t.dataset.step??0));let n=e=>i(e.detail.step);return t.addEventListener(`slide:step`,n),()=>t.removeEventListener(`slide:step`,n)},[]),t}var o=0;Array.isArray;function s(t,n,r,i,a,s){n||={};var c,l,u=n;if(`ref`in u)for(l in u={},n)l==`ref`?c=n[l]:u[l]=n[l];var d={type:t,props:u,key:r,ref:c,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--o,__i:-1,__u:0,__source:a,__self:s};if(typeof t==`function`&&(c=t.defaultProps))for(l in c)u[l]===void 0&&(u[l]=c[l]);return e.vnode&&e.vnode(d),d}function c({title:e,layers:n,width:r=520,compact:o=!1}){let c=i(null),l=a(c);return s(`div`,{class:`stk ${o?`compact`:``}`,ref:c,style:{width:`${r}px`},children:[e&&s(`div`,{class:`stk-title`,children:e}),n.map((e,n)=>{let r=e.revealAt!==void 0&&l>=e.revealAt,i=e.litAt!==void 0&&l>=e.litAt,a=r&&e.tone===`hidden`?`layer`:e.tone??`layer`;return s(t,{children:[n>0&&s(`div`,{class:`stk-join`}),s(`div`,{class:`stk-l ${a} ${i?`lit`:``}`,children:[s(`div`,{class:`stk-t`,children:r?e.reveal:e.t}),(r?e.revealSub:e.sub)&&s(`div`,{class:`stk-sub`,children:r?e.revealSub:e.sub})]})]})}),s(`style`,{children:`
        .stk { display: flex; flex-direction: column; align-items: stretch; font-size: 28px; }
        .stk-title { font-size: 22px; color: var(--muted); margin-bottom: 10px; text-align: center; }
        .stk-l { border-radius: 12px; padding: 12px 20px; border: 2px solid var(--line); background: var(--panel);
          text-align: center; transition: background .35s, border-color .35s, color .35s, opacity .35s; }
        .stk.compact .stk-l { padding: 8px 16px; }
        .stk-t { font-weight: 650; line-height: 1.2; }
        .stk-sub { font-size: 20px; color: var(--muted); margin-top: 3px; line-height: 1.25; }
        .stk-join { width: 3px; height: 14px; background: var(--line-2); align-self: center; }
        .stk.compact .stk-join { height: 10px; }
        .stk-l.code { background: var(--tint-blue); border-color: var(--accent); }
        .stk-l.hidden { background: var(--sunken); border-style: dashed; color: var(--faint); }
        .stk-l.ours { background: var(--tint-green); border-color: var(--good); }
        .stk-l.hw { background: var(--fill-amber); border-color: var(--hot); }
        .stk-l.dim { opacity: .5; }
        .stk-l.lit { border-color: var(--hot); background: color-mix(in srgb, var(--hot) 22%, var(--panel)); }
        .stk-l.lit .stk-sub { color: var(--fg); }
      `})]})}export{c as default};