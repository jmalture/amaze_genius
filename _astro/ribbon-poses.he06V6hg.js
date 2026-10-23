var e=7,t=`
precision highp float;
uniform vec4 uP[14]; // x, y, z, w
uniform vec4 uQ[14]; // twist, hue, gain, fan
uniform float uSX;    // design x → world x
uniform float uSY;    // design y → world y
uniform float uAspect;
uniform float uIntro;

vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}

vec4 cr(vec4 a, vec4 b, vec4 c, vec4 d, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return 0.5 * (2.0 * b + (c - a) * t + (2.0 * a - 5.0 * b + 4.0 * c - d) * t2 + (3.0 * b - a - 3.0 * c + d) * t3);
}

// Derivative of cr() with respect to t: the direction of the centre line, without evaluating the curve twice more.
vec2 crd(vec2 a, vec2 b, vec2 c, vec2 d, float t) {
  return 0.5 * ((c - a) + 2.0 * t * (2.0 * a - 5.0 * b + 4.0 * c - d) + 3.0 * t * t * (3.0 * b - a - 3.0 * c + d));
}

void spline(int r, float u, out vec4 P, out vec4 Q, out vec2 D) {
  float f = clamp(u, 0.0, 1.0) * 6.0;
  float fi = min(floor(f), 5.0);
  float t = f - fi;
  int b = r * ${e};
  int i0 = b + int(max(fi - 1.0, 0.0));
  int i1 = b + int(fi);
  int i2 = b + int(fi + 1.0);
  int i3 = b + int(min(fi + 2.0, 6.0));
  P = cr(uP[i0], uP[i1], uP[i2], uP[i3], t);
  Q = cr(uQ[i0], uQ[i1], uQ[i2], uQ[i3], t);
  D = crd(uP[i0].xy, uP[i1].xy, uP[i2].xy, uP[i3].xy, t);
}

// World position of line v (0…1 across the band) at u (0…1 along it). s = perspective scale, hue out.
vec3 ribbon(int r, float u, float v, out float s, out float hue, out float gain) {
  vec4 P; vec4 Q; vec2 D;
  spline(r, u, P, Q, D);
  vec2 T = vec2(D.x * uSX, D.y * uSY);
  vec2 Nn = normalize(vec2(-T.y, T.x) + vec2(0.0, 1e-5));
  vec3 C = vec3(P.x * uSX, P.y * uSY, P.z);
  float th = Q.x + (v - 0.5) * Q.w;
  float off = (v - 0.5) * 2.0 * max(P.w, 0.0) * uSY;
  vec3 p = C + off * (cos(th) * vec3(Nn, 0.0) + sin(th) * vec3(0.0, 0.0, 1.0));
  s = 2.6 / (2.6 - p.z);
  hue = Q.y;
  gain = Q.z;
  return p;
}

float reveal(float u) {
  return smoothstep(u - 0.16, u, uIntro * 1.18);
}
`,n=`${t}
attribute vec3 a; // u, v, ribbon
uniform float uAlpha;
varying vec3 vCol;
varying float vA;
void main() {
  int r = int(a.z + 0.5);
  float s; float hue; float gain;
  vec3 p = ribbon(r, a.x, a.y, s, hue, gain);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  vCol = hsv(fract(hue + (a.y - 0.5) * 0.03), 0.84, 1.0);
  float edge = smoothstep(0.0, 0.07, a.x) * smoothstep(1.0, 0.93, a.x);
  float rim = 0.78 + 0.22 * smoothstep(0.3, 0.5, abs(a.y - 0.5));
  vA = uAlpha * gain * edge * rim * reveal(a.x) * (0.5 + 0.5 * s);
}`,r=`
precision highp float;
varying vec3 vCol;
varying float vA;
void main() {
  gl_FragColor = vec4(vCol * vA, vA);
}`,i=`${t}
attribute vec4 b; // u0, v, ribbon, seed
uniform float uT;
uniform float uDpr;
varying vec3 vCol;
varying float vA;
void main() {
  int r = int(b.z + 0.5);
  float u = fract(b.x + uT * (0.01 + 0.014 * b.w));
  float s; float hue; float gain;
  vec3 p = ribbon(r, u, b.y, s, hue, gain);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  float tw = 0.5 + 0.5 * sin(uT * (0.7 + b.w) + b.w * 40.0);
  tw = tw * tw * tw;
  vCol = mix(hsv(fract(hue), 0.7, 1.0), vec3(1.0), 0.45);
  float edge = smoothstep(0.05, 0.16, u) * smoothstep(0.95, 0.84, u);
  vA = tw * edge * reveal(u) * min(1.0, gain * 1.5);
  gl_PointSize = (18.0 + 46.0 * tw) * uDpr * s;
}`,a=`
precision highp float;
varying vec3 vCol;
varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float core = exp(-r * r * 260.0);
  float glow = exp(-r * r * 28.0) * 0.45;
  float rays = max(0.0, 1.0 - abs(d.x) * 30.0) * smoothstep(0.5, 0.0, abs(d.y))
             + max(0.0, 1.0 - abs(d.y) * 30.0) * smoothstep(0.5, 0.0, abs(d.x));
  float a = (core + glow + rays * 0.5) * vA;
  gl_FragColor = vec4(mix(vCol, vec3(1.0), core) * a, a);
}`;function o(e,t,n){let r=(t,n)=>{let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r},i=r(e.VERTEX_SHADER,t),a=r(e.FRAGMENT_SHADER,n),o=e.createProgram();return e.attachShader(o,i),e.attachShader(o,a),e.linkProgram(o),{p:o,v:i,f:a}}function s(e,t){let n=e.getExtension(`KHR_parallel_shader_compile`);return new Promise(r=>{let i=()=>{if(n&&!t.every(({p:t})=>e.getProgramParameter(t,n.COMPLETION_STATUS_KHR)))requestAnimationFrame(i);else{for(let{p:n,v:i,f:a}of t)if(!e.getProgramParameter(n,e.LINK_STATUS)){console.warn(`[ribbons]`,e.getShaderInfoLog(i)||e.getShaderInfoLog(a)||e.getProgramInfoLog(n)),r(!1);return}r(!0)}};i()})}var c=(e,t,n,r,i)=>.5*(2*t+(n-e)*i+(2*e-5*t+4*n-r)*i*i+(3*t-e-3*n+r)*i*i*i);async function l(t,l){l={...l};let u=t.getContext(`webgl`,{antialias:!0,alpha:!0,premultipliedAlpha:!0,powerPreference:`high-performance`});if(!u)return null;let d=u.getExtension(`WEBGL_debug_renderer_info`),f=String(d?u.getParameter(d.UNMASKED_RENDERER_WEBGL):u.getParameter(u.RENDERER));if(/swiftshader|llvmpipe|softpipe|software|basic render/i.test(f)&&l.pose==null&&!l.allowSoftware)return u.getExtension(`WEBGL_lose_context`)?.loseContext(),null;l.pose!=null&&(l.still=!0);let p=o(u,n,r),m=o(u,i,a);if(!await s(u,[p,m]))return null;let h=p.p,g=m.p,_=l.ribbons.slice(0,2),v=Math.min(innerWidth,innerHeight)<700,y=Math.round((l.segments??240)*(v?.7:1)),b=l.sparkles??8,x=_.map(e=>Math.round((e.lines??110)*(v?.65:1))),S=x.reduce((e,t)=>e+t*y*2,0),C=new Float32Array(S*3),w=0;_.forEach((e,t)=>{let n=x[t];for(let e=0;e<n;e++){let r=e/(n-1);for(let e=0;e<y;e++)C[w++]=e/y,C[w++]=r,C[w++]=t,C[w++]=(e+1)/y,C[w++]=r,C[w++]=t}});let T=u.createBuffer();u.bindBuffer(u.ARRAY_BUFFER,T),u.bufferData(u.ARRAY_BUFFER,C,u.STATIC_DRAW);let E=S,D=7,O=()=>(D=D*16807%2147483647)/2147483647,k=new Float32Array(b*4);for(let e=0;e<b;e++)k.set([O(),O()<.5?0:1,0,O()],e*4);let A=u.createBuffer();u.bindBuffer(u.ARRAY_BUFFER,A),u.bufferData(u.ARRAY_BUFFER,k,u.STATIC_DRAW);let j=new Float32Array(56),M=new Float32Array(56),N=e=>({uP:u.getUniformLocation(e,`uP`),uQ:u.getUniformLocation(e,`uQ`),uSX:u.getUniformLocation(e,`uSX`),uSY:u.getUniformLocation(e,`uSY`),uAspect:u.getUniformLocation(e,`uAspect`),uIntro:u.getUniformLocation(e,`uIntro`),uAlpha:u.getUniformLocation(e,`uAlpha`),uT:u.getUniformLocation(e,`uT`),uDpr:u.getUniformLocation(e,`uDpr`)}),P=N(h),F=N(g),I=u.getAttribLocation(h,`a`),L=u.getAttribLocation(g,`b`);u.disable(u.DEPTH_TEST),u.enable(u.BLEND),u.blendFunc(u.ONE,u.ONE),u.clearColor(0,0,0,0);let R=1,z=1,B=()=>{R=Math.min(devicePixelRatio||1,v?2:1.75);let e=Math.max(1,Math.round(t.clientWidth*R)),n=Math.max(1,Math.round(t.clientHeight*R));(t.width!==e||t.height!==n)&&(t.width=e,t.height=n),z=e/n,u.viewport(0,0,e,n)};B();let V={x:0,y:0,tx:0,ty:0};(l.pointerTarget??window).addEventListener(`pointermove`,e=>{let t=e;V.tx=t.clientX/innerWidth*2-1,V.ty=-(t.clientY/innerHeight*2-1)});let H=0,U=()=>{let e=t.getBoundingClientRect();H=Math.max(0,Math.min(1.5,-e.top/Math.max(1,e.height)))},ee=l.duration??7,W=l.lag??.35,te=l.motion??1,ne=l.span??1.12,re=l.alpha??.5,ie=l.intro!==!1&&!l.still,ae=performance.now(),G=0,K=ae,q=!1,J=0,oe=(t,n,r)=>{let i=t.poses,a=i.length;for(let t=0;t<e;t++){let e=n-t/6*W,o=Math.floor(e),s=e-o,l=i[((o-1)%a+a)%a][t],u=i[(o%a+a)%a][t],d=i[((o+1)%a+a)%a][t],f=i[((o+2)%a+a)%a][t];for(let e=0;e<5;e++)r[t*5+e]=c(l[e],u[e],d[e],f[e],s)}},se=[1,1,.5,1.5,.12],ce=_.map(e=>{let t=e.poses.length,n=t*120,r=new Float64Array(n+1),i=[],a=[];oe(e,0,i);for(let t=1;t<=n;t++){oe(e,t/120,a);let n=0;for(let e=0;e<35;e++)n+=se[e%5]*Math.abs(a[e]-i[e]);r[t]=r[t-1]+n;for(let e=0;e<35;e++)i[e]=a[e]}return{cum:r,M:n,n:t}}),le=(e,t)=>{let{cum:n,M:r,n:i}=ce[e],a=i*ee,o=Math.floor(t/a),s=(t-o*a)/a*n[r],c=0,l=r;for(;l-c>1;){let e=c+l>>1;n[e]<=s?c=e:l=e}let u=n[l]-n[c]||1;return o*i+(c+(s-n[c])/u)/120},ue=t=>{let n=t*te,r=z<1;_.forEach((i,a)=>{let o=i.poses.length,s=i.poses,u=+!l.still,d=i.flipX?-1:1,f=(i.flipY?-1:1)*(r?.42:1),p=(i.width??1)*(r?.75:1),m=l.pose==null?le(a,t):l.pose;for(let t=0;t<e;t++){let r=m+(i.offset??0)-(l.pose==null?t/6*W:0),h=Math.floor(r),g=r-h,_=s[((h-1)%o+o)%o][t],v=s[(h%o+o)%o][t],y=s[((h+1)%o+o)%o][t],b=s[((h+2)%o+o)%o][t],x=e=>c(_[e],v[e],y[e],b[e],g),S=t*1.7+a*2.3,C=x(0)+u*.03*Math.sin(n*.6+S),w=x(1)+u*(.06*Math.sin(n*.9+S)+V.y*.05)-H*.35,T=x(2)+u*.16*Math.sin(n*.5+S*.7),E=Math.max(.02,x(3))*p*(1+u*.18*Math.sin(n*.8+S*1.3)),D=x(4)+u*(.4*Math.sin(n*.45+S*.6)+V.x*1.1*(t/6-.5))+H*2.4,O=x(5),k=(a*e+t)*4;j[k]=C*d,j[k+1]=w*f,j[k+2]=T,j[k+3]=E,M[k]=D,M[k+1]=O,M[k+2]=i.gain??1,M[k+3]=i.fan??.25}})},de=(e,t)=>{u.uniform4fv(e.uP,j),u.uniform4fv(e.uQ,M),u.uniform1f(e.uSX,ne*z),u.uniform1f(e.uSY,1),u.uniform1f(e.uAspect,z),u.uniform1f(e.uIntro,t)},Y=e=>{let t=Math.max(0,Math.min(.05,(e-K)/1e3));K=e,l.still||(G+=t),V.x+=(V.tx-V.x)*Math.min(1,t*2),V.y+=(V.ty-V.y)*Math.min(1,t*2);let n=1-(1-(ie?Math.min(1,(e-ae)/2600):1))**3;ue(G),u.clear(u.COLOR_BUFFER_BIT),u.useProgram(h),de(P,n),u.uniform1f(P.uAlpha,re*(v?1.2:1)),u.bindBuffer(u.ARRAY_BUFFER,T),u.enableVertexAttribArray(I),u.vertexAttribPointer(I,3,u.FLOAT,!1,0,0),u.drawArrays(u.LINES,0,E),u.disableVertexAttribArray(I),b&&(u.useProgram(g),de(F,n),u.uniform1f(F.uT,G*te),u.uniform1f(F.uDpr,R),u.bindBuffer(u.ARRAY_BUFFER,A),u.enableVertexAttribArray(L),u.vertexAttribPointer(L,4,u.FLOAT,!1,0,0),u.drawArrays(u.POINTS,0,b),u.disableVertexAttribArray(L))},X=0,fe=0,pe=e=>{let t=performance.now();Y(e),++fe>30&&(X=performance.now()-t>24?X+1:Math.max(0,X-1)),X>90?(l.still=!0,Q()):q&&(J=requestAnimationFrame(pe))},Z=()=>{q||l.still||(q=!0,K=performance.now(),J=requestAnimationFrame(pe))},Q=()=>{q=!1,cancelAnimationFrame(J)},$=!0;return new IntersectionObserver(([e])=>{$=e.isIntersecting,$&&!document.hidden?Z():Q()}).observe(t),document.addEventListener(`visibilitychange`,()=>document.hidden||!$?Q():Z()),addEventListener(`scroll`,U,{passive:!0}),new ResizeObserver(()=>{B(),q||Y(performance.now())}).observe(t),U(),Y(performance.now()),Z(),requestAnimationFrame(()=>l.onReady?.()),{start:Z,stop:Q}}var u=[[-1.25,.05,0,.22,.3,.98],[-.75,.06,.1,.26,.75,1.06],[-.35,-.12,.25,.2,1.35,1.14],[.05,-.3,.15,.13,1.75,1.26],[.42,-.2,-.1,.2,2.5,1.46],[.72,.12,-.25,.26,3,1.63],[1.02,.42,-.35,.28,3.45,1.84]],d=[[-1.25,.12,0,.07,0,.16],[-.85,.36,.25,.16,1.3,.15],[-.55,.22,.35,.15,2.3,.12],[-.2,.08,.15,.12,3.1,.07],[.2,-.02,0,.1,4.1,.02],[.62,-.22,-.15,.13,5.1,-.04],[1.25,-.12,-.3,.17,6.2,-.1]],f=[[-1.25,-.38,0,.3,.2,.31],[-.7,.04,.1,.27,.6,.28],[-.25,.34,.25,.14,1.4,.24],[.15,.42,.25,.09,1.72,.21],[.55,.3,.1,.2,2.25,.18],[.9,.04,0,.27,2.85,.16],[1.25,-.28,-.1,.2,3.15,.15]],p=[[-1.25,.18,0,.14,.4,.86],[-.75,-.04,.1,.18,.95,.82],[-.35,-.32,.25,.12,1.55,.78],[.05,-.2,.15,.05,3.15,.73],[.45,.02,0,.21,3.55,.69],[.8,.27,-.15,.26,3.85,.65],[1.25,.48,-.3,.3,4.15,.62]],m=[[-1.25,-.05,0,.06,.1,.99],[-.75,-.06,0,.1,.4,1.08],[-.35,-.32,.15,.19,1.2,1.18],[0,-.3,.3,.07,1.62,1.33],[.32,-.08,.15,.12,2.6,1.5],[.7,.2,-.15,.26,3.1,1.66],[1.25,.36,-.35,.3,3.4,1.82]],h=[[-1.25,.22,0,.11,0,.98],[-.8,.1,.15,.11,.9,1.05],[-.4,-.06,.3,.09,1.85,1.14],[0,-.14,.3,.04,2.95,1.3],[.4,-.06,.15,.09,3.65,1.5],[.8,.1,0,.13,4.25,1.7],[1.25,.24,-.1,.15,4.85,1.85]],g=(e,t)=>e.map(([e,n,r,i,a,o])=>[e,n,r,i,a,o+t]),_=[u,g(d,1),g(f,1),g(p,1),m,h],v=[[[-1.25,-.55,0,.2,.4,.62],[-.75,-.42,.1,.24,.9,.66],[-.3,-.62,.2,.14,1.6,.7],[.1,-.5,.2,.08,2.2,.74],[.5,-.3,.05,.2,2.8,.78],[.85,-.45,-.1,.26,3.3,.82],[1.25,-.6,-.2,.22,3.7,.86]],[[-1.25,-.4,0,.14,.2,.86],[-.75,-.6,.1,.18,1.1,.8],[-.3,-.48,.25,.22,1.7,.75],[.1,-.7,.2,.12,2.6,.7],[.5,-.55,.05,.08,3.2,.66],[.85,-.35,-.1,.2,3.6,.63],[1.25,-.5,-.2,.26,4,.6]]];export{_ as n,l as r,v as t};