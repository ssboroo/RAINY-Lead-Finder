import {test,expect} from '@playwright/test';
test('Mongolian login, CRM revision persistence, billing and search work on desktop and mobile',async({page},testInfo)=>{
 const failures=[];page.on('pageerror',error=>failures.push(error.message));
 await page.goto('/login');await page.locator('#username').fill('admin');await page.locator('#password').fill('browser-test-password-123');await page.locator('#signin').click();await expect(page.locator('#add')).toBeVisible();
 await page.locator('#add').click();await page.locator('#author').fill('Туршилтын хэрэглэгч');await page.locator('#url').fill('https://facebook.com/groups/1/posts/'+(testInfo.project.name==='desktop'?'101':'102'));await page.locator('#body').fill('Вебсайт хийлгэнэ. Үнийн санал авна.');
 await page.locator('#leadform button[type=submit], #leadform button.primary').first().click();await expect(page.locator('#editor')).not.toBeVisible();await page.reload();await expect(page.locator('#recent')).toContainText('Туршилтын хэрэглэгч');
 await page.evaluate(()=>document.querySelector('[data-view="billing"]').click());await expect(page.locator('#planlist')).toContainText('Starter');await page.locator('#planlist button').first().click();await expect(page.locator('#invoicelist')).toContainText('pending');
 await page.evaluate(()=>document.querySelector('[data-view="search"]').click());await expect(page.locator('#startpublic')).toBeDisabled();await expect(page.locator('#provider')).toContainText('тохируулаагүй');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(failures).toEqual([]);
});
