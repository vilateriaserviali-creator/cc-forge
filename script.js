import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const dropZone=document.getElementById('dropZone'),fileInput=document.getElementById('fileInput'),uploadContent=document.getElementById('uploadContent'),previewWrap=document.getElementById('previewWrap'),preview=document.getElementById('preview'),removeImage=document.getElementById('removeImage'),status=document.getElementById('status'),projectList=document.getElementById('projectList'),projectCount=document.getElementById('projectCount'),nameInput=document.getElementById('name');
const aiPhotoInput=document.getElementById('aiPhotoInput'),aiPhotoPreview=document.getElementById('aiPhotoPreview'),aiPhoto=document.getElementById('aiPhoto'),aiDescription=document.getElementById('aiDescription'),aiResult=document.getElementById('aiResult'),aiResultState=document.getElementById('aiResultState'),applyDesign=document.getElementById('applyDesign');
let aiPhotoData=null,aiDesign=null;
aiPhotoInput.addEventListener('change',e=>{
 const file=e.target.files[0]; if(!file)return;
 if(file.size>10*1024*1024){status.textContent='Фото больше 10 MB.';return;}
 const reader=new FileReader(); reader.onload=()=>{aiPhotoData=reader.result;aiPhoto.src=aiPhotoData;aiPhotoPreview.classList.remove('hidden');status.textContent='Фото одежды добавлено.';};reader.readAsDataURL(file);
});
document.getElementById('removeAiPhoto').addEventListener('click',()=>{aiPhotoData=null;aiPhoto.src='';aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';});
document.getElementById('clearDesign').addEventListener('click',()=>{aiDescription.value='';aiPhotoData=null;aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';aiResult.innerHTML='<span class="ai-placeholder">Здесь появится структура дизайна: тип, силуэт, детали, цвета, материал и стиль.</span>';aiResultState.textContent='WAITING';applyDesign.classList.add('hidden');});
async function generateRealDesign(text){
  const payload={description:text,image:aiPhotoData};
  const response=await fetch('https://cc-forge.vilateriaserviali.workers.dev',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({error:'Некорректный ответ сервера.'}));
  if(!response.ok)throw new Error(data.error||'Ошибка генерации.');
  return data;
}
document.getElementById('analyzeDesign').addEventListener('click',async()=>{
  const text=aiDescription.value.trim();
  if(!text&&!aiPhotoData){status.textContent='Добавь фото, описание или оба источника.';return;}
  const button=document.getElementById('analyzeDesign');
  button.disabled=true;
  button.textContent='✨ Генерирую…';
  aiResultState.textContent='GENERATING';
  aiResult.innerHTML='<div class="ai-loading">AI анализирует референс и создаёт дизайн одежды…</div>';
  applyDesign.classList.add('hidden');
  try{
    aiDesign=await generateRealDesign(text);
    aiResultState.textContent='READY';
    aiResult.innerHTML='<div class="ai-generated"><img src="'+aiDesign.image+'" alt="Сгенерированный дизайн одежды"><div class="design-summary"><div><b>Источник</b><span>'+escapeHtml(aiDesign.source)+'</span></div><div><b>Описание</b><span>'+escapeHtml(text||'Дизайн создан по фотографии')+'</span></div></div><a class="secondary ai-download" href="'+aiDesign.image+'" download="cc-forge-design.png">Скачать дизайн PNG</a></div>';
    applyDesign.classList.remove('hidden');
    status.textContent='Готово: AI создал дизайн одежды.';
  }catch(error){
    console.error(error);
    aiResultState.textContent='ERROR';
    aiResult.innerHTML='<span class="ai-placeholder">'+escapeHtml(error.message)+'</span>';
    status.textContent='Генерация не выполнена.';
  }finally{
    button.disabled=false;
    button.textContent='✨ Создать дизайн';
  }
});

applyDesign.addEventListener('click',()=>{
  if(!aiDesign)return;
  const text=aiDescription.value.trim();
  if(text)document.getElementById('description').value=text;
  const name=document.getElementById('name');
  if(name&&!name.value.trim())name.value='AI Clothing Concept';
  document.getElementById('create').scrollIntoView({behavior:'smooth'});
  status.textContent='Дизайн применён к проекту. Можно продолжить настройку CC.';
});


/* Built-in clothing templates + texture presets */
function makeMaterial(){return new THREE.MeshStandardMaterial({color:document.getElementById('modelColor')?.value||'#16131a',roughness:Number(document.getElementById('roughness')?.value||.45),metalness:Number(document.getElementById('metalness')?.value||.05),side:THREE.DoubleSide});}
function addSleeve(group,x,angle=0){
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.95,24),makeMaterial());
  sleeve.position.set(x,.72,0);sleeve.rotation.z=angle;group.add(sleeve);
}
function createClothingTemplate(kind){
  const g=new THREE.Group(),mat=makeMaterial();
  if(kind==='top'){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.62,.54,1.35,32),mat);body.position.y=.78;g.add(body);
    addSleeve(g,-.78,-.35);addSleeve(g,.78,.35);
    const neck=new THREE.Mesh(new THREE.TorusGeometry(.2,.045,12,24),mat);neck.rotation.x=Math.PI/2;neck.position.y=1.48;g.add(neck);
  }else if(kind==='dress'){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.82,.5,2.15,40),mat);body.position.y=1.12;g.add(body);
    addSleeve(g,-.88,-.3);addSleeve(g,.88,.3);
    const belt=new THREE.Mesh(new THREE.TorusGeometry(.64,.035,10,40),mat);belt.rotation.x=Math.PI/2;belt.position.y=.78;g.add(belt);
  }else if(kind==='skirt'){
    const skirt=new THREE.Mesh(new THREE.CylinderGeometry(1.05,.58,1.05,40),mat);skirt.position.y=.62;g.add(skirt);
    const waistband=new THREE.Mesh(new THREE.TorusGeometry(.58,.08,12,40),mat);waistband.rotation.x=Math.PI/2;waistband.position.y=1.15;g.add(waistband);
  }else{
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.68,.62,1.55,32),mat);body.position.y=.86;g.add(body);
    addSleeve(g,-.86,-.22);addSleeve(g,.86,.22);
    const hood=new THREE.Mesh(new THREE.TorusGeometry(.34,.13,16,32,Math.PI*1.35),mat);hood.position.set(0,1.65,-.02);hood.rotation.x=Math.PI/2;g.add(hood);
    const pocket=new THREE.Mesh(new THREE.BoxGeometry(.58,.3,.08),mat);pocket.position.set(0,.62,.6);g.add(pocket);
  }
  g.userData.template=kind;
  return g;
}
function useClothingTemplate(kind){
  const object=createClothingTemplate(kind);
  showModel(object);
  setRuntimeModel({name:'CC Forge '+kind+' template',size:0,template:true});
  status.textContent='Шаблон одежды открыт в 3D. Можно менять цвет, материал и текстуру.';
  document.getElementById('forge3d').scrollIntoView({behavior:'smooth'});
}
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
document.querySelectorAll('.clothing-template').forEach(button=>button.addEventListener('click',()=>useClothingTemplate(button.dataset.template)));
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
    status.textContent='Текстура «'+button.querySelector('b').textContent+'» выбрана. 3D-модель не требуется.';
  }catch(error){
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