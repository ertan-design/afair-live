const PALETTE = [[.498,1,.831],[1,.714,.451],[1,.435,.38],[.184,.373,.639]];
const COUNT = 896;
const VS = `#version 300 es
precision highp float;
in vec3 aPos; in float aRole; in float aSize; in float aPhase;
uniform float uTime,uYaw,uPitch,uAspect,uRatio,uSelected,uLine;
out vec4 vColor;
void main(){
 vec3 p=aPos;
 p+=vec3(sin(uTime*.35+aPhase),cos(uTime*.28+aPhase*1.7),sin(uTime*.23+aPhase*.7))*.025;
 float sy=sin(uYaw),cy=cos(uYaw),sx=sin(uPitch),cx=cos(uPitch);
 p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
 p=vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);
 float depth=4.4+p.z;
 gl_Position=vec4(p.x*2.3/uAspect,p.y*2.3,(depth-4.4)*.25,depth);
 float selected=1.-step(.2,abs(aRole-uSelected));
 vec3 mint=vec3(.498,1.,.831),apricot=vec3(1.,.714,.451),coral=vec3(1.,.435,.38);
 vec3 color=mix(mint,apricot,step(.5,mod(aRole,3.)));
 color=mix(color,coral,step(1.5,mod(aRole,3.)));
 color=mix(color,mint,selected*.3);
 float alpha=mix(.55,1.,selected);
 vColor=vec4(color,uLine>.5 ? .13+selected*.19 : alpha);
 gl_PointSize=clamp(aSize*(selected*1.4+1.)*uRatio*4.4/depth,1.,42.);
}`;
const FS = `#version 300 es
precision highp float;
in vec4 vColor; uniform float uLine; out vec4 outColor;
void main(){
 if(uLine>.5){outColor=vColor;return;}
 float r=length(gl_PointCoord-vec2(.5))*2.;
 if(r>1.) discard;
 float glow=exp(-r*r*5.)*.65+(1.-smoothstep(0.,.33,r))*.35;
 outColor=vec4(vColor.rgb,vColor.a*glow);
}`;

