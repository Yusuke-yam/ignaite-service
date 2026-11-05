const extensions=['png','png','jpg','png','jpg','jpg','png','png','png','png','jpg','jpg','png','png','png'];
const track=document.getElementById('voice-track');
const dialog=document.getElementById('lightbox');
const large=document.getElementById('large-voice');
let lastTrigger;
for(let copy=0;copy<2;copy++){
  extensions.forEach((ext,index)=>{
    const button=document.createElement('button');
    button.type='button';button.className='voice-card';
    const path=`assets/voice-${String(index+1).padStart(2,'0')}.${ext}`;
    button.setAttribute('aria-label',`お客様のメッセージ ${index+1}を拡大`);
    if(copy){button.tabIndex=-1;button.setAttribute('aria-hidden','true');}
    const img=document.createElement('img');img.src=path;img.alt=`過去に支援した方からのLINEメッセージ ${index+1}`;img.loading='lazy';
    const caption=document.createElement('span');caption.textContent=`MESSAGE ${String(index+1).padStart(2,'0')}　 ↗ 拡大する`;
    button.append(img,caption);track.append(button);
    button.addEventListener('click',()=>{lastTrigger=button;large.src=path;large.alt=img.alt;document.getElementById('voice-caption').textContent=`過去に支援した方からのお声 ${index+1} / 15`;dialog.showModal();document.body.style.overflow='hidden';});
  });
}
function closeDialog(){dialog.close();}
dialog.querySelector('.close').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';lastTrigger?.focus({preventScroll:true});});
const motion=document.getElementById('motion');
motion.addEventListener('click',()=>{const paused=track.classList.toggle('paused');motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'再生 ▶':'一時停止 Ⅱ';});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){motion.hidden=true;}
