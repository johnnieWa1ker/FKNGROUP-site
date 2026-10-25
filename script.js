import { nativeLanguageNames, matchLocale } from './i18n.js';
const base = new URL('.', import.meta.url);
const key = 'fkngroup-site-language';
const supported = Object.keys(nativeLanguageNames);
let request = 0;
let language = 'en';
const dictionaries = new Map();
const fallback = Object.fromEntries([...document.querySelectorAll('[data-i18n]')].map(el=>[el.dataset.i18n,el.textContent]));
let saved;
try { saved=localStorage.getItem(key)||localStorage.getItem('fkncompany-public-language'); } catch { /* Preference storage is optional. */ }
function updateLinks(lang) {
 document.querySelectorAll('a[href]').forEach(a=>{
  const url=new URL(a.getAttribute('href'),location.href);
  if(url.origin===location.origin && url.pathname.startsWith(base.pathname)) {
   url.searchParams.set('lang',lang);a.href=url.href;
  }
 });
}
const pickers = new Map();
function enhancePicker(select) {
  if (!('showPopover' in HTMLElement.prototype)) return;
  const isLanguage = select.hasAttribute('data-language-select');
  const control = select.parentElement;
  const label = control.querySelector('[data-i18n]');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'picker-trigger';
  trigger.innerHTML = `<span class="picker-symbol" aria-hidden="true">${isLanguage ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg>' : ''}</span><span class="picker-value"></span><svg class="picker-chevron" aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>`;
  const panel = document.createElement('div');
  panel.className = 'picker-panel';
  panel.id = `picker-${pickers.size + 1}`;
  panel.setAttribute('popover','auto');
  panel.setAttribute('role','dialog');
  panel.innerHTML = '<div class="picker-heading"></div><div class="picker-search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" autocomplete="off" spellcheck="false"></div><div class="picker-options"></div>';
  const search = panel.querySelector('input');
  search.autofocus = true;
  const options = panel.querySelector('.picker-options');
  const empty = document.createElement('p');
  empty.className = 'picker-empty';
  empty.setAttribute('role','status');
  empty.hidden = true;
  panel.append(empty);
  // Associate the invoker so light-dismiss does not close the panel before
  // the same button's activation toggles it, accidentally reopening it.
  trigger.setAttribute('popovertarget',panel.id);
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-controls',panel.id);
  trigger.setAttribute('aria-expanded','false');
  document.body.append(panel);
  control.append(trigger);
  control.classList.add('picker-ready');
  select.hidden = true;
  const fold = value => value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
  function renderOptions() {
    const query = fold(search.value.trim());
    const matching = [...select.options]
      .filter(option => fold(`${option.text} ${option.value}`).includes(query))
      .sort((a,b) => Number(b.value === select.value) - Number(a.value === select.value));
    empty.hidden = matching.length !== 0;
    empty.textContent = dictionaries.get(language)?.noResults || 'No languages found';
    options.replaceChildren(...matching.map(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-option';
      button.setAttribute('aria-pressed',String(option.value === select.value));
      button.textContent = option.text;
      if (isLanguage) button.lang = option.value;
      button.dir = 'auto';
      button.addEventListener('click',() => {
        select.value = option.value;
        panel.hidePopover();
        trigger.focus();
        select.dispatchEvent(new Event('change',{bubbles:true}));
      });
      return button;
    }));
  }
  function position() {
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(360,innerWidth - 24);
    const below = innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const opensAbove = below < 300 && above > below;
    panel.style.width = `${width}px`;
    panel.style.left = `${Math.max(12,Math.min(document.documentElement.dir === 'rtl' ? rect.left : rect.right - width,innerWidth - width - 12))}px`;
    panel.style.maxHeight = `${Math.max(140,Math.min(460,opensAbove ? above : below))}px`;
    panel.style.top = opensAbove ? 'auto' : `${rect.bottom + 10}px`;
    panel.style.bottom = opensAbove ? `${innerHeight - rect.top + 10}px` : 'auto';
  }
  panel.addEventListener('beforetoggle',event => {
    if (event.newState !== 'open') return;
    search.value = '';
    renderOptions();
    position();
  });
  panel.addEventListener('toggle',event => trigger.setAttribute('aria-expanded',String(event.newState === 'open')));
  search.addEventListener('input',renderOptions);
  panel.addEventListener('keydown',event => {
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    if (event.target === search && event.key !== 'ArrowDown') return;
    const buttons = [...options.querySelectorAll('button')];
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  });
  window.addEventListener('resize',() => { if (panel.matches(':popover-open')) position(); });
  document.addEventListener('scroll',() => { if (panel.matches(':popover-open')) position(); },true);
  function sync() {
    const selected = select.selectedOptions[0];
    trigger.querySelector('.picker-value').textContent = selected?.text || '';
    trigger.setAttribute('aria-label',`${label.textContent}: ${selected?.text || ''}`);
    trigger.disabled = select.disabled;
    panel.setAttribute('aria-label',label.textContent);
    panel.querySelector('.picker-heading').textContent = label.textContent;
    search.setAttribute('aria-label',label.textContent);
    if (panel.matches(':popover-open')) renderOptions();
  }
  pickers.set(select,{sync});
  sync();
}
function syncPickers() { pickers.forEach(picker => picker.sync()); }