/** A self-contained, dependency-free scene. No network or model calls. */
export function createScene(canvas, onStats = () => {}) {
 if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('A canvas is required.');
 let surface=canvas,gl=null,ctx=null,program=null,vbo=null,vao=null;
 let mode='network',role=0,wanted=null,disposed=false,raf=0;
 let width=1,height=1,ratio=1,yaw=.15,pitch=-.12,drag=null;
 let particles=new Float32Array(0),lines=new Float32Array(0),locations={};
 let renderer='Canvas2D',frames=0,sampleStart=0,lastTime=0,elapsed=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Follow the OS preference until a user explicitly chooses the motion control.
 const motion=()=>(wanted===null?!reduced.matches:wanted)&&!document.hidden;
 const emit=fps=>{try{onStats({renderer,fps:Number.isFinite(fps)?Math.round(fps*10)/10:0,motion:motion()});}catch{}};
 const events=[];
 function listen(target,name,fn,options){target.addEventListener(name,fn,options);events.push(()=>target.removeEventListener(name,fn,options));}
 function shader(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message||'Shader compilation failed.');}return s;}
 function releaseGL(){if(!gl)return;try{if(vbo)gl.deleteBuffer(vbo);if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);}catch{}vbo=vao=program=null;gl=null;}
 function initGL(){
  try{gl=surface.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{return false;}
  if(!gl)return false;
  let vertex=null,fragment=null;
  try{
   vertex=shader(gl.VERTEX_SHADER,VS);fragment=shader(gl.FRAGMENT_SHADER,FS);
   program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Program linking failed.');
   gl.deleteShader(vertex);gl.deleteShader(fragment);vertex=fragment=null;
   vao=gl.createVertexArray();vbo=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
   for(const [name,size,offset] of [['aPos',3,0],['aRole',1,12],['aSize',1,16],['aPhase',1,20]]){
    const index=gl.getAttribLocation(program,name);if(index<0)continue;gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,24,offset);
   }
   for(const n of ['uTime','uYaw','uPitch','uAspect','uRatio','uSelected','uLine'])locations[n]=gl.getUniformLocation(program,n);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
   renderer='WebGL2';return true;
  }catch{
   if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);releaseGL();return false;
  }
 }
 function fallback(){
  releaseGL();
  // A canvas cannot switch context families after a WebGL context was created.
  let next=null;try{next=surface.getContext('2d');}catch{}
  if(!next){const replacement=surface.cloneNode(false);if(surface.parentNode)surface.parentNode.replaceChild(replacement,surface);surface=replacement;next=surface.getContext('2d');}
  ctx=next;if(!ctx)throw Error('No supported graphics context is available.');
  renderer='Canvas2D';
 }
 const random=(i,s=1)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};
 function build(){
  const points=[],edges=[],anchors=[];
  for(let r=0;r<8;r++){
   const t=r/8*Math.PI*2;
   anchors.push(mode==='network'?[Math.cos(t)*1.12,Math.sin(t)*.8,Math.sin(t*2)*.4]:mode==='stage'?[(r%4-1.5)*.68,r<4?.65:-.65,(r%2-.5)*.65]:[(r-3.5)*.38,Math.sin(r*.85)*.45,Math.cos(r*.85)*.4]);
  }
  for(let i=0;i<COUNT;i++){
   const r=i%8,a=anchors[r],n=Math.floor(i/8),t=random(i,2)*Math.PI*2;
   let x,y,z;
   if(mode==='network'){
    const u=random(i,3)*2-1,rad=.13+Math.cbrt(random(i,4))*.31,q=Math.sqrt(1-u*u);
    x=a[0]+Math.cos(t)*q*rad;y=a[1]+Math.sin(t)*q*rad;z=a[2]+u*rad;
   }else if(mode==='stage'){
    x=a[0]+(random(i,3)-.5)*.5;y=a[1]+(random(i,4)-.5)*.33;z=a[2]+(random(i,5)-.5)*.5;
    if(n<12){x=(r-3.5)*.32;y=-.1;z=(n-5.5)*.14;}
   }else{
    const angle=n*.31+r*.7;
    x=a[0]+(random(i,3)-.5)*.18;y=a[1]+Math.cos(angle)*.16;z=a[2]+Math.sin(angle)*.16;
   }
   points.push(x,y,z,r,n===0?10:2+random(i,8)*5,i*.11);
   if(n%7===0){edges.push(...a,r,1,i*.11,x,y,z,r,1,i*.11);}
  }
  for(let r=0;r<8;r++){const a=anchors[r],b=anchors[(r+1)%8];edges.push(...a,r,1,0,...b,r,1,0);}
  particles=new Float32Array(points);lines=new Float32Array(edges);
  if(gl){gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);const all=new Float32Array(particles.length+lines.length);all.set(particles);all.set(lines,particles.length);gl.bufferData(gl.ARRAY_BUFFER,all,gl.STATIC_DRAW);}
 }
 function project(x,y,z,time,phase){
  x+=Math.sin(time*.35+phase)*.025;y+=Math.cos(time*.28+phase*1.7)*.025;z+=Math.sin(time*.23+phase*.7)*.025;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);
  const rx=x*cy+z*sy,rz=-x*sy+z*cy,ry=y*cx-rz*sx,depth=4.4+y*sx+rz*cx;
  return [width*.5+rx*height*1.15/depth,height*.5-ry*height*1.15/depth,4.4/depth];
 }
 function drawGL(){
  gl.viewport(0,0,surface.width,surface.height);gl.clearColor(.018,.035,.065,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.bindVertexArray(vao);
  for(const [name,val] of Object.entries({uTime:elapsed,uYaw:yaw,uPitch:pitch,uAspect:width/height,uRatio:ratio,uSelected:role}))gl.uniform1f(locations[name],val);
  gl.uniform1f(locations.uLine,1);gl.drawArrays(gl.LINES,particles.length/6,lines.length/6);
  gl.uniform1f(locations.uLine,0);gl.drawArrays(gl.POINTS,0,particles.length/6);
 }
 function draw2D(){
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#050911';ctx.fillRect(0,0,width,height);
  const wash=ctx.createRadialGradient(width*.5,height*.5,0,width*.5,height*.5,Math.max(width,height)*.6);wash.addColorStop(0,'#2F5FA326');wash.addColorStop(1,'#2F5FA300');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
  for(let i=0;i<lines.length;i+=12){const a=project(lines[i],lines[i+1],lines[i+2],elapsed,lines[i+5]),b=project(lines[i+6],lines[i+7],lines[i+8],elapsed,lines[i+11]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=lines[i+3]===role?'#7FFFD455':'#7FFFD419';ctx.lineWidth=.7;ctx.stroke();}
  for(let i=0;i<particles.length;i+=6){const p=project(particles[i],particles[i+1],particles[i+2],elapsed,particles[i+5]);const selected=particles[i+3]===role;const r=particles[i+4]*p[2]*(selected?1.6:1)*.5;const color=PALETTE[particles[i+3]%3];ctx.globalAlpha=selected?.95:.57;ctx.fillStyle=`rgb(${color.map(c=>Math.round(c*255)).join(',')})`;ctx.beginPath();ctx.arc(p[0],p[1],Math.max(.6,r),0,Math.PI*2);ctx.fill();if(selected&&r>3){ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(p[0],p[1],r*2.5,0,Math.PI*2);ctx.fill();}}
  ctx.globalAlpha=1;
 }
 function frame(now){
  raf=0;if(disposed||document.hidden)return;
  if(lastTime&&motion())elapsed+=Math.min((now-lastTime)/1000,.05);lastTime=now;
  if(motion()&&!drag)yaw+=.0012;
  try{if(gl)drawGL();else draw2D();}catch{if(gl){fallback();bindSurface();observer.disconnect();observer.observe(surface);resize();resetSample();return;}return;}
  frames++;if(!sampleStart)sampleStart=now;
  const delta=now-sampleStart;if(delta>=1000){emit((frames-1)*1000/delta);frames=1;sampleStart=now;}
  if(motion())raf=requestAnimationFrame(frame);
 }
 function request(){if(!disposed&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
 function resetSample(){lastTime=0;frames=0;sampleStart=0;emit(0);}
 function resize(){if(disposed)return;const rect=surface.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);ratio=Math.min(1.5,Math.max(1,devicePixelRatio||1));surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);request();}
 function bindSurface(){
  listen(surface,'pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};try{surface.setPointerCapture(e.pointerId);}catch{}});
  listen(surface,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;yaw+=dx*.006;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.006));request();});
  const finish=e=>{if(drag?.id===e.pointerId){drag=null;request();}};
  listen(surface,'pointerup',finish);listen(surface,'pointercancel',finish);listen(surface,'lostpointercapture',finish);
  listen(surface,'webglcontextlost',e=>{e.preventDefault();if(disposed)return;fallback();bindSurface();observer.disconnect();observer.observe(surface);resize();resetSample();});
  surface.style.touchAction='pan-y';
 }
 if(!initGL())fallback();
 const observer=new ResizeObserver(resize);observer.observe(surface);
 bindSurface();build();resize();emit(0);
 listen(document,'visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}resetSample();request();});
 const changed=()=>{if(raf)cancelAnimationFrame(raf);raf=0;resetSample();request();};
 if(reduced.addEventListener){reduced.addEventListener('change',changed);events.push(()=>reduced.removeEventListener('change',changed));}else{reduced.addListener(changed);events.push(()=>reduced.removeListener(changed));}
 listen(window,'resize',resize);
 return {
  setMode(value){if(!['network','stage','timeline'].includes(value)||disposed)return;mode=value;build();request();},
  setRole(value){if(!Number.isInteger(value)||value<0||value>7||disposed)return;role=value;request();},
  setMotion(value){if(disposed)return;wanted=Boolean(value);changed();},
  destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();for(const remove of events)remove();releaseGL();ctx=null;particles=lines=new Float32Array(0);drag=null;}
 };
}
