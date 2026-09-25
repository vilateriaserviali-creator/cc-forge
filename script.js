import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const dropZone=document.getElementById('dropZone'),fileInput=document.getElementById('fileInput'),uploadContent=document.getElementById('uploadContent'),previewWrap=document.getElementById('previewWrap'),preview=document.getElementById('preview'),removeImage=document.getElementById('removeImage'),status=document.getElementById('status'),projectList=document.getElementById('projectList'),projectCount=document.getElementById('projectCount'),nameInput=document.getElementById('name');
const modelInput=document.getElementById('modelInput'),textureInput=document.getElementById('textureInput'),viewport=document.getElementById('threeViewport'),viewportEmpty=document.getElementById('viewportEmpty'),viewportLoading=document.getElementById('viewportLoading'),modelState=document.getElementById('modelState');

function showFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  if(file.size>10*1024*1024){status.textContent='Изображение больше 10 MB.';return;}
  const reader=new FileReader(); reader.onload=()=>{preview.src=reader.result;uploadContent.classList.add('hidden');previewWrap.classList.remove('hidden');status.textContent='Изображение добавлено.';}; reader.readAsDataURL(file);
}
fileInput.addEventListener('change',e=>showFile(e.target.files[0]));
['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>showFile(e.dataTransfer.files[0]));
removeImage.addEventListener('click',()=>{preview.src='';previewWrap.classList.add('hidden');uploadContent.classList.remove('hidden');fileInput.value='';status.textContent='Изображение удалено.'});

document.querySelectorAll('#types .chip').forEach(chip=>chip.addEventListener('click',()=>{document.querySelectorAll('#types .chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');}));
document.querySelectorAll('.swatch:not(.add-swatch)').forEach(s=>s.addEventListener('click',()=>selectSwatch(s)));
document.getElementById('saveVariant').addEventListener('click',()=>{const color=document.getElementById('modelColor').value.toUpperCase();if(getSwatchColors().includes(color.toLowerCase())){status.textContent='Такой цвет уже есть в вариантах.';return;}const s=document.createElement('button');s.type='button';s.className='swatch';s.style.setProperty('--swatch',color);s.dataset.color=color;s.setAttribute('aria-label','Вариант '+color);s.addEventListener('click',()=>selectSwatch(s));document.getElementById('swatches').insertBefore(s,document.getElementById('addSwatch'));selectSwatch(s);updateVariantHint();status.textContent='Цвет сохранён как новый вариант.';});
document.getElementById('addSwatch').addEventListener('click',()=>{const value=prompt('Введи HEX-цвет, например #d7b7d9');if(!value||!/^#[0-9a-fA-F]{6}$/.test(value.trim())){status.textContent='Нужен HEX-цвет формата #RRGGBB.';return;}const s=document.createElement('button');s.type='button';s.className='swatch';s.style.setProperty('--swatch',value.trim());s.dataset.color=value.trim();s.addEventListener('click',()=>selectSwatch(s));document.getElementById('swatches').insertBefore(s,document.getElementById('addSwatch'));selectSwatch(s);updateVariantHint();status.textContent='Новый swatch добавлен.';});
updateVariantHint();

function getData(){return{name:nameInput.value.trim()||'Новый предмет',type:document.querySelector('#types .chip.active').dataset.value,gender:document.getElementById('gender').value,age:document.getElementById('age').value,style:document.getElementById('style').value,category:document.getElementById('category').value,description:document.getElementById('description').value.trim(),swatches:document.querySelectorAll('.swatch:not(.add-swatch)').length};}
function addProject(data){const card=document.createElement('div');card.className='project-card';card.innerHTML='<div class="project-image"><span>NEW CC</span></div><div class="project-info"><p>'+data.type+' · '+data.gender+' · '+data.age+'</p><h3>'+escapeHtml(data.name)+'</h3><span>'+data.style+' · '+data.swatches+' swatches · Draft</span></div><button class="more" type="button">•••</button>';projectList.prepend(card);projectCount.textContent=projectList.querySelectorAll('.project-card').length+' проекта';}
function escapeHtml(value){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
document.getElementById('saveProject').addEventListener('click',()=>{localStorage.setItem('ccForgeProject',JSON.stringify(getData()));document.getElementById('projectState').textContent='SAVED';status.textContent='Проект сохранён в этом браузере.';});
document.getElementById('generate').addEventListener('click',()=>{const data=getData();if(!data.description&&previewWrap.classList.contains('hidden')){status.textContent='Добавь референс/текстуру или описание дизайна.';return;}addProject(data);document.getElementById('projectState').textContent='CONCEPT';status.textContent='Концепт создан. 3D-просмотр доступен ниже.';document.getElementById('forge3d').scrollIntoView({behavior:'smooth'});});

let scene,camera,renderer,controls,model=null,autoRotate=false,wireframe=false;
function init3D(){scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(45,viewport.clientWidth/viewport.clientHeight,.01,1000);camera.position.set(0,1.2,3.2);renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(viewport.clientWidth,viewport.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.appendChild(renderer.domElement);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,0);scene.add(new THREE.HemisphereLight(0xffffff,0x211a28,2.1));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,5,4);scene.add(key);const fill=new THREE.DirectionalLight(0xc9a6d6,1.4);fill.position.set(-4,2,2);scene.add(fill);const grid=new THREE.GridHelper(6,24,0x332c37,0x1b1820);scene.add(grid);animate();}
function animate(){requestAnimationFrame(animate);if(model&&autoRotate)model.rotation.y+=0.008;controls.update();renderer.render(scene,camera);}
function clearModel(){if(!model)return;scene.remove(model);model.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose&&m.dispose());}});model=null;}
function frameModel(object){const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),max=Math.max(size.x,size.y,size.z)||1;object.position.sub(center);const distance=max/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*0.65;camera.position.set(0,max*.45,distance);controls.target.set(0,0,0);controls.minDistance=max*.25;controls.maxDistance=max*5;controls.update();}
function showModel(object){clearModel();model=object;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.side=THREE.DoubleSide;});}}});scene.add(model);frameModel(model);viewportEmpty.classList.add('hidden');modelState.textContent='MODEL LOADED';document.getElementById('forge3d').scrollIntoView({behavior:'smooth'});status.textContent='3D-модель загружена.';}
async function loadModel(file){if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['glb','gltf','obj'].includes(ext)){status.textContent='Поддерживаются только GLB, GLTF и OBJ.';return;}if(file.size>30*1024*1024){status.textContent='3D-модель больше 30 MB.';return;}viewportLoading.classList.remove('hidden');modelState.textContent='LOADING';try{const url=URL.createObjectURL(file);if(ext==='obj'){showModel(await new OBJLoader().loadAsync(url));}else{showModel((await new GLTFLoader().loadAsync(url)).scene);} setRuntimeModel(file);URL.revokeObjectURL(url);}catch(error){console.error(error);modelState.textContent='LOAD ERROR';status.textContent='Не удалось открыть модель. Для GLTF лучше использовать .glb.';}finally{viewportLoading.classList.add('hidden');}}
modelInput.addEventListener('change',e=>loadModel(e.target.files[0]));

