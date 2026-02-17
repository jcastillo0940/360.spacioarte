import{r as c,c as W,j as s,L as R}from"./app-C7fXC9xy.js";let K={data:""},Y=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||K},Z=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Q=/\/\*[^]*?\*\/|  +/g,H=/\n+/g,N=(e,t)=>{let r="",a="",n="";for(let i in e){let o=e[i];i[0]=="@"?i[1]=="i"?r=i+" "+o+";":a+=i[1]=="f"?N(o,i):i+"{"+N(o,i[1]=="k"?"":t)+"}":typeof o=="object"?a+=N(o,t?t.replace(/([^,])+/g,l=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,d=>/&/.test(d)?d.replace(/&/g,l):l?l+" "+d:d)):i):o!=null&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=N.p?N.p(i,o):i+":"+o+";")}return r+(t&&n?t+"{"+n+"}":n)+a},k={},F=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+F(e[r]);return t}return e},X=(e,t,r,a,n)=>{let i=F(e),o=k[i]||(k[i]=(d=>{let f=0,p=11;for(;f<d.length;)p=101*p+d.charCodeAt(f++)>>>0;return"go"+p})(i));if(!k[o]){let d=i!==e?e:(f=>{let p,m,h=[{}];for(;p=Z.exec(f.replace(Q,""));)p[4]?h.shift():p[3]?(m=p[3].replace(H," ").trim(),h.unshift(h[0][m]=h[0][m]||{})):h[0][p[1]]=p[2].replace(H," ").trim();return h[0]})(e);k[o]=N(n?{["@keyframes "+o]:d}:d,r?"":"."+o)}let l=r&&k.g?k.g:null;return r&&(k.g=k[o]),((d,f,p,m)=>{m?f.data=f.data.replace(m,d):f.data.indexOf(d)===-1&&(f.data=p?d+f.data:f.data+d)})(k[o],t,a,l),o},ee=(e,t,r)=>e.reduce((a,n,i)=>{let o=t[i];if(o&&o.call){let l=o(r),d=l&&l.props&&l.props.className||/^go/.test(l)&&l;o=d?"."+d:l&&typeof l=="object"?l.props?"":N(l,""):l===!1?"":l}return a+n+(o??"")},"");function $(e){let t=this||{},r=e.call?e(t.p):e;return X(r.unshift?r.raw?ee(r,[].slice.call(arguments,1),t.p):r.reduce((a,n)=>Object.assign(a,n&&n.call?n(t.p):n),{}):r,Y(t.target),t.g,t.o,t.k)}let V,S,B;$.bind({g:1});let j=$.bind({k:1});function te(e,t,r,a){N.p=t,V=e,S=r,B=a}function C(e,t){let r=this||{};return function(){let a=arguments;function n(i,o){let l=Object.assign({},i),d=l.className||n.className;r.p=Object.assign({theme:S&&S()},l),r.o=/ *go\d+/.test(d),l.className=$.apply(r,a)+(d?" "+d:"");let f=e;return e[0]&&(f=l.as||e,delete l.as),B&&f[0]&&B(l),V(f,l)}return t?t(n):n}}var re=e=>typeof e=="function",O=(e,t)=>re(e)?e(t):e,oe=(()=>{let e=0;return()=>(++e).toString()})(),_=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ae=20,I="default",q=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(o=>o.id===t.toast.id?{...o,...t.toast}:o)};case 2:let{toast:a}=t;return q(e,{type:e.toasts.find(o=>o.id===a.id)?1:0,toast:a});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(o=>o.id===n||n===void 0?{...o,dismissed:!0,visible:!1}:o)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(o=>o.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(o=>({...o,pauseDuration:o.pauseDuration+i}))}}},T=[],J={toasts:[],pausedAt:void 0,settings:{toastLimit:ae}},w={},G=(e,t=I)=>{w[t]=q(w[t]||J,e),T.forEach(([r,a])=>{r===t&&a(w[t])})},U=e=>Object.keys(w).forEach(t=>G(e,t)),se=e=>Object.keys(w).find(t=>w[t].toasts.some(r=>r.id===e)),D=(e=I)=>t=>{G(t,e)},ne={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ie=(e={},t=I)=>{let[r,a]=c.useState(w[t]||J),n=c.useRef(w[t]);c.useEffect(()=>(n.current!==w[t]&&a(w[t]),T.push([t,a]),()=>{let o=T.findIndex(([l])=>l===t);o>-1&&T.splice(o,1)}),[t]);let i=r.toasts.map(o=>{var l,d,f;return{...e,...e[o.type],...o,removeDelay:o.removeDelay||((l=e[o.type])==null?void 0:l.removeDelay)||(e==null?void 0:e.removeDelay),duration:o.duration||((d=e[o.type])==null?void 0:d.duration)||(e==null?void 0:e.duration)||ne[o.type],style:{...e.style,...(f=e[o.type])==null?void 0:f.style,...o.style}}});return{...r,toasts:i}},le=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||oe()}),E=e=>(t,r)=>{let a=le(t,e,r);return D(a.toasterId||se(a.id))({type:2,toast:a}),a.id},g=(e,t)=>E("blank")(e,t);g.error=E("error");g.success=E("success");g.loading=E("loading");g.custom=E("custom");g.dismiss=(e,t)=>{let r={type:3,toastId:e};t?D(t)(r):U(r)};g.dismissAll=e=>g.dismiss(void 0,e);g.remove=(e,t)=>{let r={type:4,toastId:e};t?D(t)(r):U(r)};g.removeAll=e=>g.remove(void 0,e);g.promise=(e,t,r)=>{let a=g.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(n=>{let i=t.success?O(t.success,n):void 0;return i?g.success(i,{id:a,...r,...r==null?void 0:r.success}):g.dismiss(a),n}).catch(n=>{let i=t.error?O(t.error,n):void 0;i?g.error(i,{id:a,...r,...r==null?void 0:r.error}):g.dismiss(a)}),e};var de=1e3,ce=(e,t="default")=>{let{toasts:r,pausedAt:a}=ie(e,t),n=c.useRef(new Map).current,i=c.useCallback((m,h=de)=>{if(n.has(m))return;let x=setTimeout(()=>{n.delete(m),o({type:4,toastId:m})},h);n.set(m,x)},[]);c.useEffect(()=>{if(a)return;let m=Date.now(),h=r.map(x=>{if(x.duration===1/0)return;let M=(x.duration||0)+x.pauseDuration-(m-x.createdAt);if(M<0){x.visible&&g.dismiss(x.id);return}return setTimeout(()=>g.dismiss(x.id,t),M)});return()=>{h.forEach(x=>x&&clearTimeout(x))}},[r,a,t]);let o=c.useCallback(D(t),[t]),l=c.useCallback(()=>{o({type:5,time:Date.now()})},[o]),d=c.useCallback((m,h)=>{o({type:1,toast:{id:m,height:h}})},[o]),f=c.useCallback(()=>{a&&o({type:6,time:Date.now()})},[a,o]),p=c.useCallback((m,h)=>{let{reverseOrder:x=!1,gutter:M=8,defaultPosition:u}=h||{},v=r.filter(y=>(y.position||u)===(m.position||u)&&y.height),b=v.findIndex(y=>y.id===m.id),A=v.filter((y,z)=>z<b&&y.visible).length;return v.filter(y=>y.visible).slice(...x?[A+1]:[0,A]).reduce((y,z)=>y+(z.height||0)+M,0)},[r]);return c.useEffect(()=>{r.forEach(m=>{if(m.dismissed)i(m.id,m.removeDelay);else{let h=n.get(m.id);h&&(clearTimeout(h),n.delete(m.id))}})},[r,i]),{toasts:r,handlers:{updateHeight:d,startPause:l,endPause:f,calculateOffset:p}}},ue=j`
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
}`,fe=C("div")`
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
`,xe=C("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${he} 1s linear infinite;
`,ge=j`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,be=j`
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
}`,ve=C("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ge} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${be} 0.2s ease-out forwards;
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
`,ye=C("div")`
  position: absolute;
`,we=C("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ke=j`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,je=C("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ke} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ne=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return t!==void 0?typeof t=="string"?c.createElement(je,null,t):t:r==="blank"?null:c.createElement(we,null,c.createElement(xe,{...a}),r!=="loading"&&c.createElement(ye,null,r==="error"?c.createElement(fe,{...a}):c.createElement(ve,{...a})))},Ce=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Me=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ae="0%{opacity:0;} 100%{opacity:1;}",Ee="0%{opacity:1;} 100%{opacity:0;}",Le=C("div")`
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
`,Te=C("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Oe=(e,t)=>{let r=e.includes("top")?1:-1,[a,n]=_()?[Ae,Ee]:[Ce(r),Me(r)];return{animation:t?`${j(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${j(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},$e=c.memo(({toast:e,position:t,style:r,children:a})=>{let n=e.height?Oe(e.position||t||"top-center",e.visible):{opacity:0},i=c.createElement(Ne,{toast:e}),o=c.createElement(Te,{...e.ariaProps},O(e.message,e));return c.createElement(Le,{className:e.className,style:{...n,...r,...e.style}},typeof a=="function"?a({icon:i,message:o}):c.createElement(c.Fragment,null,i,o))});te(c.createElement);var De=({id:e,className:t,style:r,onHeightUpdate:a,children:n})=>{let i=c.useCallback(o=>{if(o){let l=()=>{let d=o.getBoundingClientRect().height;a(e,d)};l(),new MutationObserver(l).observe(o,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return c.createElement("div",{ref:i,className:t,style:r},n)},ze=(e,t)=>{let r=e.includes("top"),a=r?{top:0}:{bottom:0},n=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:_()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...a,...n}},Pe=$`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,L=16,Se=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:n,toasterId:i,containerStyle:o,containerClassName:l})=>{let{toasts:d,handlers:f}=ce(r,i);return c.createElement("div",{"data-rht-toaster":i||"",style:{position:"fixed",zIndex:9999,top:L,left:L,right:L,bottom:L,pointerEvents:"none",...o},className:l,onMouseEnter:f.startPause,onMouseLeave:f.endPause},d.map(p=>{let m=p.position||t,h=f.calculateOffset(p,{reverseOrder:e,gutter:a,defaultPosition:t}),x=ze(m,h);return c.createElement(De,{id:p.id,key:p.id,onHeightUpdate:f.updateHeight,className:p.visible?Pe:"",style:x},p.type==="custom"?O(p.message,p):n?n(p):c.createElement($e,{toast:p,position:m}))}))},P=g;function Be(){const{flash:e,errors:t}=W().props;return c.useEffect(()=>{e!=null&&e.success&&P.success(e.success,{duration:4e3,position:"top-right",style:{background:"#10b981",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#10b981"}}),e!=null&&e.error&&P.error(e.error,{duration:5e3,position:"top-right",style:{background:"#ef4444",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#ef4444"}}),t&&Object.keys(t).length>0&&Object.values(t).forEach(a=>{P.error(a,{duration:5e3,position:"top-right",style:{background:"#f59e0b",color:"#fff",fontWeight:"bold",padding:"16px",borderRadius:"8px"},iconTheme:{primary:"#fff",secondary:"#f59e0b"}})})},[e,t]),s.jsx(Se,{position:"top-right",reverseOrder:!1,gutter:8,toastOptions:{duration:4e3,style:{fontSize:"14px"}}})}function Re({children:e}){var p,m,h,x,M;const{auth:t}=W().props,[r,a]=c.useState(!0),[n,i]=c.useState({}),o=u=>{var b,A;if(!u)return!0;const v=Array.isArray((b=t.user)==null?void 0:b.roles)?t.user.roles:Object.values(((A=t.user)==null?void 0:A.roles)||{});return v.includes("Administrador Total")?!0:u.some(y=>v.includes(y))},l=u=>{i(v=>({...v,[u]:!v[u]}))},d=()=>{if(confirm("¿Cerrar sesión?")){const u=document.createElement("form");u.method="POST",u.action=route("logout");const v=document.querySelector('meta[name="csrf-token"]').content,b=document.createElement("input");b.type="hidden",b.name="_token",b.value=v,u.appendChild(b),document.body.appendChild(u),u.submit()}},f=[{name:"Dashboard",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"})}),href:route("dashboard"),roles:null},{name:"Operaciones",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"})}),roles:["Administrador Total","Diseñador","Impresor","Operador de Máquina","Jefe de Bodega"],submenu:[{name:"Monitor KDS",href:route("produccion.kds"),roles:["Administrador Total","Operador de Máquina"]},{name:"Cola de Diseño",href:route("produccion.diseno.index"),roles:["Administrador Total","Diseñador"]},{name:"Nesting / Pliegos",href:route("produccion.pliegos.index"),roles:["Administrador Total","Impresor"]},{name:"Control de Planta",href:route("produccion.planta.index"),roles:["Administrador Total","Operador de Máquina"]},{name:"Bodega / Requisiciones",href:route("produccion.requisiciones.index"),roles:["Administrador Total","Jefe de Bodega"]},{name:"Gestión de Insumos",href:route("items.index"),roles:["Administrador Total","Jefe de Bodega"]}]},{name:"Ciclo Comercial",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"})}),roles:["Administrador Total","Vendedor","Cobrador","Atención al Cliente"],submenu:[{name:"Punto de Venta (POS)",href:route("pos.index")},{name:"Órdenes de Venta",href:route("ordenes.index")},{name:"Facturación",href:route("facturas.index")},{name:"Notas de Crédito",href:route("ventas.nc.index")},{name:"Cobros / Recibos",href:route("cobros.create")},{name:"Órdenes de Compra",href:route("compras.ordenes.index"),roles:["Administrador Total","Jefe de Bodega"]},{name:"Facturas de Compra",href:route("compras.facturas.index"),roles:["Administrador Total"]}]},{name:"Inventario",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"})}),roles:["Administrador Total","Vendedor","Jefe de Bodega"],submenu:[{name:"Catálogo Productos",href:route("items.index")},{name:"Contactos / Clientes",href:route("contactos.index")},{name:"Sucursales / Almacén",href:route("sucursales.index")}]},{name:"Finanzas y RRHH",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"})}),roles:["Administrador Total","Cobrador"],submenu:[{name:"Gestión Bancaria",href:route("bancos.index")},{name:"Catálogo Contable",href:route("accounts.index")},{name:"Libro Diario",href:route("contabilidad.diario")},{name:"Factoring",href:route("finanzas.factoring.index")},{name:"Nómina de Empleados",href:route("rrhh.empleados.index"),roles:["Administrador Total"]},{name:"Pagos de Nómina",href:route("rrhh.nomina.index"),roles:["Administrador Total"]}]},{name:"Reportes",icon:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"})}),roles:["Administrador Total"],submenu:[{name:"Estado Resultados",href:route("reportes.financieros.resultados")},{name:"Estados de Cuenta",href:route("finanzas.estados-cuenta.index")}]},{name:"Configuración",icon:s.jsxs("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:[s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"}),s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"})]}),roles:["Administrador Total"],submenu:[{name:"Ajustes Generales",href:route("settings.index")},{name:"Parámetros Sistema",href:route("params.index")},{name:"Métodos de Pago POS",href:route("config.pos.metodos.index")},{name:"Gestión Vendedores",href:route("vendedores.index")},{name:"Plantillas de Diseño",href:route("config.diseno.index")}]}];return s.jsxs("div",{className:"min-h-screen bg-slate-100 flex font-sans text-slate-900",children:[s.jsx(Be,{}),s.jsxs("aside",{className:`bg-slate-900 text-white transition-all duration-300 ${r?"w-72":"w-20"} flex flex-col shadow-2xl`,children:[s.jsxs("div",{className:"p-6 flex items-center justify-between border-b border-white/10",children:[r?s.jsx("h1",{className:"text-xl font-black uppercase tracking-widest text-blue-400",children:"SpacioArte"}):s.jsx("span",{className:"text-2xl font-black text-blue-400",children:"S"}),s.jsx("button",{onClick:()=>a(!r),className:"p-2 hover:bg-white/10 rounded-xl transition",children:s.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:r?"M15 19l-7-7 7-7":"M9 5l7 7-7 7"})})})]}),s.jsx("nav",{className:"flex-1 overflow-y-auto py-6 space-y-1",children:f.filter(u=>o(u.roles)).map((u,v)=>s.jsx("div",{className:"px-3",children:u.submenu?s.jsxs(s.Fragment,{children:[s.jsxs("button",{onClick:()=>l(u.name),className:`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${n[u.name]?"bg-white/10 text-blue-400":"hover:bg-white/5 text-slate-400"}`,children:[s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsx("span",{className:n[u.name]?"text-blue-400":"text-slate-500",children:u.icon}),r&&s.jsx("span",{className:"font-bold text-sm uppercase tracking-tight",children:u.name})]}),r&&s.jsx("svg",{className:`w-4 h-4 transition-transform ${n[u.name]?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]}),n[u.name]&&r&&s.jsx("div",{className:"mt-1 ml-4 border-l border-white/10 space-y-1",children:u.submenu.filter(b=>o(b.roles)).map((b,A)=>s.jsx(R,{href:b.href,className:`block px-4 py-2 pl-10 text-xs font-bold transition-all rounded-r-lg ${route().current(b.href+"*")?"text-blue-400 bg-blue-400/10":"text-slate-500 hover:text-white hover:bg-white/5"}`,children:b.name},A))})]}):s.jsxs(R,{href:u.href,className:`px-4 py-3 flex items-center gap-3 rounded-xl transition-all ${route().current(u.href+"*")?"bg-blue-600 text-white shadow-lg shadow-blue-900/20":"text-slate-400 hover:bg-white/5 hover:text-white"}`,children:[s.jsx("span",{className:route().current(u.href+"*")?"text-white":"text-slate-500",children:u.icon}),r&&s.jsx("span",{className:"font-bold text-sm uppercase tracking-tight",children:u.name})]})},v))}),s.jsxs("div",{className:"p-4 bg-black/20 mt-auto",children:[s.jsxs("div",{className:"flex items-center gap-3 p-2",children:[s.jsx("div",{className:"w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white",children:((m=(p=t.user)==null?void 0:p.name)==null?void 0:m.charAt(0))||"U"}),r&&s.jsxs("div",{className:"flex-1 overflow-hidden",children:[s.jsx("div",{className:"font-black text-xs truncate uppercase tracking-tighter",children:(h=t.user)==null?void 0:h.name}),s.jsx("div",{className:"text-[10px] text-blue-400 font-bold truncate tracking-widest",children:((M=(x=t.user)==null?void 0:x.roles)==null?void 0:M[0])||"Sin Rol"})]})]}),s.jsxs("button",{onClick:d,className:"mt-3 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all",children:[s.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"})}),r&&"Desconectar"]})]})]}),s.jsx("main",{className:"flex-1 h-screen overflow-y-auto bg-slate-50 relative",children:s.jsx("div",{className:"p-4 sm:p-8 lg:p-10 max-w-[1600px] mx-auto",children:e})})]})}export{Re as A};
