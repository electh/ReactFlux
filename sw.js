if(!self.define){let s,e={};const n=(n,i)=>(n=new URL(n+".js",i).href,e[n]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=n,s.onload=e,document.head.appendChild(s)}else s=n,importScripts(n),e()})).then((()=>{let s=e[n];if(!s)throw new Error(`Module ${n} didn’t register its module`);return s})));self.define=(i,r)=>{const l=s||("document"in self?document.currentScript.src:"")||location.href;if(e[l])return;let o={};const t=s=>n(s,l),u={module:{uri:l},exports:o,require:t};e[l]=Promise.all(i.map((s=>u[s]||t(s)))).then((s=>(r(...s),o)))}}define(["./workbox-e1498109"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/arco-vendor-B6HBvqCd.js",revision:null},{url:"assets/en-US-DE5FHrnp.js",revision:null},{url:"assets/es-ES-Ccuzw2QF.js",revision:null},{url:"assets/fr-FR-D7kULsC9.js",revision:null},{url:"assets/highlight-vendor-B5tVel8Z.js",revision:null},{url:"assets/index-CLzF6npt.js",revision:null},{url:"assets/index-Dm27fodZ.css",revision:null},{url:"assets/react-vendor-Ck-GFV-M.js",revision:null},{url:"assets/workbox-window.prod.es5-B9K5rw8f.js",revision:null},{url:"assets/zh-CN-CU-iwYJq.js",revision:null},{url:"index.html",revision:"8be110e78043ea10616a8f6b0242fc48"},{url:"styles/loading.css",revision:"83707a709e3e73526a7e0a9095c59d3b"},{url:"manifest.webmanifest",revision:"6017208229886bea6bc7bb00b9adcccf"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
