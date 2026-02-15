import{r as u,c as T,j as o,L as A}from"./app-FXXXkb3F.js";let G={data:""},K=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||G},Q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,J=/\/\*[^]*?\*\/|  +/g,I=/\n+/g,w=(e,t)=>{let a="",s="",i="";for(let n in e){let r=e[n];n[0]=="@"?n[1]=="i"?a=n+" "+r+";":s+=n[1]=="f"?w(r,n):n+"{"+w(r,n[1]=="k"?"":t)+"}":typeof r=="object"?s+=w(r,t?t.replace(/([^,])+/g,l=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,d=>/&/.test(d)?d.replace(/&/g,l):l?l+" "+d:d)):n):r!=null&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=w.p?w.p(n,r):n+":"+r+";")}return a+(t&&i?t+"{"+i+"}":i)+s},k={},R=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+R(e[a]);return t}return e},X=(e,t,a,s,i)=>{let n=R(e),r=k[n]||(k[n]=(d=>{let p=0,f=11;for(;p<d.length;)f=101*f+d.charCodeAt(p++)>>>0;return"go"+f})(n));if(!k[r]){let d=n!==e?e:(p=>{let f,m,h=[{}];for(;f=Q.exec(p.replace(J,""));)f[4]?h.shift():f[3]?(m=f[3].replace(I," ").trim(),h.unshift(h[0][m]=h[0][m]||{})):h[0][f[1]]=f[2].replace(I," ").trim();return h[0]})(e);k[r]=w(i?{["@keyframes "+r]:d}:d,a?"":"."+r)}let l=a&&k.g?k.g:null;return a&&(k.g=k[r]),((d,p,f,m)=>{m?p.data=p.data.replace(m,d):p.data.indexOf(d)===-1&&(p.data=f?d+p.data:p.data+d)})(k[r],t,s,l),r},ee=(e,t,a)=>e.reduce((s,i,n)=>{let r=t[n];if(r&&r.call){let l=r(a),d=l&&l.props&&l.props.className||/^go/.test(l)&&l;r=d?"."+d:l&&typeof l=="object"?l.props?"":w(l,""):l===!1?"":l}return s+i+(r??"")},"");function $(e){let t=this||{},a=e.call?e(t.p):e;return X(a.unshift?a.raw?ee(a,[].slice.call(arguments,1),t.p):a.reduce((s,i)=>Object.assign(s,i&&i.call?i(t.p):i),{}):a,K(t.target),t.g,t.o,t.k)}let F,W,B;$.bind({g:1});let j=$.bind({k:1});function te(e,t,a,s){w.p=t,F=e,W=a,B=s}function M(e,t){let a=this||{};return function(){let s=arguments;function i(n,r){let l=Object.assign({},n),d=l.className||i.className;a.p=Object.assign({theme:W&&W()},l),a.o=/ *go\d+/.test(d),l.className=$.apply(a,s)+(d?" "+d:"");let p=e;return e[0]&&(p=l.as||e,delete l.as),B&&p[0]&&B(l),F(p,l)}return t?t(i):i}}var ae=e=>typeof e=="function",z=(e,t)=>ae(e)?e(t):e,re=(()=>{let e=0;return()=>(++e).toString()})(),V=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),se=20,P="default",_=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:s}=t;return _(e,{type:e.toasts.find(r=>r.id===s.id)?1:0,toast:s});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(r=>r.id===i||i===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let n=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+n}))}}},E=[],U={toasts:[],pausedAt:void 0,settings:{toastLimit:se}},y={},q=(e,t=P)=>{y[t]=_(y[t]||U,e),E.forEach(([a,s])=>{a===t&&s(y[t])})},Y=e=>Object.keys(y).forEach(t=>q(e,t)),oe=e=>Object.keys(y).find(t=>y[t].toasts.some(a=>a.id===e)),O=(e=P)=>t=>{q(t,e)},ne={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ie=(e={},t=P)=>{let[a,s]=u.useState(y[t]||U),i=u.useRef(y[t]);u.useEffect(()=>(i.current!==y[t]&&s(y[t]),E.push([t,s]),()=>{let r=E.findIndex(([l])=>l===t);r>-1&&E.splice(r,1)}),[t]);let n=a.toasts.map(r=>{var l,d,p;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||((l=e[r.type])==null?void 0:l.removeDelay)||(e==null?void 0:e.removeDelay),duration:r.duration||((d=e[r.type])==null?void 0:d.duration)||(e==null?void 0:e.duration)||ne[r.type],style:{...e.style,...(p=e[r.type])==null?void 0:p.style,...r.style}}});return{...a,toasts:n}},le=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||re()}),C=e=>(t,a)=>{let s=le(t,e,a);return O(s.toasterId||oe(s.id))({type:2,toast:s}),s.id},g=(e,t)=>C("blank")(e,t);g.error=C("error");g.success=C("success");g.loading=C("loading");g.custom=C("custom");g.dismiss=(e,t)=>{let a={type:3,toastId:e};t?O(t)(a):Y(a)};g.dismissAll=e=>g.dismiss(void 0,e);g.remove=(e,t)=>{let a={type:4,toastId:e};t?O(t)(a):Y(a)};g.removeAll=e=>g.remove(void 0,e);g.promise=(e,t,a)=>{let s=g.loading(t.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let n=t.success?z(t.success,i):void 0;return n?g.success(n,{id:s,...a,...a==null?void 0:a.success}):g.dismiss(s),i}).catch(i=>{let n=t.error?z(t.error,i):void 0;n?g.error(n,{id:s,...a,...a==null?void 0:a.error}):g.dismiss(s)}),e};var ce=1e3,de=(e,t="default")=>{let{toasts:a,pausedAt:s}=ie(e,t),i=u.useRef(new Map).current,n=u.useCallback((m,h=ce)=>{if(i.has(m))return;let c=setTimeout(()=>{i.delete(m),r({type:4,toastId:m})},h);i.set(m,c)},[]);u.useEffect(()=>{if(s)return;let m=Date.now(),h=a.map(c=>{if(c.duration===1/0)return;let x=(c.duration||0)+c.pauseDuration-(m-c.createdAt);if(x<0){c.visible&&g.dismiss(c.id);return}return setTimeout(()=>g.dismiss(c.id,t),x)});return()=>{h.forEach(c=>c&&clearTimeout(c))}},[a,s,t]);let r=u.useCallback(O(t),[t]),l=u.useCallback(()=>{r({type:5,time:Date.now()})},[r]),d=u.useCallback((m,h)=>{r({type:1,toast:{id:m,height:h}})},[r]),p=u.useCallback(()=>{s&&r({type:6,time:Date.now()})},[s,r]),f=u.useCallback((m,h)=>{let{reverseOrder:c=!1,gutter:x=8,defaultPosition:v}=h||{},N=a.filter(b=>(b.position||v)===(m.position||v)&&b.height),Z=N.findIndex(b=>b.id===m.id),S=N.filter((b,D)=>D<Z&&b.visible).length;return N.filter(b=>b.visible).slice(...c?[S+1]:[0,S]).reduce((b,D)=>b+(D.height||0)+x,0)},[a]);return u.useEffect(()=>{a.forEach(m=>{if(m.dismissed)n(m.id,m.removeDelay);else{let h=i.get(m.id);h&&(clearTimeout(h),i.delete(m.id))}})},[a,n]),{toasts:a,handlers:{updateHeight:d,startPause:l,endPause:p,calculateOffset:f}}},ue=j`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,me=j`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,pe=j`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,fe=M("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ue} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${me} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${pe} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,he=j`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ge=M("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${he} 1s linear infinite;
`,xe=j`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ve=j`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,be=M("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${xe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ve} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ye=M("div")`
  position: absolute;
`,ke=M("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,je=j`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,we=M("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${je} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Me=({toast:e})=>{let{icon:t,type:a,iconTheme:s}=e;return t!==void 0?typeof t=="string"?u.createElement(we,null,t):t:a==="blank"?null:u.createElement(ke,null,u.createElement(ge,{...s}),a!=="loading"&&u.createElement(ye,null,a==="error"?u.createElement(fe,{...s}):u.createElement(be,{...s})))},Ne=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ce=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Le="0%{opacity:0;} 100%{opacity:1;}",Ee="0%{opacity:1;} 100%{opacity:0;}",ze=M("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,$e=M("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Oe=(e,t)=>{let a=e.includes("top")?1:-1,[s,i]=V()?[Le,Ee]:[Ne(a),Ce(a)];return{animation:t?`${j(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${j(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},De=u.memo(({toast:e,position:t,style:a,children:s})=>{let i=e.height?Oe(e.position||t||"top-center",e.visible):{opacity:0},n=u.createElement(Me,{toast:e}),r=u.createElement($e,{...e.ariaProps},z(e.message,e));return u.createElement(ze,{className:e.className,style:{...i,...a,...e.style}},typeof s=="function"?s({icon:n,message:r}):u.createElement(u.Fragment,null,n,r))});te(u.createElement);var He=({id:e,className:t,style:a,onHeightUpdate:s,children:i})=>{let n=u.useCallback(r=>{if(r){let l=()=>{let d=r.getBoundingClientRect().height;s(e,d)};l(),new MutationObserver(l).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return u.createElement("div",{ref:n,className:t,style:a},i)},We=(e,t)=>{let a=e.includes("top"),s=a?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:V()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...s,...i}},Be=$`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,L=16,Pe=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:s,children:i,toasterId:n,containerStyle:r,containerClassName:l})=>{let{toasts:d,handlers:p}=de(a,n);return u.createElement("div",{"data-rht-toaster":n||"",style:{position:"fixed",zIndex:9999,top:L,left:L,right:L,bottom:L,pointerEvents:"none",...r},className:l,onMouseEnter:p.startPause,onMouseLeave:p.endPause},d.map(f=>{let m=f.position||t,h=p.calculateOffset(f,{reverseOrder:e,gutter:s,defaultPosition:t}),c=We(m,h);return u.createElement(He,{id:f.id,key:f.id,onHeightUpdate:p.updateHeight,className:f.visible?Be:"",style:c},f.type==="custom"?z(f.message,f):i?i(f):u.createElement(De,{toast:f,position:m}))}))},H=g;function Se(){const{flash:e,errors:t}=T().props;return u.useEffect(()=>{e!=null&&e.success&&H.success(e.success,{duration:4e3,position:"top-right",style:{background:"#10b981",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#10b981"}}),e!=null&&e.error&&H.error(e.error,{duration:5e3,position:"top-right",style:{background:"#ef4444",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#ef4444"}}),t&&Object.keys(t).length>0&&Object.values(t).forEach(s=>{H.error(s,{duration:5e3,position:"top-right",style:{background:"#f59e0b",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#f59e0b"}})})},[e,t]),o.jsx(Pe,{position:"top-right",reverseOrder:!1,gutter:8,toastOptions:{duration:4e3,style:{fontSize:"14px"}}})}function Ie({children:e}){var p,f,m,h;const{auth:t}=T().props,[a,s]=u.useState(!0),[i,n]=u.useState({}),r=c=>{n(x=>({...x,[c]:!x[c]}))},l=()=>{if(confirm("¿Cerrar sesión?")){const c=document.createElement("form");c.method="POST",c.action="/logout";const x=document.querySelector('meta[name="csrf-token"]').content,v=document.createElement("input");v.type="hidden",v.name="_token",v.value=x,c.appendChild(v),document.body.appendChild(c),c.submit()}},d=[{name:"Dashboard",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"})}),href:"/dashboard"},{name:"Configuración",icon:o.jsxs("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:[o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"}),o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"})]}),submenu:[{name:"General",href:"/configuracion"},{name:"Parámetros",href:"/configuracion/parametros"},{name:"Vendedores",href:"/configuracion/vendedores"}]},{name:"Inventario",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"})}),submenu:[{name:"Productos",href:"/inventario/items"}]},{name:"Contactos",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"})}),submenu:[{name:"Contactos",href:"/inventario/contactos"},{name:"Sucursales",href:"/inventario/sucursales"},{name:"Estados de Cuenta",href:"/finanzas/estados-cuenta"}]},{name:"Factoring",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),submenu:[{name:"Operaciones",href:"/finanzas/factoring"},{name:"Factoring Compras",href:"/finanzas/factoring/compra/crear"},{name:"Factoring Ventas",href:"/finanzas/factoring/venta/crear"}]},{name:"Contabilidad",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"})}),submenu:[{name:"Catálogo de Cuentas",href:"/contabilidad/catalogo"},{name:"Bancos",href:"/contabilidad/bancos"},{name:"Libro Diario",href:"/contabilidad/libro-diario"}]},{name:"Ventas",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"})}),submenu:[{name:"Órdenes de Venta",href:"/ventas/ordenes"},{name:"Facturas",href:"/ventas/facturas"},{name:"Notas de Crédito",href:"/ventas/notas-credito"},{name:"Cobros",href:"/ventas/cobros/crear"}]},{name:"Compras",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"})}),submenu:[{name:"Órdenes de Compra",href:"/compras/ordenes"},{name:"Facturas de Compra",href:"/compras/facturas"},{name:"Pagos",href:"/compras/pagos/crear"}]},{name:"Recursos Humanos",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"})}),submenu:[{name:"Empleados",href:"/rrhh/empleados"},{name:"Nómina",href:"/rrhh/nomina"}]},{name:"Reportes",icon:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"})}),submenu:[{name:"Estado de Resultados",href:"/reportes/estado-resultados"}]}];return o.jsxs("div",{className:"min-h-screen bg-slate-100 flex",children:[o.jsx(Se,{}),o.jsxs("aside",{className:`bg-slate-900 text-white transition-all duration-300 ${a?"w-64":"w-20"} flex flex-col`,children:[o.jsxs("div",{className:"p-4 flex items-center justify-between border-b border-slate-800",children:[a?o.jsx("h1",{className:"text-xl font-black uppercase tracking-wider",children:"ERP System"}):o.jsx("span",{className:"text-xl font-black",children:"E"}),o.jsx("button",{onClick:()=>s(!a),className:"p-2 hover:bg-slate-800 rounded-lg transition",children:o.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:a?"M15 19l-7-7 7-7":"M9 5l7 7-7 7"})})})]}),o.jsx("nav",{className:"flex-1 overflow-y-auto py-4",children:d.map((c,x)=>o.jsx("div",{children:c.submenu?o.jsxs(o.Fragment,{children:[o.jsxs("button",{onClick:()=>r(c.name),className:"w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition",children:[o.jsxs("div",{className:"flex items-center gap-3",children:[c.icon,a&&o.jsx("span",{className:"font-medium",children:c.name})]}),a&&o.jsx("svg",{className:`w-4 h-4 transition-transform ${i[c.name]?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]}),i[c.name]&&a&&o.jsx("div",{className:"bg-slate-800 border-l-4 border-blue-500",children:c.submenu.map((v,N)=>o.jsx(A,{href:v.href,className:"block px-4 py-2 pl-14 text-sm hover:bg-slate-700 transition",children:v.name},N))})]}):o.jsxs(A,{href:c.href,className:"px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition",children:[c.icon,a&&o.jsx("span",{className:"font-medium",children:c.name})]})},x))}),o.jsxs("div",{className:"border-t border-slate-800 p-4",children:[o.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[o.jsx("div",{className:"w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold",children:((f=(p=t.user)==null?void 0:p.name)==null?void 0:f.charAt(0))||"U"}),a&&o.jsxs("div",{className:"flex-1",children:[o.jsx("div",{className:"font-bold text-sm",children:(m=t.user)==null?void 0:m.name}),o.jsx("div",{className:"text-xs text-slate-400",children:(h=t.user)==null?void 0:h.email})]})]}),o.jsxs("button",{onClick:l,className:"w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition",children:[o.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"})}),a&&"Cerrar Sesión"]})]})]}),o.jsx("main",{className:"flex-1 overflow-auto",children:o.jsx("div",{className:"p-6",children:e})})]})}export{Ie as A};
