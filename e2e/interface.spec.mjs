import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function login(page){await page.goto('/login');await page.locator('#username').fill('admin');await page.locator('#password').fill('browser-test-password-123');await page.locator('#signin').click();await expect(page.locator('#add')).toBeVisible()}
test('navigation is reachable, closes with Escape, and has one SVG icon per item',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await login(page);
 const menu=page.locator('#menutoggle');if(await menu.isVisible()){
  await menu.click();await expect(page.locator('#appsidebar')).toHaveAttribute('aria-modal','true');await expect(page.locator('#closenav')).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await expect(menu).toBeFocused();
  await menu.click();await page.locator('nav [data-view="billing"]').click();await expect(menu).toHaveAttribute('aria-expanded','false');
 }else await page.locator('nav [data-view="billing"]').click();
 await expect(page.locator('#billing')).toBeVisible();await expect(page.locator('nav [data-view="billing"]')).toHaveAttribute('aria-current','page');
 expect(await page.locator('nav button').evaluateAll(items=>items.every(item=>item.querySelectorAll('svg.ui-icon').length===1))).toBe(true);expect(errors).toEqual([]);
});
test('workspace fits narrow/tablet/wide layouts and dialog inputs are labelled',async({page})=>{
 await login(page);
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const view of ['overview','leads','pipeline','search','billing','settings','admin']){
   await page.evaluate(view=>document.querySelector('[data-view="'+view+'"]').click(),view);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),view+' at '+width).toBe(true);
  }
 }
 await page.locator('#add').click();await expect(page.locator('#editor')).toBeVisible();await expect(page.getByLabel('Facebook постын холбоос',{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#editor')).not.toBeVisible();
});
test('login and main workspace meet core WCAG accessibility checks',async({page})=>{
 await page.goto('/login');const loginResults=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(loginResults.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
 await login(page);const failures=[];
 for(const view of ['overview','search','settings','admin']){
  await page.evaluate(view=>document.querySelector('[data-view="'+view+'"]').click(),view);await expect(page.locator('#'+view)).toBeVisible();
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();for(const v of results.violations)failures.push({view,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))});
 }
 expect(failures).toEqual([]);
});
test('navigation requested while workspace loads is preserved',async({page})=>{
 let releaseWorkspace;const gate=new Promise(resolve=>releaseWorkspace=resolve);
 await page.route('**/api/workspace',async route=>{await gate;await route.continue()});
 await page.goto('/login');await page.locator('#username').fill('admin');await page.locator('#password').fill('browser-test-password-123');await page.locator('#signin').click();
 await expect(page.locator('#add')).toBeVisible();await page.waitForFunction(()=>typeof document.querySelector('[data-view="billing"]').onclick==='function');
 await page.evaluate(()=>document.querySelector('[data-view="billing"]').click());releaseWorkspace();
 await expect(page.locator('#billing')).toBeVisible();await expect(page).toHaveURL(/#billing$/);
});
