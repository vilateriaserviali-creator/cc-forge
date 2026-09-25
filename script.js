const dropZone=document.getElementById('dropZone');
const fileInput=document.getElementById('fileInput');
const uploadContent=document.getElementById('uploadContent');
const previewWrap=document.getElementById('previewWrap');
const preview=document.getElementById('preview');
const removeImage=document.getElementById('removeImage');
const description=document.getElementById('description');
const status=document.getElementById('status');
const newProjects=document.getElementById('newProjects');
const projectCount=document.getElementById('projectCount');

function showFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  if(file.size>10*1024*1024){status.textContent='Изображение больше 10 MB.';return;}
  const reader=new FileReader();
  reader.onload=()=>{preview.src=reader.result;uploadContent.classList.add('hidden');previewWrap.classList.remove('hidden');};
  reader.readAsDataURL(file);
}
fileInput.addEventListener('change',e=>showFile(e.target.files[0]));
['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>showFile(e.dataTransfer.files[0]));
removeImage.addEventListener('click',()=>{preview.src='';previewWrap.classList.add('hidden');uploadContent.classList.remove('hidden');fileInput.value='';});

document.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
}));

document.getElementById('generate').addEventListener('click',()=>{
  const text=description.value.trim();
  const category=document.querySelector('.chip.active').dataset.value;
  const style=document.getElementById('style').value;
  if(!text && previewWrap.classList.contains('hidden')){
    status.textContent='Добавь референс или опиши предмет.';
    return;
  }
  status.textContent='Концепт сформирован — это пока демонстрация интерфейса. Следующий этап подключит AI.';
  const card=document.createElement('div');
  card.className='project-card generated';
  card.style.marginTop='14px';
  card.innerHTML=`<div class="project-image"><span>NEW CC</span></div>
    <div class="project-info"><p>${category} · ${document.getElementById('age').value}</p>
    <h3>${text ? text.slice(0,30)+(text.length>30?'…':'') : 'Новый концепт'}</h3>
    <span>${style} · Concept</span></div><button class="more">•••</button>`;
  newProjects.prepend(card);
  projectCount.textContent='Проекты обновлены';
});