function applyModelColor(hex){
  if(!model||!hex)return;
  try{const color=new THREE.Color(hex);model.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if('color' in m){m.color.copy(color);m.needsUpdate=true;}});});}catch(e){console.error(e);}
}
function getSwatchColors(){return [...document.querySelectorAll('.swatch:not(.add-swatch)')].map(s=>s.dataset.color).filter(Boolean);}
function updateVariantHint(){const el=document.getElementById('variantHint');if(el)el.textContent=getSwatchColors().length+' цветовых варианта · выбранный цвет можно изменить ниже.';}
function selectSwatch(s){
  document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');
  const color=s.dataset.color||'#16131a';
  const picker=document.getElementById('modelColor');
  if(picker)picker.value=color;
  const value=document.getElementById('modelColorValue');if(value)value.textContent=color.toUpperCase();
  applyModelColor(color);
  status.textContent='Цвет применён к 3D-модели.';
}
const textureLoader=new THREE.TextureLoader();
function applyTexture(file){if(!model||!file)return;if(file.size>10*1024*1024){status.textContent='Текстура больше 10 MB.';return;}const url=URL.createObjectURL(file);textureLoader.load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;model.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.map=texture;m.needsUpdate=true;});});status.textContent='Текстура применена к 3D-модели.';URL.revokeObjectURL(url);},undefined,()=>{status.textContent='Не удалось загрузить текстуру.';URL.revokeObjectURL(url);});}
document.getElementById('modelColor').addEventListener('input',e=>{const color=e.target.value;document.getElementById('modelColorValue').textContent=color.toUpperCase();applyModelColor(color);});
textureInput.addEventListener('change',async e=>{projectRuntime.textureFile=e.target.files[0]||null;projectRuntime.textureMeta=await readImageMeta(projectRuntime.textureFile);if(!model){status.textContent='Сначала загрузи 3D-модель.';return;}applyTexture(e.target.files[0]);});

