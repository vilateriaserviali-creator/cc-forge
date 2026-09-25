const WORKER_URL='https://cc-forge.vilateriaserviali.workers.dev';

const $=id=>document.getElementById(id);
const status=$('status');
const projectRuntime={textureFile:null,textureMeta:null};
let aiPhotoData=null,aiDesign=null,selectedPresetTexture=null;

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function formatBytes(bytes){if(!bytes)return '0 B';const u=['B','KB','MB','GB'];let i=0,n=bytes;while(n>=1024&&i<u.length-1){n/=1024;i++;}return n.toFixed(i?1:0)+' '+u[i];}
function readImageMeta(file){return new Promise(resolve=>{if(!file)return resolve(null);const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const r={width:img.naturalWidth,height:img.naturalHeight,size:file.size,name:file.name};URL.revokeObjectURL(url);resolve(r)};img.onerror=()=>{URL.revokeObjectURL(url);resolve(null)};img.src=url;});}

const dropZone=$('dropZone'),fileInput=$('fileInput'),uploadContent=$('uploadContent'),previewWrap=$('previewWrap'),preview=$('preview'),removeImage=$('removeImage');
function showFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  if(file.size>10*1024*1024){status.textContent='Изображение больше 10 MB.';return;}
  const reader=new FileReader();reader.onload=()=>{preview.src=reader.result;uploadContent.classList.add('hidden');previewWrap.classList.remove('hidden');status.textContent='Референс добавлен.';};reader.readAsDataURL(file);
}
fileInput?.addEventListener('change',e=>showFile(e.target.files[0]));
['dragenter','dragover'].forEach(ev=>dropZone?.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropZone?.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag')}));
dropZone?.addEventListener('drop',e=>showFile(e.dataTransfer.files[0]));
removeImage?.addEventListener('click',()=>{preview.src='';previewWrap.classList.add('hidden');uploadContent.classList.remove('hidden');fileInput.value='';status.textContent='Референс удалён.'});

document.querySelectorAll('#types .chip').forEach(chip=>chip.addEventListener('click',()=>{document.querySelectorAll('#types .chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');}));
function getSwatches(){return [...document.querySelectorAll('.swatch:not(.add-swatch)')].map(s=>s.dataset.color).filter(Boolean);}
function selectSwatch(s){document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');}
document.querySelectorAll('.swatch:not(.add-swatch)').forEach(s=>s.addEventListener('click',()=>selectSwatch(s)));
$('addSwatch')?.addEventListener('click',()=>{const value=prompt('HEX-цвет, например #d7b7d9');if(!value||!/^#[0-9a-fA-F]{6}$/.test(value.trim())){status.textContent='Нужен HEX-цвет формата #RRGGBB.';return;}const s=document.createElement('button');s.type='button';s.className='swatch';s.style.setProperty('--swatch',value.trim());s.dataset.color=value.trim();s.addEventListener('click',()=>selectSwatch(s));$('swatches').insertBefore(s,$('addSwatch'));selectSwatch(s);});
$('saveVariant')?.addEventListener('click',()=>status.textContent='Цвет сохранён как вариант проекта.');

function getData(){
  return {
    name:$('name').value.trim()||'Новый предмет',
    type:document.querySelector('#types .chip.active')?.dataset.value||'Топ',
    gender:$('gender').value,age:$('age').value,style:$('style').value,category:$('category').value,
    description:$('description').value.trim(),swatches:getSwatches()
  };
}
function addProject(data){
  const card=document.createElement('div');card.className='project-card';
  card.innerHTML='<div class="project-image"><span>NEW CC</span></div><div class="project-info"><p>'+escapeHtml(data.type)+' · '+escapeHtml(data.gender)+' · '+escapeHtml(data.age)+'</p><h3>'+escapeHtml(data.name)+'</h3><span>'+escapeHtml(data.style)+' · '+data.swatches.length+' swatches · Maxis Match</span></div><button class="more" type="button">•••</button>';
  $('projectList').prepend(card);
  $('projectCount').textContent=$('projectList').querySelectorAll('.project-card').length+' проекта';
}
$('saveProject')?.addEventListener('click',()=>{localStorage.setItem('ccForgeProject',JSON.stringify(getData()));$('projectState').textContent='SAVED';status.textContent='Проект сохранён в этом браузере.';});
$('generate')?.addEventListener('click',()=>{const data=getData();if(!data.description&&previewWrap.classList.contains('hidden')){status.textContent='Добавь референс или описание дизайна.';return;}addProject(data);$('projectState').textContent='CONCEPT';status.textContent='Концепт добавлен в проекты.';});

function createPresetTexture(name){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');
  const base={black:'#17141a',denim:'#3c506b',leather:'#3e2330',satin:'#8b5f8e',knit:'#6b5870',lace:'#d8c8da'}[name]||'#17141a';
  ctx.fillStyle=base;ctx.fillRect(0,0,1024,1024);
  if(name==='denim'){for(let i=-1024;i<2048;i+=24){ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+1024,1024);ctx.stroke();}}
  if(name==='leather'){for(let i=0;i<1800;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';ctx.beginPath();ctx.arc(Math.random()*1024,Math.random()*1024,2+Math.random()*4,0,Math.PI*2);ctx.fill();}}
  if(name==='satin'){const g=ctx.createLinearGradient(0,0,1024,1024);g.addColorStop(0,'rgba(255,255,255,.02)');g.addColorStop(.45,'rgba(255,255,255,.38)');g.addColorStop(.55,'rgba(255,255,255,.04)');g.addColorStop(1,'rgba(0,0,0,.18)');ctx.fillStyle=g;ctx.fillRect(0,0,1024,1024);}
  if(name==='knit'){for(let x=0;x<1024;x+=20){ctx.strokeStyle='rgba(255,255,255,.11)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}for(let y=0;y<1024;y+=20){ctx.strokeStyle='rgba(0,0,0,.11)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}}
  if(name==='lace'){ctx.clearRect(0,0,1024,1024);ctx.fillStyle='rgba(235,225,238,.95)';ctx.fillRect(0,0,1024,1024);for(let x=0;x<1024;x+=48)for(let y=0;y<1024;y+=48){ctx.fillStyle='#876b88';ctx.beginPath();ctx.arc(x+24,y+24,12,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x+24,y+24,4,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}}
  return new Promise(resolve=>canvas.toBlob(blob=>resolve(new File([blob], 'cc-forge-'+name+'.png',{type:'image/png'})),'image/png'));
}
document.querySelectorAll('.texture-preset').forEach(button=>button.addEventListener('click',async()=>{
  const name=button.dataset.texture;selectedPresetTexture=await createPresetTexture(name);projectRuntime.textureFile=selectedPresetTexture;projectRuntime.textureMeta=await readImageMeta(selectedPresetTexture);
  document.querySelectorAll('.texture-preset').forEach(x=>x.classList.remove('active'));button.classList.add('active');
  const panel=$('textureSelection');if(panel){panel.classList.remove('hidden');$('selectedTextureName').textContent=button.querySelector('b').textContent;$('selectedTextureInfo').textContent='1024 × 1024 PNG · готова к сборке';$('selectedTexturePreview').className='selected-texture-preview tex-'+name;}
  updateBuildChecks();status.textContent='Текстура «'+button.querySelector('b').textContent+'» выбрана.';
}});
$('downloadTexture')?.addEventListener('click',()=>{if(!selectedPresetTexture)return;const url=URL.createObjectURL(selectedPresetTexture),a=document.createElement('a');a.href=url;a.download=selectedPresetTexture.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);});

const aiPhotoInput=$('aiPhotoInput'),aiPhotoPreview=$('aiPhotoPreview'),aiPhoto=$('aiPhoto'),aiDescription=$('aiDescription'),aiResult=$('aiResult'),aiResultState=$('aiResultState'),applyDesign=$('applyDesign');
aiPhotoInput?.addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024){status.textContent='Фото больше 10 MB.';return;}const reader=new FileReader();reader.onload=()=>{aiPhotoData=reader.result;aiPhoto.src=aiPhotoData;aiPhotoPreview.classList.remove('hidden');status.textContent='Фото одежды добавлено.';};reader.readAsDataURL(file);});
$('removeAiPhoto')?.addEventListener('click',()=>{aiPhotoData=null;aiPhoto.src='';aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';});
$('clearDesign')?.addEventListener('click',()=>{aiDescription.value='';aiPhotoData=null;aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';aiResult.innerHTML='<span class="ai-placeholder">Здесь появится процесс создания одежды и готовый визуальный дизайн.</span>';aiResultState.textContent='WAITING';applyDesign.classList.add('hidden');});
$('analyzeDesign')?.addEventListener('click',async()=>{
  const text=aiDescription.value.trim();if(!text&&!aiPhotoData){status.textContent='Добавь фото, описание или оба источника.';return;}
  aiResultState.textContent='GENERATING';applyDesign.classList.add('hidden');
  aiResult.innerHTML='<div class="ai-generation"><div class="generation-visual"><div class="generation-garment"><span></span><i></i></div><div class="generation-scan"></div></div><div class="generation-title">AI создаёт Maxis Match дизайн</div><div class="generation-stage">Готовим визуальный концепт одежды для CAS…</div></div>';
  const body={description:text,image:aiPhotoData};
  try{
    const response=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Ошибка генерации');
    aiResultState.textContent='READY';aiDesign=data;aiResult.innerHTML='<div class="ai-design-result"><img src="'+data.image+'" alt="Maxis Match clothing concept"><div class="design-meta"><b>MAXIS MATCH</b><span>'+escapeHtml(data.source||'Фото + описание')+'</span></div></div>';applyDesign.classList.remove('hidden');status.textContent='Maxis Match концепт готов.';
  }catch(error){console.error(error);aiResultState.textContent='ERROR';aiResult.innerHTML='<span class="ai-placeholder">Не удалось создать дизайн: '+escapeHtml(error.message)+'</span>';status.textContent='Ошибка AI: '+error.message;}
});
applyDesign?.addEventListener('click',()=>{if(!aiDesign)return;const text=aiDescription.value.trim();if(text)$('description').value=text;addProject(getData());$('create').scrollIntoView({behavior:'smooth'});status.textContent='Maxis Match дизайн применён к проекту.';});

function updateBuildChecks(){if($('checkTexture'))$('checkTexture').checked=!!projectRuntime.textureFile;const ready=!!aiDesign;const button=$('buildPackage');if(button)button.disabled=!ready;if($('packageState'))$('packageState').textContent=ready?'DESIGN READY':'WAITING';}
$('checkCas')?.addEventListener('change',updateBuildChecks);
$('goToAi')?.addEventListener('click',()=>{$('aiForge')?.scrollIntoView({behavior:'smooth'});});
$('buildPackage')?.addEventListener('click',()=>{if(!aiDesign){status.textContent='Сначала создай дизайн по фото или описанию.';$('aiForge')?.scrollIntoView({behavior:'smooth'});return;}$('packageBuildStatus').textContent='Дизайн принят. Следующий этап — автоматическая генерация Sims 4 mesh, CAS и настоящего .package.';status.textContent='Дизайн подготовлен к сборке Sims 4 CC.';});
updateBuildChecks();

const saved=localStorage.getItem('ccForgeProject');if(saved){try{const d=JSON.parse(saved);$('name').value=d.name==='Новый предмет'?'':d.name;$('description').value=d.description||'';$('projectState').textContent='SAVED';}catch{}}
