// Pocasset V3 — tree-canopy classification from NAIP (run in a browser tab on any *.nationalmap.gov page,
// because the container cannot reach USGS). Exact code used for Hole 2 on 2026-11-15. See docs/RENDERING_STANDARD.md §Trees.
// Inputs to set per hole: BBOX (EPSG:6348 metres, 1 m per pixel) and the NAIP raster ids covering it
// (find them with the ImageServer /query endpoint: Category=1, newest acquisition_date).
const BBOX=[365455,4616274,366071,4617118], RASTERS=[72824,72826];
const W=BBOX[2]-BBOX[0], H=BBOX[3]-BBOX[1];
const base='https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage?f=image&bbox='+BBOX.join(',')+
 '&bboxSR=6348&imageSR=6348&size='+W+','+H+'&format=png&interpolation=RSP_BilinearInterpolation&mosaicRule='+
 encodeURIComponent(JSON.stringify({mosaicMethod:'esriMosaicLockRaster',lockRasterIds:RASTERS}));
async function get(b){const bl=await fetch(base+'&bandIds='+b).then(r=>r.blob());const bm=await createImageBitmap(bl);
 const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.drawImage(bm,0,0);return x.getImageData(0,0,W,H).data;}
function boxmean(a,rad){const o=new Float32Array(W*H),I=new Float64Array((W+1)*(H+1));
 for(let y=0;y<H;y++){let s=0;for(let x=0;x<W;x++){s+=a[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+s;}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const x0=Math.max(0,x-rad),x1=Math.min(W,x+rad+1),y0=Math.max(0,y-rad),y1=Math.min(H,y+rad+1);
  o[y*W+x]=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/((x1-x0)*(y1-y0));}return o;}
const R=await get('0,1,2'), N=await get('3,0,1');           // natural colour; NIR in the first channel
const br=new Float32Array(W*H), nd=new Float32Array(W*H);
for(let k=0;k<W*H;k++){const r=R[4*k],g=R[4*k+1],b=R[4*k+2],n=N[4*k];br[k]=(r+g+b)/3;nd[k]=(n-r)/(n+r+1e-6);}
const m=boxmean(br,2), sq=boxmean(br.map(v=>v*v),2), ndm=boxmean(nd,2);
const bin=new Float32Array(W*H);
for(let k=0;k<W*H;k++){const tex=Math.sqrt(Math.max(0,sq[k]-m[k]*m[k]));bin[k]=(ndm[k]>0.19&&tex>14&&m[k]<140)?1:0;}
const cov=boxmean(bin,3);
const w=W/2,h=H/2,o=new Uint8Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=0;for(const[dy,dx]of[[0,0],[0,1],[1,0],[1,1]])s+=cov[(2*y+dy)*W+2*x+dx]>0.5?1:0;o[y*w+x]=s;}
const buf=new Uint8Array(await new Response(new Blob([o]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
let s='';for(const b of buf)s+=String.fromCharCode(b);
window.__canopy_b64=btoa(s);   // read back in parts, verify SHA-256, base64-decode into data/sources/canopy/