function setMaterials(prop,value){if(!model)return;model.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(prop==='wireframe')m.wireframe=value;else m[prop]=value;m.needsUpdate=true;});});}
const roughness=document.getElementById('roughness'),metalness=document.getElementById('metalness');
roughness.addEventListener('input',e=>{document.getElementById('roughnessValue').textContent=Number(e.target.value).toFixed(2);setMaterials('roughness',Number(e.target.value));});
metalness.addEventListener('input',e=>{document.getElementById('metalnessValue').textContent=Number(e.target.value).toFixed(2);setMaterials('metalness',Number(e.target.value));});
document.getElementById('toggleWireframe').addEventListener('click',e=>{wireframe=!wireframe;setMaterials('wireframe',wireframe);e.currentTarget.textContent=wireframe?'Обычный вид':'Wireframe';});
document.getElementById('resetView').addEventListener('click',()=>{if(model)frameModel(model);});
document.getElementById('frontView').addEventListener('click',()=>{if(!model)return;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),max=Math.max(size.x,size.y,size.z)||1;camera.position.set(0,max*.35,max*2.1);controls.target.set(0,0,0);controls.update();});
document.getElementById('autoRotate').addEventListener('click',e=>{autoRotate=!autoRotate;e.currentTarget.textContent=autoRotate?'Остановить вращение':'Автовращение';});
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();renderer.setSize(viewport.clientWidth,viewport.clientHeight);});
init3D();
document.querySelectorAll('#types .chip,#gender,#age,#style,#category').forEach(el=>el.addEventListener('change',()=>{const d=getData();const box=document.getElementById('casSummary');if(box)box.textContent=d.gender+' · '+d.age+' · '+d.category+' · '+d.style;}));
const saved=localStorage.getItem('ccForgeProject');if(saved){try{nameInput.value=JSON.parse(saved).name==='Новый предмет'?'':JSON.parse(saved).name;status.textContent='Найден сохранённый проект.';}catch(e){}}