async function applyLanguage(next,{persist=false}={}) {
 if (!supported.includes(next)) return;
 const ticket=++request;
 try {
  if(!dictionaries.has(next)) {
   const response=await fetch(new URL(`locales/${next}.json`,base));
   if(!response.ok) throw new Error('Translation unavailable');
   const loaded = await response.json();
   // Reject malformed dictionaries before changing any of the current page.
   if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)
       || !['skip','home','heroBody','noResults',...Object.keys(fallback)].every(name =>
         Object.hasOwn(loaded,name) && typeof loaded[name] === 'string' && loaded[name].trim())) {
    throw new Error('Invalid translation');
   }
   dictionaries.set(next,loaded);
  }
  if(ticket!==request)return;
  const dictionary=dictionaries.get(next);
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=dictionary[el.dataset.i18n]??fallback[el.dataset.i18n];});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',dictionary[el.dataset.i18nAria]));
  document.querySelector('.skip-link').textContent=dictionary.skip;
  document.documentElement.lang=next;
  document.documentElement.dir=['ar','he'].includes(next)?'rtl':'ltr';
  document.querySelectorAll('[data-language-select]').forEach(el=>el.value=next);
  const title=document.querySelector('title');
  if(title.dataset.titleKey)title.textContent=`${dictionary[title.dataset.titleKey]} — FKNGROUP`;
  document.querySelector('meta[name="description"]').content=dictionary.heroBody;
  document.querySelector('meta[property="og:description"]').content=dictionary.heroBody;
  language=next; updateLinks(next); syncPickers();
  if(persist) {
   try {localStorage.setItem(key,next);} catch {}
   const url=new URL(location.href);url.searchParams.set('lang',next);history.replaceState(null,'',url);
   document.getElementById('language-status').textContent=nativeLanguageNames[next];
  }
 }catch {
  document.querySelectorAll('[data-language-select]').forEach(el=>el.value=language);
  syncPickers();
  // Keep the last successfully rendered language, including offline English HTML.
  document.getElementById('language-status').textContent=language==='en'?'Language unavailable. Please try again.':nativeLanguageNames[language];
 }
}
document.querySelectorAll('[data-language-select]').forEach(el=>el.addEventListener('change',()=>applyLanguage(el.value,{persist:true})));
document.querySelectorAll('[data-language-select]').forEach(enhancePicker);
const candidates=[new URL(location.href).searchParams.get('lang'),saved,...navigator.languages];
applyLanguage(candidates.map(value=>matchLocale(value,supported)).find(Boolean)||'en');
