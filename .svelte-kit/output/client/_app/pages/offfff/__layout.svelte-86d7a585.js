import{S as s,i as t,s as e,e as l,t as a,k as r,c as n,a as f,g as c,d as o,n as h,b as i,f as u,D as $,E as d,F as p,G as g,j as m,m as v,o as b,H as E,v as y,r as j,w as k}from"../../chunks/vendor-289f0ca5.js";function x(s,t,e){const l=s.slice();return l[1]=t[e],l}function w(s){let t,e,p,g,m=s[1].label+"";return{c(){t=l("li"),e=l("a"),p=a(m),g=r(),this.h()},l(s){t=n(s,"LI",{class:!0});var l=f(t);e=n(l,"A",{class:!0,href:!0});var a=f(e);p=c(a,m),a.forEach(o),g=h(l),l.forEach(o),this.h()},h(){i(e,"class","side-links svelte-1yi6otb"),i(e,"href",s[1].href),i(t,"class","svelte-1yi6otb")},m(s,l){u(s,t,l),$(t,e),$(e,p),$(t,g)},p:d,d(s){s&&o(t)}}}function A(s){let t,e,a=s[0],r=[];for(let l=0;l<a.length;l+=1)r[l]=w(x(s,a,l));return{c(){t=l("nav"),e=l("ul");for(let s=0;s<r.length;s+=1)r[s].c();this.h()},l(s){t=n(s,"NAV",{class:!0});var l=f(t);e=n(l,"UL",{});var a=f(e);for(let t=0;t<r.length;t+=1)r[t].l(a);a.forEach(o),l.forEach(o),this.h()},h(){i(t,"class","sidebar svelte-1yi6otb")},m(s,l){u(s,t,l),$(t,e);for(let t=0;t<r.length;t+=1)r[t].m(e,null)},p(s,[t]){if(1&t){let l;for(a=s[0],l=0;l<a.length;l+=1){const n=x(s,a,l);r[l]?r[l].p(n,t):(r[l]=w(n),r[l].c(),r[l].m(e,null))}for(;l<r.length;l+=1)r[l].d(1);r.length=a.length}},i:d,o:d,d(s){s&&o(t),p(r,s)}}}function D(s){return[[{label:"Préface",href:"/offfff"},{label:"Episode 1",href:"/offfff/s1ep1"}]]}class I extends s{constructor(s){super(),t(this,s,D,A,e,{})}}function L(s){let t,e,a,c;t=new I({});const $=s[1].default,d=g($,s,s[0],null);return{c(){m(t.$$.fragment),e=r(),a=l("div"),d&&d.c(),this.h()},l(s){v(t.$$.fragment,s),e=h(s),a=n(s,"DIV",{class:!0});var l=f(a);d&&d.l(l),l.forEach(o),this.h()},h(){i(a,"class","story svelte-i1jts7")},m(s,l){b(t,s,l),u(s,e,l),u(s,a,l),d&&d.m(a,null),c=!0},p(s,[t]){d&&d.p&&1&t&&E(d,$,s,s[0],t,null,null)},i(s){c||(y(t.$$.fragment,s),y(d,s),c=!0)},o(s){j(t.$$.fragment,s),j(d,s),c=!1},d(s){k(t,s),s&&o(e),s&&o(a),d&&d.d(s)}}}function V(s,t,e){let{$$slots:l={},$$scope:a}=t;return s.$$set=s=>{"$$scope"in s&&e(0,a=s.$$scope)},[a,l]}export default class extends s{constructor(s){super(),t(this,s,V,L,e,{})}}
