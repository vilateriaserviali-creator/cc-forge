const dropZone=document.getElementById('dropZone');
const fileInput=document.getElementById('fileInput');
const uploadContent=document.getElementById('uploadContent');
const previewWrap=document.getElementById('previewWrap');
const preview=document.getElementById('preview');
const removeImage=document.getElementById('removeImage');
const status=document.getElementById('status');
const projectList=document.getElementById('projectList');
const projectCount=document.getElementById('projectCount');
const nameInput=document.getElementById('name');

function showFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  if(file.size>10*1024*1024){status.textContent='Изображение больше 10 MB.';return;}
  const reader=new FileReader();
  reader.onload=()=>{preview.src=reader.result;uploadContent.classList.add('hidden');previewWrap.classList.remove('hidden');status.textContent='Изображение добавлено.';};
  reader.readAsDataURL(file);
}
fileInput.addEventListener('change',e=>showFile(e.target.files[0]));
['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>showFile(e.dataTransfer.files[0]));
removeImage.addEventListener('click',()=>{preview.src='';previewWrap.classList.add('hidden');uploadContent.classList.remove('hidden');fileInput.value='';status.textContent='Изображение удалено.'});

document.querySelectorAll('#types .chip').forEach(chip=>chip.addEventListener('click',()=>{
  document.querySelectorAll('#types .chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
}));

document.querySelectorAll('.swatch:not(.add-swatch)').forEach(s=>s.addEventListener('click',()=>{
  document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));
  s.classList.add('active');
  status.textContent='Основной цвет выбран.';
}));

document.getElementById('addSwatch').addEventListener('click',()=>{
  const value=prompt('Введи HEX-цвет, например #d7b7d9');
  if(!value || !/^#[0-9a-fA-F]{6}$/.test(value.trim())){status.textContent='Нужен HEX-цвет формата #RRGGBB.';return;}
  const s=document.createElement('button');
  s.type='button';s.className='swatch';s.style.setProperty('--swatch',value.trim());
  s.dataset.color=value.trim();
  s.addEventListener('click',()=>{document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});
  document.getElementById('swatches').insertBefore(s,document.getElementById('addSwatch'));
  status.textContent='Новый swatch добавлен.';
});

function getData(){
  return {
    name:nameInput.value.trim() || 'Новый предмет',
    type:document.querySelector('#types .chip.active').dataset.value,
    gender:document.getElementById('gender').value,
    age:document.getElementById('age').value,
    style:document.getElementById('style').value,
    category:document.getElementById('category').value,
    description:document.getElementById('description').value.trim(),
    swatches:document.querySelectorAll('.swatch:not(.add-swatch)').length
  };
}

function addProject(data){
  const card=document.createElement('div');
  card.className='project-card';
  card.innerHTML='<div class="project-image"><span>NEW CC</span></div>'+
    '<div class="project-info"><p>'+data.type+' · '+data.gender+' · '+data.age+'</p>'+
    '<h3>'+escapeHtml(data.name)+'</h3><span>'+data.style+' · '+data.swatches+' swatches · Draft</span></div>'+
    '<button class="more" type="button">•••</button>';
  projectList.prepend(card);
  projectCount.textContent=projectList.querySelectorAll('.project-card').length+' проекта';
}
function escapeHtml(value){
  return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

document.getElementById('saveProject').addEventListener('click',()=>{
  const data=getData();
  localStorage.setItem('ccForgeProject',JSON.stringify(data));
  document.getElementById('projectState').textContent='SAVED';
  status.textContent='Проект сохранён в этом браузере.';
});

document.getElementById('generate').addEventListener('click',()=>{
  const data=getData();
  if(!data.description && previewWrap.classList.contains('hidden')){
    status.textContent='Добавь референс/текстуру или описание дизайна.';
    return;
  }
  addProject(data);
  document.getElementById('projectState').textContent='CONCEPT';
  status.textContent='Концепт создан. AI, 3D mesh и экспорт .package подключим на следующих этапах.';
  document.getElementById('projects').scrollIntoView({behavior:'smooth'});
});

const saved=localStorage.getItem('ccForgeProject');
if(saved){
  try{
    const data=JSON.parse(saved);
    nameInput.value=data.name==='Новый предмет'?'':data.name;
    status.textContent='Найден сохранённый проект.';
  }catch(e){}
}
