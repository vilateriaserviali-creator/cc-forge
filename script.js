function createPresetTexture(name){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
  const base={black:'#17141a',denim:'#3c506b',leather:'#3e2330',satin:'#8b5f8e',knit:'#6b5870',lace:'#d8c8da'}[name]||'#17141a';
  ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  if(name==='denim'){for(let i=-512;i<1024;i+=12){ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+512,512);ctx.stroke();}}
  if(name==='leather'){for(let i=0;i<900;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';ctx.beginPath();ctx.arc(Math.random()*512,Math.random()*512,1.5+Math.random()*2,0,Math.PI*2);ctx.fill();}}
  if(name==='satin'){const grad=ctx.createLinearGradient(0,0,512,512);grad.addColorStop(0,'rgba(255,255,255,.02)');grad.addColorStop(.45,'rgba(255,255,255,.38)');grad.addColorStop(.55,'rgba(255,255,255,.04)');grad.addColorStop(1,'rgba(0,0,0,.18)');ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);}
  if(name==='knit'){for(let x=0;x<512;x+=10){ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}for(let y=0;y<512;y+=10){ctx.strokeStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}}
  if(name==='lace'){ctx.clearRect(0,0,512,512);ctx.fillStyle='rgba(235,225,238,.95)';ctx.fillRect(0,0,512,512);for(let x=0;x<512;x+=24)for(let y=0;y<512;y+=24){ctx.fillStyle='#876b88';ctx.beginPath();ctx.arc(x+12,y+12,6,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x+12,y+12,2.2,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}}
  return new Promise(resolve=>{
    canvas.toBlob(blob=>{
      if(blob){resolve(new File([blob],'cc-forge-'+name+'.png',{type:'image/png'}));return;}
      const dataUrl=canvas.toDataURL('image/png'),binary=atob(dataUrl.split(',')[1]),bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      resolve(new File([bytes],'cc-forge-'+name+'.png',{type:'image/png'}));
    },'image/png');
  });
}
let selectedPresetTexture=null;
const textureSelection=document.getElementById('textureSelection');
const selectedTexturePreview=document.getElementById('selectedTexturePreview');
const selectedTextureName=document.getElementById('selectedTextureName');
const selectedTextureInfo=document.getElementById('selectedTextureInfo');
const downloadTexture=document.getElementById('downloadTexture');

document.querySelectorAll('.texture-preset').forEach(button=>button.addEventListener('click',async()=>{
  try{
    document.querySelectorAll('.texture-preset').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');
    const name=button.dataset.texture;
    const file=await createPresetTexture(name);
    selectedPresetTexture=file;
    projectRuntime.textureFile=file;
    projectRuntime.textureMeta=await readImageMeta(file);
    if(textureSelection){
      textureSelection.classList.remove('hidden');
      selectedTextureName.textContent=button.querySelector('b').textContent;
      selectedTextureInfo.textContent=projectRuntime.textureMeta.width+' × '+projectRuntime.textureMeta.height+' PNG · готова к использованию';
      selectedTexturePreview.className='selected-texture-preview tex-'+name;
    }
    status.textContent='Текстура «'+button.querySelector('b').textContent+'» выбрана.';
  }catch(error){
    clearInterval(generationTimer);
    console.error('CC Forge texture preset error:',error);
    status.textContent='Не удалось выбрать текстуру. Попробуй ещё раз.';
  }
}));

downloadTexture?.addEventListener('click',()=>{
  if(!selectedPresetTexture)return;
  const url=URL.createObjectURL(selectedPresetTexture);
  const a=document.createElement('a');
  a.href=url;
  a.download=selectedPresetTexture.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Текстура скачана в PNG.';
});