import {icon,enhanceControl} from './icons.js';

let fieldId=0;
function enhance(root){
  if(root.nodeType!==1&&root!==document)return;
  enhanceControl(root);
  root.querySelectorAll?.('button,a[data-icon],.empty,.loginfeature').forEach(enhanceControl);
  root.querySelectorAll?.('label:not([for])').forEach(label=>{
    if(label.querySelector('input,select,textarea'))return;
    const field=label.nextElementSibling;
    if(field?.matches('input,select,textarea')){if(!field.id)field.id='ui-field-'+(++fieldId);label.htmlFor=field.id}
  });
}
enhance(document);
const observer=new MutationObserver(records=>{
  const roots=new Set();
  for(const record of records){if(record.target.closest?.('svg'))continue;
    const control=record.target.nodeType===3?record.target.parentElement?.closest('button,a[data-icon]'):record.target.closest?.('button,a[data-icon]');if(control)roots.add(control);
    for(const node of record.addedNodes)if(node.nodeType===1&&!node.matches('svg,path'))roots.add(node);
  }
  roots.forEach(enhance);
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});

const menu=document.querySelector('#menutoggle'),sidebar=document.querySelector('#appsidebar'),backdrop=document.querySelector('#navbackdrop'),mobile=window.matchMedia('(max-width: 900px)');
function setNavigation(open,restoreFocus=true){
  if(!sidebar)return;open=mobile.matches&&open;
  document.body.dataset.navOpen=String(open);menu.setAttribute('aria-expanded',String(open));backdrop.hidden=!open;sidebar.inert=mobile.matches&&!open;
  if(open){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.querySelector('#closenav')?.focus()}
  else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(restoreFocus&&mobile.matches)menu.focus()}
}
if(menu&&sidebar){
  menu.addEventListener('click',()=>setNavigation(menu.getAttribute('aria-expanded')!=='true'));
  document.querySelector('#closenav').addEventListener('click',()=>setNavigation(false));backdrop.addEventListener('click',()=>setNavigation(false));
  sidebar.querySelector('nav').addEventListener('click',event=>{if(event.target.closest('[data-view]'))setNavigation(false,false)});
  mobile.addEventListener('change',()=>setNavigation(false,false));setNavigation(false,false);
  document.addEventListener('keydown',event=>{
    if(document.body.dataset.navOpen!=='true')return;
    if(event.key==='Escape'){event.preventDefault();setNavigation(false);return}
    if(event.key==='Tab'){const items=[...sidebar.querySelectorAll('button,a[href]')].filter(element=>!element.hidden&&element.getClientRects().length&&!element.disabled),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
  });
}
// Standalone pages share the icon and form system without depending on the workspace API.
document.querySelectorAll('.password-toggle').forEach(button=>button.addEventListener('click',()=>{
  const field=document.getElementById(button.dataset.field);const visible=field.type==='password';field.type=visible?'text':'password';button.setAttribute('aria-pressed',String(visible));button.textContent=visible?'Нуух':'Харуулах';
}));
export {icon};
