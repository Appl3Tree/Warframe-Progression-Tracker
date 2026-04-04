import{a as de,j as e,r as u,u as T}from"./index-vYGcrvRO.js";import{u as se}from"./shallow-Ds40EqnW.js";import{g as oe,r as K,b as me}from"./requirementEngine-BHQr59pk.js";import{F as E}from"./itemAcquisition-B5bS7kKr.js";import{i as te,f as F,e as ne,a as re,b as ae,g as xe,h as pe}from"./WorkspaceChrome-BoniR1LK.js";import"./warframe-items-all-lean.auto-B9sG_1Yl.js";import"./wikiBlueprintRequirements-CYGzB4ov.js";import"./itemsIndex-DczBCgy5.js";import"./syndicateVendorCatalog-Br72ziv6.js";import"./items-lean.auto-Diu5VkGq.js";import"./mods-lean.auto-BCTF8ww1.js";import"./Melee-C4-BJZbj.js";import"./relics-lean.auto-Y7AwZKwu.js";import"./modLocations-DGBlGBI0.js";const le={},ue=[],_=new Map;function ge(d){const o=String(d);if(_.has(o))return _.get(o);const m=oe(d),c=new Map;if(Array.isArray(m))for(const v of m){const j=String(v.catalogId??"");j&&c.set(j,(c.get(j)??0)+Math.max(1,M(v.count??1,1)))}const f=Array.from(c.entries()).map(([v,j])=>({catalogId:v,count:j}));return _.set(o,f),f}const fe={contentVisibility:"auto",containIntrinsicSize:"auto 110px"};function M(d,o){const m=typeof d=="number"?d:Number(d);return Number.isFinite(m)?Math.max(0,Math.floor(m)):o}function he(d,o){const m=String(d).toLowerCase();return!!(String(o??"").toLowerCase().endsWith(" blueprint")||m.endsWith("blueprint"))}function U(d){return Math.max(0,Math.floor(Number(d)||0)).toLocaleString()}function $(d,o,m){return Math.max(o,Math.min(m,d))}var be=de();function ve(d){const o=u.useRef(null),m=u.useRef(null),[c,f]=u.useState({scale:1,panX:0,panY:0}),v=u.useRef(!1),j=u.useRef({x:0,y:0,panX:0,panY:0}),N=u.useRef({active:!1,startDist:0,startScale:1,startPanX:0,startPanY:0,startCenterX:0,startCenterY:0,pointerA:null,pointerB:null}),A=u.useMemo(()=>`translate(${c.panX}px, ${c.panY}px) scale(${c.scale})`,[c.panX,c.panY,c.scale]),C=u.useCallback(p=>{const l=o.current,i=m.current;if(!l||!i)return;const w=l.getBoundingClientRect(),h=i.scrollWidth,g=i.scrollHeight,a=$(typeof p=="number"?p:1,.25,2.75),n=(w.width-h*a)/2,x=(w.height-g*a)/2;f({scale:a,panX:n,panY:x})},[]);return u.useEffect(()=>{C(1)},[]),u.useEffect(()=>{function p(){f(l=>{const i=o.current,w=m.current;if(!i||!w)return l;const h=i.getBoundingClientRect(),g=w.scrollWidth,a=w.scrollHeight,n=(h.width-g*l.scale)/2,x=(h.height-a*l.scale)/2;return{...l,panX:n,panY:x}})}return window.addEventListener("resize",p),()=>window.removeEventListener("resize",p)},[]),u.useEffect(()=>{const p=o.current;if(!p)return;function l(i){if(!(i.ctrlKey||i.metaKey))return;const w=o.current;w&&(i.preventDefault(),f(h=>{const g=$(h.scale*(i.deltaY<0?1.1:.9),.25,2.75),a=w.getBoundingClientRect(),n=i.clientX-a.left,x=i.clientY-a.top,I=g/h.scale,y=n-(n-h.panX)*I,L=x-(x-h.panY)*I;return{scale:g,panX:y,panY:L}}))}return p.addEventListener("wheel",l,{passive:!1}),()=>p.removeEventListener("wheel",l)},[]),u.useEffect(()=>{const p=o.current;if(!p)return;function l(a,n){try{a.setPointerCapture(n.pointerId)}catch{}}function i(a,n){const x=a.x-n.x,I=a.y-n.y;return Math.sqrt(x*x+I*I)}function w(a){const n=o.current;if(!n)return;const x=a.target;if(!!x?.closest?.("button, a, input, textarea, select, [role='button']")||x?.getAttribute?.("data-wf-no-pan")==="true")return;a.preventDefault(),l(n,a);const y=N.current;if(!y.pointerA)y.pointerA={id:a.pointerId,x:a.clientX,y:a.clientY};else if(!y.pointerB&&y.pointerA.id!==a.pointerId){y.pointerB={id:a.pointerId,x:a.clientX,y:a.clientY};const L=i(y.pointerA,y.pointerB),q=(y.pointerA.x+y.pointerB.x)/2,P=(y.pointerA.y+y.pointerB.y)/2;y.active=!0,y.startDist=L,y.startScale=c.scale,y.startPanX=c.panX,y.startPanY=c.panY,y.startCenterX=q,y.startCenterY=P,v.current=!1;return}v.current=!0,j.current={x:a.clientX,y:a.clientY,panX:c.panX,panY:c.panY}}function h(a){const n=N.current;if(n.pointerA&&n.pointerA.id===a.pointerId?n.pointerA={...n.pointerA,x:a.clientX,y:a.clientY}:n.pointerB&&n.pointerB.id===a.pointerId&&(n.pointerB={...n.pointerB,x:a.clientX,y:a.clientY}),n.active&&n.pointerA&&n.pointerB){a.preventDefault();const L=i(n.pointerA,n.pointerB),q=(n.pointerA.x+n.pointerB.x)/2,P=(n.pointerA.y+n.pointerB.y)/2,Y=$(n.startScale*(L/Math.max(1,n.startDist)),.25,2.75),G=o.current;if(!G)return;const t=G.getBoundingClientRect(),k=q-t.left,S=P-t.top,s=Y/n.startScale,r=k-(k-n.startPanX)*s,b=S-(S-n.startPanY)*s;f({scale:Y,panX:r,panY:b});return}if(!v.current)return;a.preventDefault();const x=j.current,I=a.clientX-x.x,y=a.clientY-x.y;f(L=>({...L,panX:x.panX+I,panY:x.panY+y}))}function g(a){const n=N.current;n.pointerA&&n.pointerA.id===a.pointerId&&(n.pointerA=null),n.pointerB&&n.pointerB.id===a.pointerId&&(n.pointerB=null),(!n.pointerA||!n.pointerB)&&(n.active=!1),v.current=!1}return p.addEventListener("pointerdown",w),p.addEventListener("pointermove",h),p.addEventListener("pointerup",g),p.addEventListener("pointercancel",g),()=>{p.removeEventListener("pointerdown",w),p.removeEventListener("pointermove",h),p.removeEventListener("pointerup",g),p.removeEventListener("pointercancel",g)}},[c.panX,c.panY,c.scale]),e.jsxs("div",{className:"relative h-full w-full overflow-hidden select-none",ref:o,style:{touchAction:"none"},children:[e.jsxs("div",{className:"absolute left-3 top-3 z-10 flex items-center gap-2",children:[e.jsx("button",{className:"rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900",onClick:()=>f(p=>({...p,scale:$(p.scale/1.1,.25,2.75)})),"aria-label":"Zoom out","data-wf-no-pan":"true",children:"−"}),e.jsxs("div",{className:"rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300",children:[Math.round(c.scale*100),"%"]}),e.jsx("button",{className:"rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900",onClick:()=>f(p=>({...p,scale:$(p.scale*1.1,.25,2.75)})),"aria-label":"Zoom in","data-wf-no-pan":"true",children:"+"}),e.jsx("button",{className:"ml-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900",onClick:()=>C(1),"data-wf-no-pan":"true",children:"Reset"}),e.jsx("div",{className:"ml-2 hidden sm:block text-[11px] text-slate-500",children:"Drag to pan · Pinch to zoom · Ctrl+wheel to zoom"})]}),e.jsx("div",{className:"absolute left-0 top-0",style:{transform:A,transformOrigin:"0 0"},children:e.jsx("div",{ref:m,children:d.children})})]})}function we(){return e.jsx("style",{children:`
/* Container */
.wf-tree-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;

    /* Use safe-area + small margin so it feels "full screen" but still not edge-to-edge harsh */
    padding:
        max(8px, env(safe-area-inset-top))
        max(8px, env(safe-area-inset-right))
        max(8px, env(safe-area-inset-bottom))
        max(8px, env(safe-area-inset-left));
}

/* Nearly full-screen, fully responsive to viewport size */
.wf-tree-modal {
    width: 100%;
    height: 100%;

    border: 1px solid rgba(30, 41, 59, 0.8);
    background: rgba(2, 6, 23, 0.92);
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.55);
    overflow: hidden;

    display: flex;
    flex-direction: column;
}

.wf-tree-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(30, 41, 59, 0.8);
}
.wf-tree-modal-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.wf-tree-modal-title .t1 {
    font-size: 14px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.wf-tree-modal-title .t2 {
    font-size: 12px;
    color: rgba(148, 163, 184, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.wf-tree-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.wf-tree-modal-body {
    flex: 1;
    overflow: hidden; /* IMPORTANT: viewport handles overflow */
    padding: 0;
}

/* Tree layout */
.wf-tree-root {
    padding: 18px;
    --wf-gap-x: 26px;   /* sibling spacing */
    --wf-gap-y: 22px;   /* vertical spacing between levels */
    --wf-line: rgba(71, 85, 105, 0.75);
}

/* Each UL lays out children as a row */
.wf-tree-ul {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: var(--wf-gap-x);
    position: relative;
    margin: 0;
    padding: 0;
}

/* For child rows: add space above for the row connector + child stems */
.wf-tree-ul.wf-tree-ul-children {
    margin-top: var(--wf-gap-y);
    padding-top: var(--wf-gap-y);
}

/* Horizontal connector across the child row */
.wf-tree-ul.wf-tree-ul-children::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    border-top: 1px solid var(--wf-line);
}

/* LI is a column: node then its children */
.wf-tree-li {
    list-style: none;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Vertical stem from the child-row horizontal line down to the child node */
.wf-tree-ul.wf-tree-ul-children > .wf-tree-li {
    padding-top: var(--wf-gap-y);
}
.wf-tree-ul.wf-tree-ul-children > .wf-tree-li::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    height: var(--wf-gap-y);
    border-left: 1px solid var(--wf-line);
    transform: translateX(-50%);
}

/* Vertical stem from a parent node down to its child-row horizontal line (only when open) */
.wf-tree-li.wf-tree-li-has-children > .wf-tree-node::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: calc(var(--wf-gap-y) * -1);
    height: var(--wf-gap-y);
    border-left: 1px solid var(--wf-line);
    transform: translateX(-50%);
}

/* Node bubble */
.wf-tree-node {
    position: relative;
    border: 1px solid rgba(30, 41, 59, 0.85);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82));
    border-radius: 16px;
    padding: 12px 14px;
    min-width: 260px;
    max-width: min(360px, 78vw);
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    user-select: none;
    box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
}
.wf-tree-node-title {
    font-size: 13px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    line-height: 1.3;
}
.wf-tree-node-main {
    min-width: 0;
}
.wf-tree-node-subtitle {
    margin-top: 4px;
    font-size: 11px;
    color: rgba(148, 163, 184, 0.95);
}
.wf-tree-node-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}
.wf-tree-node-stat {
    min-width: 72px;
    border-radius: 12px;
    border: 1px solid rgba(51, 65, 85, 0.9);
    background: rgba(15, 23, 42, 0.72);
    padding: 8px 10px;
}
.wf-tree-node-stat-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(148, 163, 184, 0.92);
}
.wf-tree-node-stat-value {
    display: block;
    margin-top: 4px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    color: rgba(241, 245, 249, 1);
}
.wf-tree-node-stat-need {
    border-color: rgba(71, 85, 105, 0.95);
}
.wf-tree-node-stat-have {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(6, 78, 59, 0.18);
}
.wf-tree-node-stat-rem {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(120, 53, 15, 0.18);
}
.wf-tree-node-stat-rem.is-clear {
    border-color: rgba(16, 185, 129, 0.34);
    background: rgba(6, 78, 59, 0.2);
}
.wf-tree-node-stat-rem .wf-tree-node-stat-value {
    color: rgba(253, 224, 71, 1);
}
.wf-tree-node-stat-rem.is-clear .wf-tree-node-stat-value {
    color: rgba(110, 231, 183, 1);
}
.wf-tree-node-btn {
    height: 32px;
    width: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid rgba(51, 65, 85, 0.9);
    background: rgba(2, 6, 23, 0.7);
    color: rgba(226, 232, 240, 1);
    user-select: none;
}
.wf-tree-node-btn:hover {
    background: rgba(15, 23, 42, 0.75);
}

/* On very small screens, shrink nodes a bit */
@media (max-width: 520px) {
    .wf-tree-node {
        min-width: 200px;
        max-width: 86vw;
        grid-template-columns: 32px minmax(0, 1fr);
    }
}
        `})}const ie=u.memo(function(o){const{nodeCatalogId:m,nodeNeed:c,inventoryCounts:f,edgeId:v,expandedEdges:j,onToggleEdge:N,maxDepth:A,depth:C}=o,l=E.recordsById[m]?.displayName??String(m),i=M(f?.[String(m)]??0,0),w=Math.max(0,Math.floor(c)-i),g=u.useMemo(()=>K(m),[m]).edges,a=C<A&&g.length>0,n=!!j[v],x=a&&n,I=w<=0;return e.jsxs("li",{className:["wf-tree-li",x?"wf-tree-li-has-children":""].join(" "),children:[e.jsxs("div",{className:"wf-tree-node",children:[a?e.jsx("button",{className:"wf-tree-node-btn",onClick:()=>N(v),"aria-label":n?"Collapse":"Expand","data-wf-no-pan":"true",children:n?"▾":"▸"}):e.jsx("div",{className:"h-7 w-7"}),e.jsxs("div",{className:"wf-tree-node-main",children:[e.jsx("div",{className:"wf-tree-node-title",children:l}),e.jsx("div",{className:"wf-tree-node-subtitle",children:a?"Expandable crafting branch":"Leaf requirement"}),e.jsxs("div",{className:"wf-tree-node-metrics",children:[e.jsxs("div",{className:"wf-tree-node-stat wf-tree-node-stat-need",children:[e.jsx("span",{className:"wf-tree-node-stat-label",children:"Need"}),e.jsx("span",{className:"wf-tree-node-stat-value",children:U(c)})]}),e.jsxs("div",{className:"wf-tree-node-stat wf-tree-node-stat-have",children:[e.jsx("span",{className:"wf-tree-node-stat-label",children:"Have"}),e.jsx("span",{className:"wf-tree-node-stat-value",children:U(i)})]}),e.jsxs("div",{className:`wf-tree-node-stat wf-tree-node-stat-rem ${I?"is-clear":""}`,children:[e.jsx("span",{className:"wf-tree-node-stat-label",children:"Remaining"}),e.jsx("span",{className:"wf-tree-node-stat-value",children:U(w)})]})]})]})]}),x&&e.jsx(ye,{parentCatalogId:m,parentNeed:c,inventoryCounts:f,depth:C,expandedEdges:j,onToggleEdge:N,maxDepth:A})]})}),ye=u.memo(function(o){const{parentCatalogId:m,parentNeed:c,inventoryCounts:f,depth:v,expandedEdges:j,onToggleEdge:N,maxDepth:A}=o,C=u.useMemo(()=>{const l=K(m).edges,i=new Map;for(const h of l){const g=String(h.catalogId),a=Math.max(1,Math.floor(Number(h.count)||1))*Math.max(1,Math.floor(Number(c)||1)),n=i.get(g)??{need:0};n.need+=a,i.set(g,n)}const w=Array.from(i.entries()).map(([h,g])=>({catalogId:h,need:g.need}));return w.sort((h,g)=>{if(h.need!==g.need)return g.need-h.need;const a=E.recordsById[h.catalogId]?.displayName??String(h.catalogId),n=E.recordsById[g.catalogId]?.displayName??String(g.catalogId);return a.localeCompare(n)}),w},[m,c]),p=u.useMemo(()=>{if(C.length!==1)return C;const l=C[0],w=E.recordsById[l.catalogId]?.displayName??String(l.catalogId);if(!he(l.catalogId,w))return C;const h=K(l.catalogId).edges;if(!h||h.length===0)return C;const g=new Map;for(const n of h){const x=String(n.catalogId),I=Math.max(1,Math.floor(Number(n.count)||1))*Math.max(1,Math.floor(Number(l.need)||1)),y=g.get(x)??{need:0};y.need+=I,g.set(x,y)}const a=Array.from(g.entries()).map(([n,x])=>({catalogId:n,need:x.need}));return a.sort((n,x)=>{if(n.need!==x.need)return x.need-n.need;const I=E.recordsById[n.catalogId]?.displayName??String(n.catalogId),y=E.recordsById[x.catalogId]?.displayName??String(x.catalogId);return I.localeCompare(y)}),a},[C]);return C.length===0?null:e.jsx("ul",{className:"wf-tree-ul wf-tree-ul-children",children:p.map(l=>{const i=`${String(m)}=>${String(l.catalogId)}`;return e.jsx(ie,{nodeCatalogId:l.catalogId,nodeNeed:l.need,inventoryCounts:f,depth:v+1,edgeId:i,expandedEdges:j,onToggleEdge:N,maxDepth:A},i)})})});function Ne(d){const{isOpen:o,title:m,subtitle:c,onClose:f,rootCatalogId:v,rootNeed:j,inventoryCounts:N,expandedEdges:A,onToggleEdge:C}=d;if(u.useEffect(()=>{if(!o)return;function l(i){i.key==="Escape"&&f()}return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)},[o,f]),!o)return null;const p=`root=>${String(v)}`;return e.jsx("div",{className:"wf-tree-overlay",role:"dialog","aria-modal":"true",onMouseDown:f,children:e.jsxs("div",{className:"wf-tree-modal",onMouseDown:l=>l.stopPropagation(),children:[e.jsxs("div",{className:"wf-tree-modal-header",children:[e.jsxs("div",{className:"wf-tree-modal-title",children:[e.jsx("div",{className:"t1",children:m}),e.jsx("div",{className:"t2",children:c})]}),e.jsx("div",{className:"wf-tree-modal-actions",children:e.jsx("button",{className:"rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900",onClick:f,"data-wf-no-pan":"true",children:"Close"})})]}),e.jsx("div",{className:"wf-tree-modal-body",children:e.jsx(ve,{children:e.jsx("div",{className:"wf-tree-root",children:e.jsx("ul",{className:"wf-tree-ul",children:e.jsx(ie,{nodeCatalogId:v,nodeNeed:j,inventoryCounts:N,depth:0,edgeId:p,expandedEdges:A,onToggleEdge:C,maxDepth:12})})})})})]})})}const je=u.memo(function({goalId:o}){const m=T(se(s=>{const r=s.state.goals;if(!Array.isArray(r))return null;let b=null;for(let X=0;X<r.length;X++)if(String(r[X]?.id)===o){b=r[X];break}if(!b)return null;const R=String(b.catalogId),B=s.state.inventory?.counts??le,D=M(B[R]??0,0),O=Math.max(1,M(b.qty??1,1)),W=`${R}Blueprint`,Z=!!E.recordsById[W];let Q=!1,V=0,J=0;if(Z){Q=M(B[W]??0,0)>=1||D>=O;const X=ge(W);for(const ee of X){const ce=ee.count*O;J++,M(B[String(ee.catalogId)]??0,0)>=ce&&V++}}return{catalogId:R,bpCid:Z?W:null,qty:O,note:String(b.note??""),isActive:b.isActive!==!1,have:D,hasBp:Z,blueprintObtained:Q,resourcesReady:V,resourcesTotal:J}})),c=T(s=>s.toggleGoalActive),f=T(s=>s.removeGoal),v=T(s=>s.setGoalQty),j=T(s=>s.setGoalNote),[N,A]=u.useState({}),[C,p]=u.useState(!1),[l,i]=u.useState(!1),w=u.useCallback(()=>{if(!m?.catalogId)return;const s=`root=>${m.catalogId}`;A(r=>r[s]?r:{...r,[s]:!0}),p(!0)},[m?.catalogId]),h=u.useCallback(s=>{A(r=>({...r,[s]:!r[s]}))},[]);if(!m)return null;const{catalogId:g,qty:a,note:n,isActive:x,have:I,hasBp:y,blueprintObtained:L,resourcesReady:q,resourcesTotal:P}=m,Y=E.recordsById[g]?.displayName??g,G=Math.max(0,a-I),t=a>0?Math.min(100,Math.round(I/a*100)):100,k=G===0,S=!k&&t>=90;return e.jsxs("div",{className:["rounded-xl border p-3",k?"border-emerald-800/50 bg-emerald-950/10":S?"border-amber-700/50 bg-amber-950/10":"border-slate-800 bg-slate-950/30"].join(" "),style:fe,children:[e.jsxs("div",{className:"flex flex-wrap items-start gap-x-3 gap-y-1",children:[e.jsxs("div",{className:"flex-1 min-w-0 flex flex-wrap items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-semibold break-words",children:Y}),e.jsx("span",{className:["text-[10px] rounded-full border px-1.5 py-0.5 shrink-0",x?"border-emerald-800 text-emerald-300":"border-slate-700 text-slate-500"].join(" "),children:x?"Active":"Inactive"})]}),e.jsxs("div",{className:"shrink-0 flex items-center gap-1.5 text-xs",children:[e.jsxs("span",{className:"text-slate-400",children:[I.toLocaleString()," / ",a.toLocaleString()]}),!k&&e.jsxs("span",{className:"text-amber-300 font-semibold",children:[G.toLocaleString()," left"]}),k&&e.jsx("span",{className:"text-emerald-400 font-semibold",children:"✓ Done"})]})]}),e.jsx("div",{className:"mt-1.5 h-1 w-full rounded-full bg-slate-800 overflow-hidden",children:e.jsx("div",{className:["h-full rounded-full transition-[width]",k?"bg-emerald-500":S?"bg-amber-500":"bg-blue-500"].join(" "),style:{width:`${t}%`}})}),S&&e.jsxs("div",{className:"mt-1 text-[10px] text-amber-400/80 font-medium",children:[t,"% — almost done"]}),y&&e.jsxs("div",{className:"mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px]",children:[e.jsxs("span",{className:L?"text-emerald-400":"text-slate-500",children:[L?"✓":"○"," Blueprint"]}),P>0&&e.jsxs("span",{className:q===P?"text-emerald-400":q>0?"text-amber-400":"text-slate-500",children:[q===P?"✓":`${q}/${P}`," Resources"]}),e.jsxs("span",{className:k?"text-emerald-400":"text-slate-500",children:[k?"✓":"○"," Built"]})]}),e.jsxs("div",{className:"mt-2 flex flex-wrap gap-1.5",children:[e.jsx("button",{className:"rounded-md border border-slate-700 bg-slate-950/20 px-2 py-1 text-slate-300 text-xs hover:bg-slate-900/40",onClick:()=>c(o),children:x?"Set Inactive":"Set Active"}),e.jsx("button",{className:["rounded-md border px-2 py-1 text-xs",l?"border-slate-600 bg-slate-800 text-slate-200":"border-slate-700 bg-slate-950/20 text-slate-400 hover:bg-slate-900/40"].join(" "),onClick:()=>i(s=>!s),children:l?"Hide Details":"Qty / Note / Tree"}),e.jsx("button",{className:"rounded-md border border-red-900/40 bg-red-950/20 px-2 py-1 text-red-300 text-xs hover:bg-red-950/30",onClick:()=>f(o),children:"Remove"})]}),l&&e.jsxs("div",{className:"mt-3 border-t border-slate-800 pt-3 space-y-2",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2",children:[e.jsxs("label",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-xs text-slate-400",children:"Goal Qty"}),e.jsx("input",{className:"rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100 text-sm",type:"number",min:1,value:a,onChange:s=>v(o,Math.max(1,Math.floor(Number(s.target.value)||1)))})]}),e.jsxs("label",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-xs text-slate-400",children:"Note"}),e.jsx("input",{className:"rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100 text-sm",value:n,onChange:s=>j(o,s.target.value),placeholder:"Optional note"})]})]}),e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("button",{className:"rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900",onClick:w,children:"Open Requirements Tree"}),e.jsx("span",{className:"text-[10px] text-slate-500",children:"Ctrl+wheel / pinch to zoom · drag to pan"})]})]}),C&&be.createPortal(e.jsx(Ne,{isOpen:!0,title:Y,subtitle:`Need ${a.toLocaleString()} · Have ${I.toLocaleString()} · Remaining ${G.toLocaleString()}`,onClose:()=>p(!1),rootCatalogId:g,rootNeed:Math.max(1,a),inventoryCounts:{},expandedEdges:N,onToggleEdge:h}),document.body)]})});function H(d){return e.jsx(xe,{title:d.title,subtitle:d.subtitle,children:d.children})}function z(d){return e.jsx(pe,{label:d.label,active:d.active,onClick:d.onClick})}function Ce(d){const o=T(N=>N.setCount),[m,c]=u.useState(!1),[f,v]=u.useState("");function j(){const N=parseInt(f,10);!isNaN(N)&&N>=0&&o(d.catalogId,N),c(!1)}return m?e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("input",{autoFocus:!0,type:"number",min:0,className:"w-20 rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-slate-400",value:f,onChange:N=>v(N.target.value),onKeyDown:N=>{N.key==="Enter"&&j(),N.key==="Escape"&&c(!1)},onBlur:j}),e.jsxs("span",{className:"text-[11px] text-slate-500",children:["/ ",d.totalNeed.toLocaleString()]})]}):e.jsxs("button",{className:"flex items-center gap-1 group",onClick:()=>{v(String(d.have)),c(!0)},title:"Click to update your count",children:[e.jsxs("span",{className:"text-[11px] text-slate-400 font-mono group-hover:text-slate-200 transition-colors",children:[d.have.toLocaleString()," / ",d.totalNeed.toLocaleString()]}),e.jsxs("svg",{className:"w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("path",{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}),e.jsx("path",{d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"})]})]})}function Se(d){const{catalogId:o,name:m,totalNeed:c,have:f,remaining:v,syndicateLabel:j}=d,[N,A]=u.useState(!1),C=u.useMemo(()=>{const i=oe(o);return!Array.isArray(i)||i.length===0?[]:i.filter(w=>w?.catalogId&&M(w.count??0,0)>0).map(w=>{const h=w.catalogId,g=E.recordsById[h]?.displayName??String(h);return{catalogId:h,name:g,count:M(w.count??0,0)}})},[o]),p=c>0?Math.min(100,Math.round(f/c*100)):0,l=v===0;return e.jsxs("div",{className:["rounded-xl border bg-slate-950/30 p-3",l?"border-slate-800/40 opacity-60":"border-slate-800"].join(" "),children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"text-sm font-semibold break-words",children:m}),l&&e.jsx("span",{className:"text-[10px] text-green-500 font-mono",children:"✓ done"})]}),j&&e.jsx("div",{className:"text-[11px] text-slate-500 mt-0.5",children:j}),e.jsxs("div",{className:"mt-1.5 flex items-center gap-2",children:[e.jsx("div",{className:"flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden",children:e.jsx("div",{className:"h-full rounded-full bg-sky-500 transition-all",style:{width:`${p}%`}})}),e.jsx(Ce,{catalogId:String(o),have:f,totalNeed:c})]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("div",{className:"text-xs font-mono text-slate-100 font-semibold text-right",children:[v.toLocaleString()," left"]}),C.length>0&&e.jsx("button",{onClick:()=>A(i=>!i),className:"text-[10px] rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors",title:N?"Hide crafting ingredients":"Show crafting ingredients",children:N?"▲ hide":"▼ crafting"})]})]}),N&&C.length>0&&e.jsx("div",{className:"mt-2 ml-4 space-y-1 border-l-2 border-slate-800 pl-3",children:C.map(i=>e.jsxs("div",{className:"flex items-center justify-between gap-2 text-xs text-slate-300",children:[e.jsx("span",{className:"truncate",children:i.name}),e.jsxs("span",{className:"font-mono text-slate-400 shrink-0",children:["×",i.count.toLocaleString()]})]},String(i.catalogId)))})]})}function De(){const d=T(t=>t.setActivePage),{goals:o,syndicates:m,completedPrereqs:c,inventory:f}=T(se(t=>({goals:Array.isArray(t.state.goals)?t.state.goals:ue,syndicates:t.state.syndicates??[],completedPrereqs:t.state.prereqs?.completed??le,inventory:t.state.inventory}))),[v,j]=u.useState("personal"),[N,A]=u.useState("nextOnly"),[C,p]=u.useState(""),[l,i]=u.useState("all"),[w,h]=u.useState("all"),[g,a]=u.useState("default"),n=v==="requirements"||v==="total",x=u.useMemo(()=>n?me({syndicates:m,goals:[],inventory:f,syndicateScope:N}):{itemLines:[]},[n,m,c,f,N]),{sortedGoalIds:I,totalGoalCount:y}=u.useMemo(()=>{if(!Array.isArray(o))return{sortedGoalIds:[],totalGoalCount:0};const t=o.filter(r=>r&&r.type==="item").map(r=>{const b=String(r.catalogId),R=E.recordsById[b]?.displayName??b,B=Math.max(1,M(r.qty??1,1)),D=M(f?.counts?.[b]??0,0),O=Math.max(0,B-D);return{id:String(r.id),isActive:r.isActive!==!1,remaining:O,have:D,qty:B,name:R}}),k=t.length,S=C.trim().toLowerCase();let s=t;return S&&(s=s.filter(r=>r.name.toLowerCase().includes(S))),l!=="all"&&(s=s.filter(r=>r.isActive===(l==="active"))),w!=="all"&&(s=s.filter(r=>w==="done"?r.remaining===0:r.remaining>0)),s.sort((r,b)=>{switch(g){case"nameAZ":return r.name.localeCompare(b.name);case"nameZA":return b.name.localeCompare(r.name);case"mostRemaining":return b.remaining-r.remaining||r.name.localeCompare(b.name);case"leastRemaining":return r.remaining-b.remaining||r.name.localeCompare(b.name);case"mostProgress":{const R=r.qty>0?r.have/r.qty:1;return(b.qty>0?b.have/b.qty:1)-R||r.name.localeCompare(b.name)}case"leastProgress":{const R=r.qty>0?r.have/r.qty:1,B=b.qty>0?b.have/b.qty:1;return R-B||r.name.localeCompare(b.name)}default:return r.isActive!==b.isActive?r.isActive?-1:1:r.remaining!==b.remaining?b.remaining-r.remaining:r.name.localeCompare(b.name)}}),{sortedGoalIds:s.map(r=>r.id),totalGoalCount:k}},[o,f,C,l,w,g]),L=u.useMemo(()=>{const t=x.itemLines.slice();return t.sort((k,S)=>k.remaining!==S.remaining?S.remaining-k.remaining:k.name.localeCompare(S.name)),t},[x.itemLines]),q=u.useMemo(()=>{const t={};for(const s of o??[]){if(!s||s.isActive===!1||s.type!=="item")continue;const r=String(s.catalogId),b=Math.max(1,M(s.qty??1,1)),B=E.recordsById[r]?.displayName??r;t[r]||(t[r]={catalogId:r,name:B,personalNeed:0,requirementsNeed:0}),t[r].personalNeed+=b}for(const s of x.itemLines??[]){const r=s.key;t[r]||(t[r]={catalogId:r,name:s.name,personalNeed:0,requirementsNeed:0}),t[r].requirementsNeed+=M(s.totalNeed??0,0)}const S=Object.values(t).map(s=>{const r=M(f?.counts?.[String(s.catalogId)]??0,0),b=s.personalNeed+s.requirementsNeed,R=Math.max(0,b-r);return{catalogId:s.catalogId,name:s.name,personalNeed:s.personalNeed,requirementsNeed:s.requirementsNeed,totalNeed:b,have:r,remaining:R}}).filter(s=>s.totalNeed>0);return S.sort((s,r)=>s.remaining!==r.remaining?r.remaining-s.remaining:s.name.localeCompare(r.name)),S},[o,x.itemLines,f]),P=o.filter(t=>t?.type==="item"&&t.isActive!==!1).length,Y=(o??[]).filter(t=>{if(!t||t.type!=="item")return!1;const k=String(t.catalogId),S=Math.max(1,M(t.qty??1,1));return M(f?.counts?.[k]??0,0)>=S}).length,G=q.reduce((t,k)=>t+k.remaining,0);return e.jsxs("div",{className:"space-y-6",children:[e.jsx(we,{}),e.jsxs("section",{className:"rounded-[24px] border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-1)] px-5 py-4 shadow-[var(--wf-shadow-panel)]",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[e.jsxs("div",{className:"max-w-3xl",children:[e.jsx("div",{className:"text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--wf-accent-primary)]",children:"Progression Workspace"}),e.jsx("h1",{className:"mt-1 text-2xl font-semibold text-[color:var(--wf-text-strong)]",children:"Goals"}),e.jsx("p",{className:"mt-1 text-sm text-[color:var(--wf-text-muted)]",children:"Track personal objectives, syndicate-driven requirements, and the combined pressure on your inventory in one progression portfolio."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("button",{className:"rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--wf-text)] transition-colors hover:bg-[color:var(--wf-surface-strong)]",onClick:()=>d("inventory"),children:"Open Inventory"}),e.jsx("button",{className:"rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--wf-text)] transition-colors hover:bg-[color:var(--wf-surface-strong)]",onClick:()=>d("requirements"),children:"Open Farming"})]})]}),e.jsxs("div",{className:"mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4",children:[e.jsxs("div",{className:"rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3",children:[e.jsx("div",{className:"text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]",children:"Tracked goals"}),e.jsx("div",{className:"mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]",children:y.toLocaleString()}),e.jsx("div",{className:"mt-1 text-xs text-[color:var(--wf-text-muted)]",children:"All personal item goals currently stored."})]}),e.jsxs("div",{className:"rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3",children:[e.jsx("div",{className:"text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]",children:"Active"}),e.jsx("div",{className:"mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]",children:P.toLocaleString()}),e.jsx("div",{className:"mt-1 text-xs text-[color:var(--wf-text-muted)]",children:"Goals currently influencing planning and farming views."})]}),e.jsxs("div",{className:"rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3",children:[e.jsx("div",{className:"text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]",children:"Completed"}),e.jsx("div",{className:"mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]",children:Y.toLocaleString()}),e.jsx("div",{className:"mt-1 text-xs text-[color:var(--wf-text-muted)]",children:"Goals already satisfied by current inventory counts."})]}),e.jsxs("div",{className:"rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3",children:[e.jsx("div",{className:"text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]",children:"Remaining pressure"}),e.jsx("div",{className:"mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]",children:G.toLocaleString()}),e.jsx("div",{className:"mt-1 text-xs text-[color:var(--wf-text-muted)]",children:"Combined remaining units across total personal + requirements demand."})]})]})]}),e.jsx(H,{title:"Goals",subtitle:"Track items you're farming and see what your next syndicate rank-ups require. Add personal goals from the Inventory page.",children:e.jsxs(te,{children:[e.jsxs(F,{children:[e.jsx(z,{label:"Personal Goals",active:v==="personal",onClick:()=>j("personal")}),e.jsx(z,{label:"Requirements Goals",active:v==="requirements",onClick:()=>j("requirements")}),e.jsx(z,{label:"Total Goals",active:v==="total",onClick:()=>j("total")})]}),e.jsxs(F,{children:[e.jsx(ne,{className:"rounded-lg border-slate-700 bg-slate-950/20 text-slate-100 hover:bg-slate-900/40",onClick:()=>d("inventory"),children:"Open Inventory (manage Personal Goals)"}),e.jsx(ne,{className:"rounded-lg border-slate-700 bg-slate-950/20 text-slate-100 hover:bg-slate-900/40",onClick:()=>d("requirements"),children:"Open Farming"})]})]})}),v==="personal"&&e.jsxs(H,{title:"Personal Goals",subtitle:C.trim()||l!=="all"||w!=="all"?`Showing ${I.length.toLocaleString()} of ${y.toLocaleString()} goals`:`${y.toLocaleString()} goals (includes inactive)`,children:[e.jsxs(te,{className:"mb-3",children:[e.jsx("input",{type:"search",placeholder:"Search by name…",value:C,onChange:t=>p(t.target.value),className:"flex-1 min-w-[160px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"}),e.jsxs(F,{children:[e.jsx(re,{children:["all","active","inactive"].map(t=>e.jsx(ae,{onClick:()=>i(t),active:l===t,className:"px-2.5 py-1",children:t==="all"?"All":t.charAt(0).toUpperCase()+t.slice(1)},t))}),e.jsx(re,{children:["all","remaining","done"].map(t=>e.jsx(ae,{onClick:()=>h(t),active:w===t,className:"px-2.5 py-1",children:t==="all"?"All":t==="remaining"?"In Progress":"Done"},t))})]}),e.jsx(F,{children:e.jsxs("select",{value:g,onChange:t=>a(t.target.value),className:"rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200",children:[e.jsx("option",{value:"default",children:"Active first"}),e.jsx("option",{value:"nameAZ",children:"Name A → Z"}),e.jsx("option",{value:"nameZA",children:"Name Z → A"}),e.jsx("option",{value:"mostRemaining",children:"Most remaining"}),e.jsx("option",{value:"leastRemaining",children:"Least remaining"}),e.jsx("option",{value:"mostProgress",children:"Most progress"}),e.jsx("option",{value:"leastProgress",children:"Least progress"})]})})]}),y===0?e.jsx("div",{className:"rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400",children:"No personal goals yet. Add them from Inventory."}):I.length===0?e.jsxs("div",{className:"rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400",children:["No goals match the current filters."," ",e.jsx("button",{className:"underline text-slate-300 hover:text-slate-100",onClick:()=>{p(""),i("all"),h("all")},children:"Clear filters"})]}):e.jsx("div",{className:"space-y-2",children:I.map(t=>e.jsx(je,{goalId:t},t))})]}),v==="requirements"&&e.jsxs(H,{title:"Requirements Goals",subtitle:`${L.length.toLocaleString()} item${L.length!==1?"s":""} needed · ${N==="allRemaining"?"All remaining ranks":"Next rank only"}`,children:[e.jsxs("div",{className:"mb-3 flex flex-wrap items-center gap-2",children:[e.jsx("span",{className:"text-xs text-slate-500 font-medium",children:"Rank scope:"}),e.jsx(z,{label:"Next rank only",active:N==="nextOnly",onClick:()=>A("nextOnly")}),e.jsx(z,{label:"All remaining ranks",active:N==="allRemaining",onClick:()=>A("allRemaining")})]}),L.length===0?e.jsx("div",{className:"rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400",children:"No requirements right now. Make sure syndicates are configured on the Syndicates page."}):e.jsx("div",{className:"space-y-2",children:L.map(t=>{const k=t.sources.filter(S=>S.type==="syndicate").map(S=>`${S.name} ${S.label}`).filter((S,s,r)=>r.indexOf(S)===s).slice(0,3).join(" · ");return e.jsx(Se,{catalogId:t.key,name:t.name,totalNeed:t.totalNeed,have:t.have,remaining:t.remaining,syndicateLabel:k||void 0},String(t.key))})})]}),v==="total"&&e.jsx(H,{title:"Total Goals",subtitle:"Personal + Requirements combined into a single list (summed by item).",children:q.length===0?e.jsx("div",{className:"rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400",children:"No goals to compile yet."}):e.jsx("div",{className:"max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"sticky top-0 bg-slate-950/90",children:e.jsxs("tr",{className:"border-b border-slate-800",children:[e.jsx("th",{className:"text-left px-3 py-2 text-slate-300 font-semibold",children:"Item"}),e.jsx("th",{className:"text-right px-3 py-2 text-slate-300 font-semibold w-[140px]",children:"Personal"}),e.jsx("th",{className:"text-right px-3 py-2 text-slate-300 font-semibold w-[160px]",children:"Requirements"}),e.jsx("th",{className:"text-right px-3 py-2 text-slate-300 font-semibold w-[140px]",children:"Total"}),e.jsx("th",{className:"text-right px-3 py-2 text-slate-300 font-semibold w-[120px]",children:"Have"}),e.jsx("th",{className:"text-right px-3 py-2 text-slate-300 font-semibold w-[140px]",children:"Remaining"})]})}),e.jsx("tbody",{children:q.map(t=>e.jsxs("tr",{className:"border-b border-slate-800/70",children:[e.jsx("td",{className:"px-3 py-2 text-slate-100",children:e.jsx("div",{className:"font-semibold",children:t.name})}),e.jsx("td",{className:"px-3 py-2 text-right text-slate-200",children:t.personalNeed.toLocaleString()}),e.jsx("td",{className:"px-3 py-2 text-right text-slate-200",children:t.requirementsNeed.toLocaleString()}),e.jsx("td",{className:"px-3 py-2 text-right text-slate-100 font-semibold",children:t.totalNeed.toLocaleString()}),e.jsx("td",{className:"px-3 py-2 text-right text-slate-200",children:t.have.toLocaleString()}),e.jsx("td",{className:"px-3 py-2 text-right text-slate-100 font-semibold",children:t.remaining.toLocaleString()})]},String(t.catalogId)))})]})})})]})}export{De as default};
