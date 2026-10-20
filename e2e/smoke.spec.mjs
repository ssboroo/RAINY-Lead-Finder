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

test('account deletion requires password, revokes session and removes login',async({page},testInfo)=>{
 const email='delete-'+testInfo.project.name+'@example.com',password='deletion-password-123';
 const signup=await page.request.post('/auth/register',{data:{name:'Устгах туршилт',email,password}});expect(signup.ok()).toBe(true);
 await page.goto('/#settings');await expect(page.locator('#deleteaccount')).toBeVisible();await page.locator('#deleteconfirm').fill('УСТГАХ');await page.locator('#deletepassword').fill('wrong-password');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#deleteaccountbutton').click();await expect(page.locator('#error')).toContainText('Нууц үг буруу');
 await page.locator('#deletepassword').fill(password);page.once('dialog',dialog=>dialog.accept());await page.locator('#deleteaccountbutton').click();await expect(page).toHaveURL(/\/login\?deleted=1/);
 expect((await page.request.get('/api/workspace')).status()).toBe(401);expect((await page.request.post('/auth/login',{data:{username:email,password}})).status()).toBe(401);
});
test('human quality review computes sample precision without exporting source content',async({page})=>{
 await page.route('**/api/admin/search-quality',route=>route.fulfill({json:{at:new Date().toISOString(),expiresAt:Date.now()+600000,judgment:'Хүнээр шалгана',report:[{query:'сайт',scanned:1,matches:1,withProviderDate:0,errors:[],sample:[{url:'https://facebook.com/groups/1/posts/999',snippet:'Вебсайт хийлгэх хүн хайж байна.'}]}]}}));
 await page.goto('/login');await page.locator('#username').fill('admin');await page.locator('#password').fill('browser-test-password-123');await page.locator('#signin').click();await expect(page.locator('#add')).toBeVisible();
 await page.evaluate(()=>document.querySelector('[data-view="admin"]').click());page.once('dialog',dialog=>dialog.accept());await page.locator('#qualitycheck').click();await expect(page.locator('#qualityreport')).toContainText('Үнэлээгүй');
 await page.locator('#qualityreport select').selectOption('relevant');await expect(page.locator('#qualityreport')).toContainText('100%');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Үнэлгээний тоон тайлан татах'}).click();const file=await downloaded,stream=await file.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const report=JSON.parse(Buffer.concat(chunks).toString());expect(report.precision).toBe(1);expect(JSON.stringify(report)).not.toContain('facebook.com');expect(JSON.stringify(report)).not.toContain('Вебсайт хийлгэх');
});
test('QPay QR, safe bank link and callback-driven local status render correctly',async({page})=>{
 let paid=false;
 await page.route('**/api/billing',route=>route.fulfill({json:{qpayEnabled:true,plans:[],subscription:{active:paid,remaining:paid?300:0,quota:300,plan:'Starter',expires:Date.now()+86400000},bank:{},invoices:[{id:'mock-invoice',amount:29000,status:paid?'paid':'pending'}]}}));
 await page.route('**/api/billing/qpay',route=>route.fulfill({json:{state:'ready',qrImage:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZGsAAAAASUVORK5CYII=',links:[{name:'Банкны апп',url:'bank://pay/1'}]}}));
 await page.route('**/api/billing/payment-status?*',route=>{paid=true;return route.fulfill({json:{status:'paid'}})});
 await page.goto('/login');await page.locator('#username').fill('admin');await page.locator('#password').fill('browser-test-password-123');await page.locator('#signin').click();await expect(page.locator('#add')).toBeVisible();
 await page.evaluate(()=>document.querySelector('[data-view="billing"]').click());await page.getByRole('button',{name:'QPay-аар төлөх'}).click();await expect(page.getByAltText('QPay төлбөрийн QR')).toBeVisible();await expect(page.getByRole('link',{name:'Банкны апп'})).toHaveAttribute('href','bank://pay/1');
 await page.getByRole('button',{name:'Төлбөрийн төлөв шинэчлэх'}).click();await expect(page.locator('#subscriptionstatus')).toContainText('Багц идэвхтэй');
});

test('duplicate signup error stays beside the form and offers login/reset recovery',async({page},testInfo)=>{
 const email='duplicate-'+testInfo.project.name+'@example.com';
 expect((await page.request.post('/auth/register',{data:{name:'Existing',email,password:'existing-password-123'}})).ok()).toBe(true);
 await page.request.post('/auth/logout',{data:{}});
 await page.goto('/login');await page.locator('#signupsection summary').click();await page.locator('#registername').fill('Duplicate');await page.locator('#registeremail').fill(email);await page.locator('#registerpassword').fill('different-password-123');await page.locator('#registerbutton').click();
 await expect(page.locator('#registererror')).toBeVisible();await expect(page.locator('#registererror')).toContainText('бүртгэлтэй');await expect(page.locator('#registerrecovery')).toBeVisible();
 await page.locator('#registersignin').click();await expect(page.locator('#username')).toHaveValue(email);await expect(page.locator('#password')).toBeFocused();
 await page.locator('#registerreset').click();await expect(page.locator('#forgotemail')).toHaveValue(email);await expect(page.locator('#forgotemail')).toBeVisible();
});
test('closed signup is communicated before submitting the form',async({page})=>{
 await page.route('**/auth/config',route=>route.fulfill({json:{facebookEnabled:false,signupEnabled:false}}));
 await page.goto('/login');await page.locator('#signupsection summary').click();await expect(page.locator('#signupnotice')).toContainText('бүртгэл хаалттай');await expect(page.locator('#registerbutton')).toBeDisabled();
});