const projectRuntime={modelFile:null,textureFile:null,textureMeta:null,lods:{LOD0:null,LOD1:null,LOD2:null,LOD3:null}};
function setRuntimeModel(file){projectRuntime.modelFile=file||null;}
function inspectModel(){
  if(!model)return {ok:false,message:'Модель не загружена.'};
  let meshes=0,materials=0,uv=0,normals=0,triangles=0;
  model.traverse(o=>{if(o.isMesh){meshes++;const mats=Array.isArray(o.material)?o.material:[o.material];materials+=mats.length;if(o.geometry.getAttribute('uv'))uv++;if(o.geometry.getAttribute('normal'))normals++;const pos=o.geometry.getAttribute('position');if(pos)triangles+=o.geometry.index?o.geometry.index.count/3:pos.count/3;}});
  return {ok:true,meshes,materials,uv,normals,triangles};
}
function checkRow(title,state,detail){
  const icon=state==='ok'?'✓':state==='warn'?'!':state==='error'?'×':'•';
  return '<div class="check-row '+state+'"><span class="check-dot">'+icon+'</span><div><strong>'+title+'</strong><small>'+escapeHtml(detail)+'</small></div></div>';
}
async function readImageMeta(file){
  return new Promise(resolve=>{if(!file){resolve(null);return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight,size:file.size,name:file.name});URL.revokeObjectURL(url)};img.onerror=()=>{resolve(null);URL.revokeObjectURL(url)}})
}
async function runValidation(){
  const data=getData(),m=inspectModel(),texture=projectRuntime.textureMeta||await readImageMeta(projectRuntime.textureFile);
  projectRuntime.textureMeta=texture;
  const rows=[];
  rows.push(checkRow('3D-модель',m.ok?'ok':'error',m.ok?m.meshes+' mesh · '+m.materials+' material · ~'+Math.round(m.triangles).toLocaleString('ru-RU')+' triangles':'Загрузите GLB, GLTF или OBJ.'));
  if(texture) rows.push(checkRow('Текстура',texture.width&&texture.height?'ok':'warn',texture.name+' · '+texture.width+'×'+texture.height+' · '+formatBytes(texture.size)));
  else rows.push(checkRow('Текстура','warn','Текстура не загружена.'));
  if(m.ok) rows.push(checkRow('UV / Normals',m.uv===m.meshes&&m.normals===m.meshes?'ok':'warn','UV: '+m.uv+'/'+m.meshes+' mesh · Normals: '+m.normals+'/'+m.meshes+' mesh'));
  else rows.push(checkRow('UV / Normals','neutral','Сначала загрузите модель.'));
  const casOk=!!data.type&&!!data.gender&&!!data.age&&!!data.category;
  rows.push(checkRow('CAS-настройки',casOk?'ok':'error',data.type+' · '+data.gender+' · '+data.age+' · '+data.category));
  document.getElementById('checkList').innerHTML=rows.join('');
  const errors=rows.filter(x=>x.indexOf('check-row error')!==-1).length;
  document.getElementById('validationState').textContent=errors?'NEEDS FIX':'CHECKED';
  document.getElementById('textureInfo').innerHTML=texture?'<strong>Текстура</strong><span>'+escapeHtml(texture.name)+' · '+texture.width+'×'+texture.height+' · '+formatBytes(texture.size)+'</span>':'<strong>Текстура</strong><span>Нет данных</span>';
  document.getElementById('casSummary').textContent=data.gender+' · '+data.age+' · '+data.category+' · '+data.style;
  status.textContent=errors?'Проверка завершена: есть обязательные пункты для исправления.':'Проверка завершена.';
}
function formatBytes(bytes){if(!bytes)return '0 B';const units=['B','KB','MB'];let i=0,n=bytes;while(n>=1024&&i<units.length-1){n/=1024;i++;}return n.toFixed(i?1:0)+' '+units[i];}
function updateLodCount(){document.querySelector('.prep-panel .counter').textContent=Object.values(projectRuntime.lods).filter(Boolean).length+' / 4';}
document.querySelectorAll('.lod-card input').forEach(input=>input.addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;projectRuntime.lods[e.target.dataset.lod]=file;document.getElementById(e.target.dataset.lod.toLowerCase()).textContent=file.name;updateLodCount();status.textContent=e.target.dataset.lod+' добавлен в проект.';}));
document.getElementById('runValidation').addEventListener('click',runValidation);
document.getElementById('exportProject').addEventListener('click',()=>{
  const data=getData(),m=inspectModel(),payload={tool:'CC Forge',version:'0.3',project:data,model:m.ok?{name:projectRuntime.modelFile?.name||'loaded',size:projectRuntime.modelFile?.size||null,meshes:m.meshes,materials:m.materials,uvMeshes:m.uv,normalsMeshes:m.normals,triangles:Math.round(m.triangles)}:null,texture:projectRuntime.textureMeta,lods:Object.fromEntries(Object.entries(projectRuntime.lods).map(([k,v])=>[k,v?{name:v.name,size:v.size}:null])),note:'JSON проекта и диагностика. Это не Sims 4 .package.'};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(data.name||'cc-forge-project').replace(/[^a-z0-9а-яё_-]+/gi,'-').toLowerCase()+'.json';a.click();URL.revokeObjectURL(url);status.textContent='Проект экспортирован в JSON.';
});


