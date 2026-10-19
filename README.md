# RAINY Lead Finder

Монгол хэлтэй Facebook public-post discovery + CRM + subscription SaaS. Node.js 24, SQLite WAL, native JavaScript, SSE. Runtime npm dependency байхгүй.

Хэрэглэгч хайх үгээ бичиж нийтийн хайлтын индекст байгаа Facebook постуудыг олно. Эх постыг нээгээд Facebook дээр өөрөө харилцана. Page холбох, групп бүртгэх шаардлагагүй.

## Ажиллуулах

1. Node 24+ суулгана. `.env.example`-ийг `.env` болгож хуулна.
2. `APP_PASSWORD`-ийг 16+ тэмдэгттэй хүчтэй нууц үгээр тохируулна.
3. `SETTINGS_ENCRYPTION_KEY`-д 32-byte random key-ийн 64 hex тэмдэгтийг серверийн secret variable-аар өгнө. Үүсгэх: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. `PUBLIC_BASE_URL`-д deployment-ийн яг HTTPS origin өгнө. `DATA_DIR=/data`, persistent volume, нэг replica ашиглана.
5. `npm ci --ignore-scripts`, `npm start`. Local development: http://localhost:3000.
6. `/login`-д `admin` + `APP_PASSWORD`-оор нэвтэрнэ. **Админ удирдлага** дотроос API, банк, багцуудаа тохируулна.

Dockerfile нь Railway зэрэг Node/container hosting-д зориулсан. Healthcheck `/health`. Volume-гүй redeploy хийвэл өгөгдөл алдагдана. Production орчинд `NODE_ENV=production` болон HTTPS хэрэглэнэ. Production Basic auth анхдагчаар хаалттай; admin формын session ашиглана. Тусгай API automation-д `ADMIN_BASIC_AUTH=true`-г сервер дээр ил тод тохируулж болно.

## Админ тохиргоо

UI-аас Brave Search API түлхүүр, Facebook App ID/Secret, Graph API version, app-scoped Facebook allowlist, public signup, public origin, банк/данс/эзэмшигч, багцын үнэ/квот/хугацаа тохируулна. Brave холболтын шалгах товч нь 1 бодит API хүсэлт илгээнэ.

API secret-үүд `SETTINGS_ENCRYPTION_KEY`-ээр AES-256-GCM шифрлэгдэнэ. Secret утгуудыг GET API буцаахгүй. Хоосон secret талбар нь хуучин утгыг хадгална. DB override нь env-ээс давуу; `/api/admin/settings` PUT дотор `clear:true` өгвөл override устаж env утга дахин хэрэглэгдэнэ. Encryption key болон bootstrap админ нууц үгийг UI-аас солихгүй. Encryption key-гээ алдвал хадгалсан API secret-ийг сэргээх боломжгүй.

## Бүртгэл ба тусгаарлалт

Имэйл+нууц үгээр бүртгүүлнэ. Password нь salted scrypt N=32768 hash, session нь серверт хадгалагдаж HttpOnly/SameSite cookie хэрэглэнэ. Нууц үг өөрчлөхөд бүх local session хаагдана. Админ хүсэлтийг шалгаад түр нууц үг оноож, local/Facebook хэрэглэгчийн хандалтыг хааж болно. SMTP email verification/reset-link үйлчилгээ одоогоор холбогдоогүй.

AsyncLocalStorage дахь server-authenticated tenant context-оор хэрэглэгч бүрийн state, revision, хайлтын явц/түүх, activity, SSE тусгаарлагдана. Tenant ID-г body/URL-оос авахгүй. Хуучин shared workspace болон хуучин activity нь зөвхөн admin-д үлдэнэ. Team invitation / нэг байгууллагын олон гишүүн хараахан нэмээгүй.

Facebook Login ашиглах бол App ID, Secret, одоо дэмжигдэж буй `vNN.0` Graph хувилбар, яг HTTPS origin тохируулна. Meta Dashboard-ийн Valid OAuth Redirect URI: `https://your-domain/auth/facebook/callback`. `FACEBOOK_PUBLIC_SIGNUP=false` үед app-scoped allowed ID-ууд л нэвтэрнэ; true бол public login зөвшөөрнө. Meta-ийн app mode/review шаардлагыг бодит dashboard дээр гүйцээнэ. Token-ийг server-side баталгаажуулж, хадгалахгүй. Facebook Login нь дурын постод comment бичих/хаалттай групп унших permission биш.

## Subscription ба төлбөр

Хэрэглэгч багц сонгоход snapshot үнэ, квот, хугацаатай нэхэмжлэх үүснэ. Банкны шилжүүлэг хийж лавлагаагаа илгээнэ. Админ банкны хуулгатай **гараар** тулгаж батална. Админы банкнаас шалгасан лавлагаа давтагдашгүй; нэг нэхэмжлэхийг хоёр удаа идэвхжүүлэхгүй. Хэрэглэгч өөрийн payment status эсвэл квотыг өөрчилж чадахгүй.

Эхний багцууд нь админ өөрчлөх **санал**: Starter ₮29000/100 API хүсэлт, Pro ₮79000/500, Business ₮149000/1500, 30 хоног. Зардал/ашгаа бодитоор тооцож үнэ, квотыг өөрчилнө. Нэг API хүсэлт нэг lead гэсэн үг биш. Хайлтын нийлүүлэгч рүү илгээх бүрд сервер квотыг атомикаар хасна; expiry/quota дуусвал шинэ хүсэлт зогсоно. API алдаатай хариу ч нийлүүлэгч рүү илгээсэн хүсэлт тул тоологдоно.

