const ROOT='/labs/flowerring/';
const COOKIE='__Secure-flowerring_session';
const encoder=new TextEncoder();
const lifetime=7*24*60*60;
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin'};
const failures=new Map();
const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
async function key(env){
  return crypto.subtle.importKey('raw',encoder.encode(env.FLOWERRING_SESSION_SECRET+'\0'+env.FLOWERRING_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function token(env,host){
  const value=`v1.${Math.floor(Date.now()/1000)+lifetime}.${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
  return value+'.'+hex(await crypto.subtle.sign('HMAC',await key(env),encoder.encode(value+'|'+host)));
}
async function authorized(request,env,host){
  const match=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)__Secure-flowerring_session=(v1\.\d{10}\.[a-f0-9]{32}\.[a-f0-9]{64})(?:;|$)/);
  if(!match)return false;
  const parts=match[1].split('.'),expires=Number(parts[1]),now=Math.floor(Date.now()/1000);
  if(expires<=now||expires>now+lifetime)return false;
  const signature=Uint8Array.from(parts[3].match(/../g),x=>parseInt(x,16));
  return crypto.subtle.verify('HMAC',await key(env),signature,encoder.encode(parts.slice(0,3).join('.')+'|'+host));
}
function login(message='',status=200){
  const content=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>A flower, for you</title><style>html{color-scheme:light;background:#f7f4ee;color:#39332e;font:16px Arial,sans-serif}body{margin:0;min-height:100dvh;display:grid;place-items:center}.gate{width:min(320px,calc(100vw - 64px));padding:35px 0}h1{font:400 40px Georgia,serif;letter-spacing:-1px;margin:0 0 18px}p{font:italic 18px Georgia,serif;color:#8b8177;margin:0 0 38px}label{display:block;font-size:14px;margin-bottom:12px}input{box-sizing:border-box;width:100%;border:0;border-bottom:1px solid #ded6cb;background:transparent;padding:12px 0;font:16px Arial;color:inherit}button{width:100%;border:0;background:#4d3e32;color:#f7f1e6;padding:16px;font:14px Arial;letter-spacing:1px;margin-top:24px;cursor:pointer}input:focus-visible,button:focus-visible{outline:2px solid #8d654a;outline-offset:4px}.error{font:14px/1.5 Arial;color:#84533d;margin:18px 0 0}</style></head><body><main class="gate"><h1>A flower, for you.</h1><p>A small story, and something to make your own.</p><form action="${ROOT}login" method="post"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128" autofocus><button type="submit">Enter</button>${message?`<p class="error" role="alert">${message}</p>`:''}</form></main></body></html>`;
  return new Response(content,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
export async function onRequest(context){
  const {request,env}=context,url=new URL(request.url);
  // Pages decodes static asset paths. Guard their canonical form too, so an
  // encoded directory name or repeated slash cannot bypass authentication.
  let path=url.pathname;
  for(let i=0;i<5;i++){
    let decoded;try{decoded=decodeURIComponent(path);}catch{break;}
    if(decoded===path)break;path=decoded;
  }
  path=new URL(path.replace(/\/{2,}/g,'/'),url.origin).pathname;
  if(path!=='/labs/flowerring'&&!path.startsWith(ROOT))return context.next();
  url.pathname=path;
  if(!env.FLOWERRING_PASSWORD||!env.FLOWERRING_SESSION_SECRET)return new Response('This private page is temporarily unavailable.',{status:503,headers});
  if(url.pathname==='/labs/flowerring')return new Response(null,{status:308,headers:{...headers,Location:ROOT}});
  if(request.method==='POST'&&url.pathname===ROOT+'login'){
    if(request.headers.get('Origin')!==url.origin)return new Response('Invalid request.',{status:403,headers});
    if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return new Response('Invalid request.',{status:415,headers});
    const ip=request.headers.get('CF-Connecting-IP')||'local',now=Date.now(),failure=failures.get(ip);
    if(failure&&failure.until>now&&failure.count>=8)return login('Please wait a few minutes before trying again.',429);
    const body=await request.text();if(body.length>2048)return new Response('Invalid request.',{status:413,headers});
    const candidate=new URLSearchParams(body).get('password')||'';
    const [a,b]=await Promise.all([candidate,env.FLOWERRING_PASSWORD].map(p=>crypto.subtle.digest('SHA-256',encoder.encode(p))));
    const av=new Uint8Array(a),bv=new Uint8Array(b);let difference=0;for(let i=0;i<av.length;i++)difference|=av[i]^bv[i];
    if(difference!==0){
      if(failures.size>=512)failures.delete(failures.keys().next().value);
      failures.set(ip,{count:failure&&failure.until>now?failure.count+1:1,until:now+10*60*1000});
      return login('That password is not right. Please try again.',401);
    }
    failures.delete(ip);
    return new Response(null,{status:303,headers:{...headers,Location:ROOT,'Set-Cookie':`${COOKIE}=${await token(env,url.hostname)}; Path=${ROOT}; HttpOnly; Secure; SameSite=Lax; Max-Age=${lifetime}`}});
  }
  if(!await authorized(request,env,url.hostname)){
    if(url.pathname===ROOT||url.pathname===ROOT+'index.html')return login();
    return new Response('Password required.',{status:401,headers});
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed.',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  const response=await context.next();
  const result=new Response(response.body,response);
  for(const [name,value] of Object.entries(headers))result.headers.set(name,value);
  return result;
}