const aiPhotoInput=document.getElementById('aiPhotoInput'),aiPhotoPreview=document.getElementById('aiPhotoPreview'),aiPhoto=document.getElementById('aiPhoto'),aiDescription=document.getElementById('aiDescription'),aiResult=document.getElementById('aiResult'),aiResultState=document.getElementById('aiResultState'),applyDesign=document.getElementById('applyDesign');
let aiPhotoData=null,aiDesign=null;
aiPhotoInput.addEventListener('change',e=>{
 const file=e.target.files[0]; if(!file)return;
 if(file.size>10*1024*1024){status.textContent='Фото больше 10 MB.';return;}
 const reader=new FileReader(); reader.onload=()=>{aiPhotoData=reader.result;aiPhoto.src=aiPhotoData;aiPhotoPreview.classList.remove('hidden');status.textContent='Фото одежды добавлено.';};reader.readAsDataURL(file);
});
document.getElementById('removeAiPhoto').addEventListener('click',()=>{aiPhotoData=null;aiPhoto.src='';aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';});
document.getElementById('clearDesign').addEventListener('click',()=>{aiDescription.value='';aiPhotoData=null;aiPhotoPreview.classList.add('hidden');aiPhotoInput.value='';aiResult.innerHTML='<span class="ai-placeholder">Здесь появится структура дизайна: тип, силуэт, детали, цвета, материал и стиль.</span>';aiResultState.textContent='WAITING';applyDesign.classList.add('hidden');});
function inferDesign(text){
 const t=text.toLowerCase();
 const type=t.includes('плать')?'Платье':t.includes('юбк')?'Юбка':t.includes('брюк')?'Брюки':t.includes('шорт')?'Шорты':t.includes('куртк')?'Куртка':t.includes('свитер')?'Свитер':t.includes('футбол')?'Футболка':'Топ';
 const style=t.includes('гот')||t.includes('goth')?'Gothic':t.includes('y2k')?'Y2K':t.includes('кокет')?'Coquette':t.includes('street')?'Streetwear':t.includes('миним')?'Minimal':t.includes('casual')?'Casual':'Dark Feminine';
 const colors=['чёрн','черн','black'].some(x=>t.includes(x))?'Чёрный':t.includes('бел')?'Белый':t.includes('крас')||t.includes('бордов')?'Бордовый':t.includes('роз')?'Розовый':t.includes('зел')?'Зелёный':t.includes('син')?'Синий':'По референсу';
 const details=[];['длинн','коротк','открыт','цеп','шнур','кружев','карман','пугов','молни','асиммет','облега'].forEach(k=>{if(t.includes(k))details.push(k==='длинн'?'длинные элементы':k==='коротк'?'короткие элементы':k==='открыт'?'открытые зоны':k==='цеп'?'цепочки':k==='шнур'?'шнуровка':k==='кружев'?'кружево':k==='карман'?'карманы':k==='пугов'?'пуговицы':k==='молни'?'молния':k==='асиммет'?'асимметрия':'облегающий силуэт');});
 return {type,style,colors,details:details.length?details:['детали определяются по референсу'],source:aiPhotoData?'Фото + описание':'Описание'};
}
document.getElementById('analyzeDesign').addEventListener('click',()=>{
 const text=aiDescription.value.trim();
 if(!text&&!aiPhotoData){status.textContent='Добавь фото, описание или оба источника.';return;}
 aiDesign=inferDesign(text);
 aiResultState.textContent='READY';
 aiResult.innerHTML='<div class="design-summary"><div><b>Источник</b><span>'+escapeHtml(aiDesign.source)+'</span></div><div><b>Тип</b><span>'+aiDesign.type+'</span></div><div><b>Стиль</b><span>'+aiDesign.style+'</span></div><div><b>Цвет</b><span>'+aiDesign.colors+'</span></div><div><b>Детали</b><span>'+escapeHtml(aiDesign.details.join(', '))+'</span></div><div><b>Описание</b><span>'+escapeHtml(text||'Анализ по фотографии')+'</span></div></div>';
 applyDesign.classList.remove('hidden');status.textContent='Дизайн сформирован. Можно применить его к проекту.';
});
applyDesign.addEventListener('click',()=>{
 if(!aiDesign)return;
 const typeButton=[...document.querySelectorAll('#types .chip')].find(x=>x.dataset.value===aiDesign.type);if(typeButton){document.querySelectorAll('#types .chip').forEach(x=>x.classList.remove('active'));typeButton.classList.add('active');}
 const styleSelect=document.getElementById('style');const opt=[...styleSelect.options].find(x=>x.text.toLowerCase()===aiDesign.style.toLowerCase());if(opt)styleSelect.value=opt.text;
 if(aiDescription.value.trim())document.getElementById('description').value=aiDescription.value.trim();
 document.getElementById('create').scrollIntoView({behavior:'smooth'});status.textContent='Дизайн применён к проекту.';
});