Шинэ багц батлах үед хугацаа шинээр эхэлж, квот шинэчлэгдэнэ; хуучин үлдэгдэл шилжихгүй. Автомат сарын суутгал, QPay/Wire.mn/card API, webhook payment verification **холбогдоогүй**. Supported payment method: admin-reviewed bank transfer. Онлайн төлбөр шууд баталгааждаг мэт UI байхгүй.

## Гүн хайлт

1/6/24 цаг, 3/7/30 хоногийн сонголт. Brave Web Search `pd/pw/pm/custom range`, кирилл/латин хувилбар, extra snippets, pagination ашиглана. Quick: 10 хүсэлт/1 хуудас; Deep: 40/3; Maximum: 100/10. Хуудас бүр 20 хүртэл үр дүн. Энэ нь дээд хязгаар, lead олдох баталгаа биш.

1–6 цагийн сонголт нь `pd` API үр дүнг нийлүүлэгчийн өгсөн цагтай metadata-аар давхар шүүнэ. Огноогүй үр дүн оруулах эсэхээ сонгоно. Нийлүүлэгчийн огноо нь Facebook нийтэлсэн цагийн баталгаа биш. Индексжээгүй болон хаалттай пост олдохгүй.

Хайлт background ажиллаж, олдсон үр дүнг хуудас бүрээр хадгална. Зогсоож болно. Request timeout 20 секунд, хүсэлтийн зай 1.1 секунд. 401/402/403/429 дээр зогсоно; өмнө хадгалсан үр дүн үлдэнэ. Давхардсан mobile/desktop Facebook URL-ийг нэгтгэнэ. Нэг хэрэглэгчид 1, серверт нийт 3 зэрэг хайлт. Scheduler нь одоогоор зөвхөн admin workspace-д үйлчилнэ.

## CRM, өгөгдөл

Төлөв, эрэмбэ, тэмдэглэл, холбогдох өдөр, үнийн дүн, favorite, архив, CSV/JSON, засварлах хариуны 3 загвар. Buyer/seller/mixed/mention ангилал нь тайлбартай дүрэм, AI биш. Орлого нь гараар бүртгэсэн дүн, төлбөрийн баталгаажуулалт биш. Огнооны ажлын тооцоо Asia/Ulaanbaatar.

Хайлтын гарчиг нь Facebook хүний нэр биш. Нэр ирээгүй үед баталгаажаагүй гэж харуулна. Эх постын нэр/групп/бүтэн текстийг эрхтэй эх сурвалжаас импортолж болно:

`POST /api/import/posts` → `{"posts":[{"url":"https://facebook.com/groups/123/posts/456","authorName":"Нэр","groupName":"Группийн нэр","text":"Эх текст\nдараагийн мөр","publishedAt":"2026-10-19T12:00:00Z"}]}`

`publishedAt` optional, user-supplied timestamp. Нэг пост 100000 тэмдэгт, batch 100, нийт payload 5MB хүртэл. Unicode, мөр, зайг өөрчлөхгүй; HTML-ийг textContent-оор гаргана. Давхардсан холбоосыг шинэчлэхдээ CRM тэмдэглэл/төлөв хадгална. Facebook-ээс бие даан баталгаажуулсан гэж тэмдэглэхгүй.

SSE нь authenticated tenant-specific notification дамжуулна. Dirty form/dialog-ийг шинэ revision дарж өөрчлөхгүй; хадгалах үед revision conflict шалгана. Activity нь серверийн transaction дотор үүсэж, тухайн tenant-ийн сүүлийн 20000 event хадгална. Notes/body/reply text-ийн бүтэн хуулбарыг audit-д хадгалахгүй. Энэ нь tamper-proof compliance log биш.

JSON backup нь workspace л агуулна. Бүрэн database backup-д accounts, invoices, subscriptions, sessions, activity, encrypted settings, encryption key тусдаа нөөц хэрэгтэй. Нөөц хадгалах/сэргээх, хэрэглэгчийн устгалын operational процессыг оператор хариуцна. `/privacy`, `/data-deletion` хуудасны бодит операторын холбоо барих мэдээлэл/хадгалах бодлогыг нийтэд нээхээс өмнө гүйцээнэ.

## Шалгах

`npm test`, `node --check server.mjs`, `node --check public/app.js`, `npm audit --omit=dev`.

Unit/integration coverage: tenant state/activity/invoice isolation, admin authorization, quota/expiry, duplicate paid bank reference, encryption/masking, password/session revocation, OAuth state/token, SSE, date/pagination/cancel. Бодит browser/device QA, deployment, Meta Login, live Brave API болон банкны operational баталгаажуулалт хийгдээгүй. Эдгээрийг production readiness-ийн бүрэн баталгаа гэж үзэхгүй.

## Эх сурвалж

- https://api-dashboard.search.brave.com/app/documentation/web-search/get-started
- https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/
- Урсгалын судалгааны жишээ: Devi AI, RedReplier, Syften. Тэдгээртэй API интеграц хийгдээгүй.
