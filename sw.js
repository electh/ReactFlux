if(!self.define){let s,e={};const n=(n,i)=>(n=new URL(n+".js",i).href,e[n]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=n,s.onload=e,document.head.appendChild(s)}else s=n,importScripts(n),e()})).then((()=>{let s=e[n];if(!s)throw new Error(`Module ${n} didn’t register its module`);return s})));self.define=(i,l)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let o={};const t=s=>n(s,r),u={module:{uri:r},exports:o,require:t};e[r]=Promise.all(i.map((s=>u[s]||t(s)))).then((s=>(l(...s),o)))}}define(["./workbox-e1498109"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/arco-Dzy6TGCA.js",revision:null},{url:"assets/de-DE-BXKlRn8p.js",revision:null},{url:"assets/en-US-Corc11vP.js",revision:null},{url:"assets/es-ES-CFcdBS6F.js",revision:null},{url:"assets/fr-FR-Br4FF3oh.js",revision:null},{url:"assets/highlight-BCY2E4_n.js",revision:null},{url:"assets/hls-BAWV4OVb.js",revision:null},{url:"assets/index-BYx9yz8s.css",revision:null},{url:"assets/index-DFB5NbzN.js",revision:null},{url:"assets/plyr.min-CQtZMqEo.js",revision:null},{url:"assets/react-qkJvQaQb.js",revision:null},{url:"assets/workbox-window.prod.es5-B9K5rw8f.js",revision:null},{url:"assets/zh-CN-nqwm5OHp.js",revision:null},{url:"index.html",revision:"29646c453b2279b70d07e84102ccc099"},{url:"styles/loading.css",revision:"83707a709e3e73526a7e0a9095c59d3b"},{url:"manifest.webmanifest",revision:"6017208229886bea6bc7bb00b9adcccf"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
