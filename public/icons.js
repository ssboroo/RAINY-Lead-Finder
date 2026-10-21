const paths = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  leads:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  columns:'M3 4h18v16H3z M9 4v16 M15 4v16 M5.5 8h1 M11.5 8h1 M17.5 8h1',
  search:'M21 21l-4.4-4.4 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
  chart:'M4 3v17h17 M8 15v-4 M13 15V7 M18 15v-6',
  history:'M3 11a9 9 0 1 1 2.5 7 M3 4v7h7 M12 7v5l3 2',
  card:'M3 5h18v14H3z M3 9h18 M7 14h3',
  shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-4.5',
  settings:'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  refresh:'M20 7a8 8 0 0 0-13-3L3 8 M3 3v5h5 M4 17a8 8 0 0 0 13 3l4-4 M21 21v-5h-5',
  logout:'M9 4H4v16h5 M9 12h12 M17 8l4 4-4 4',
  plus:'M12 5v14 M5 12h14',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  external:'M14 3h7v7 M21 3l-9 9 M10 3H4v17h17v-6',
  download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  archive:'M3 4h18v4H3z M5 8v13h14V8 M10 12h4',
  star:'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
  check:'M5 12l4 4L19 6',
  copy:'M8 8h12v13H8z M16 8V3H3v13h5',
  edit:'M16 3l5 5 M3 21l5-1 13-13-5-5L3 15z',
  save:'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2 M7 3v6h10V3 M7 21v-7h10v7',
  calendar:'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  mail:'M3 5h18v14H3z M3 6l9 7 9-7',
  menu:'M4 6h16 M4 12h16 M4 18h16',
  close:'M6 6l12 12 M18 6L6 18',
  folder:'M3 7V4h6l2 3h10v13H3z',
  inbox:'M4 4h16l2 13v3H2v-3z M2 15h6l2 3h4l2-3h6',
  spark:'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z',
  layers:'M12 3l10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  chevron:'M9 5l7 7-7 7',
  lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',
  filter:'M4 5h16 M7 12h10 M10 19h4',
  stop:'M6 6h12v12H6z',
  trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7'
};
export function icon(name, className='ui-icon') {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  for(const [key,value] of Object.entries({viewBox:'0 0 24 24',class:className,'aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,value);
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]||paths.layers);svg.append(path);return svg;
}
const actions=[[/^(Хайлт|Нийтийн пост хайх|Brave API)/,'search'],[/^(Хүсэлт нэмэх|Хяналт нэмэх)/,'plus'],[/^(Хадгал|Тохиргоо хадгалах|Багцууд хадгалах|Ноорог хадгалах)/,'save'],[/^(Шилжүүл|QPay|Багц сонгох|Төлбөр)/,'card'],[/^(Дэлгэрэнгүй|Нээх|Бүгдийг харах)/,'arrow'],[/^(Эх пост|Facebook дээр)/,'external'],[/^(CSV|JSON|Үнэлгээний тоон тайлан|Устгалын жагсаалт)/,'download'],[/^(Архив|Сонгосныг архивлах)/,'archive'],[/^(Хуулах)/,'copy'],[/^(Хариу бэлтгэх)/,'edit'],[/^(Зогсоох|Хайлтыг зогсоох)/,'stop'],[/^(Хяналт устгах|Устгах|Бүртгэлээ бүрмөсөн устгах)/,'trash'],[/^(Хадгалсан|Хадгалах)/,'star'],[/^(Нэвтрэх|Бүртгүүлэх|Гарах)/,'arrow'],[/^(Баталгаажуулах имэйл|Сэргээх холбоос|Нууц үг сэргээх)/,'mail']];
export function enhanceControl(element) {
  if(!element?.matches?.('button,a[data-icon],.empty,.loginfeature'))return;
  const label=element.textContent.trim().replace(/^[＋+⌕↓↻☆★✕♧]\s*/,'').replace(/\s*[↗→]$/,'');
  const name=element.dataset.icon||(/^[☆★]/.test(element.textContent.trim())?'star':null)||actions.find(([pattern])=>pattern.test(label))?.[1];if(!name)return;
  if(!element.dataset.icon)element.dataset.icon=name;
  // Only remove decorative glyphs from the control's own text; never touch badges or user content.
  for(const node of [...element.childNodes])if(node.nodeType===3){const clean=node.textContent.replace(/^[\s]*[＋⌕↓↻☆★✕♧]\s*/,'').replace(/\s*[↗→]\s*$/,'');if(clean!==node.textContent)node.textContent=clean}
  const existing=[...element.children].find(child=>child.classList.contains('ui-icon'));
  if(!existing)element.prepend(icon(name));
}
