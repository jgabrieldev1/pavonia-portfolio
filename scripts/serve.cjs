const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const value = (key, fallback) => { const i = args.indexOf(key); return i >= 0 ? args[i + 1] : fallback; };
const port = Number(value('--port', process.env.PORT || 5173));
const host = value('--host', '0.0.0.0');
const root = process.cwd();
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.ttf':'font/ttf','.webm':'video/webm','.json':'application/json'};
http.createServer((req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filename = path.resolve(root, '.' + requested);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  const size = fs.statSync(filename).size;
  const headers = {'Content-Type':types[path.extname(filename)] || 'application/octet-stream','Accept-Ranges':'bytes'};
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) { const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):size-1,size-1); if(start>=size || start>end){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(filename,{start,end}).pipe(res); }
  else {res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(filename).pipe(res);}
}).listen(port,host,()=>console.log(`Exhibition available on http://${host}:${port}`));
