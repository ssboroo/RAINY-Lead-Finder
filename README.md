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

Имэйл+нууц үгээр бүртгүүлнэ. Password нь salted scrypt N=32768 hash, session нь серверт хадгалагдаж HttpOnly/SameSite cookie хэрэглэнэ. Нууц үг өөрчлөхөд бүх local session хаагдана. Админ хүсэлтийг шалгаад түр нууц үг оноож, local/Facebook хэрэглэгчийн хандалтыг хааж болно. Resend verification/reset-link adapter нэмэгдсэн; бодит API түлхүүр, баталгаажсан илгээгчээр идэвхжүүлнэ.

AsyncLocalStorage дахь server-authenticated tenant context-оор хэрэглэгч бүрийн state, revision, хайлтын явц/түүх, activity, SSE тусгаарлагдана. Tenant ID-г body/URL-оос авахгүй. Хуучин shared workspace болон хуучин activity нь зөвхөн admin-д үлдэнэ. Team invitation / нэг байгууллагын олон гишүүн хараахан нэмээгүй.

Facebook Login ашиглах бол App ID, Secret, одоо дэмжигдэж буй `vNN.0` Graph хувилбар, яг HTTPS origin тохируулна. Meta Dashboard-ийн Valid OAuth Redirect URI: `https://your-domain/auth/facebook/callback`. `FACEBOOK_PUBLIC_SIGNUP=false` үед app-scoped allowed ID-ууд л нэвтэрнэ; true бол public login зөвшөөрнө. Meta-ийн app mode/review шаардлагыг бодит dashboard дээр гүйцээнэ. Token-ийг server-side баталгаажуулж, хадгалахгүй. Facebook Login нь дурын постод comment бичих/хаалттай групп унших permission биш.

## Subscription ба төлбөр

Хэрэглэгч багц сонгоход snapshot үнэ, квот, хугацаатай нэхэмжлэх үүснэ. Банкны шилжүүлэг хийж лавлагаагаа илгээнэ. Админ банкны хуулгатай **гараар** тулгаж батална. Админы банкнаас шалгасан лавлагаа давтагдашгүй; нэг нэхэмжлэхийг хоёр удаа идэвхжүүлэхгүй. Хэрэглэгч өөрийн payment status эсвэл квотыг өөрчилж чадахгүй.

Эхний багцууд нь админ өөрчлөх **санал**: Starter ₮29000/300 API хүсэлт, Pro ₮79000/1500, Business ₮149000/3000, 30 хоног. Зардал/ашгаа бодитоор тооцож үнэ, квотыг өөрчилнө. Нэг API хүсэлт нэг lead гэсэн үг биш. Хайлтын нийлүүлэгч рүү илгээх бүрд сервер квотыг атомикаар хасна; expiry/quota дуусвал шинэ хүсэлт зогсоно. API алдаатай хариу ч нийлүүлэгч рүү илгээсэн хүсэлт тул тоологдоно.

Шинэ багц батлах үед хугацаа шинээр эхэлж, квот шинэчлэгдэнэ; хуучин үлдэгдэл шилжихгүй. QPay Merchant V2 adapter болон server-verified callback нэмэгдсэн; credentials байхгүй бол QPay товч харагдахгүй. Банкны шилжүүлгийг админ гараар батална. Автомат сарын суутгал, тусдаа card gateway/Wire.mn нэмээгүй.

## Гүн хайлт

1/6/24 цаг, 3/7/30 хоногийн сонголт. Brave Web Search `pd/pw/pm/custom range`, кирилл/латин хувилбар, extra snippets, pagination ашиглана. Quick: 10 хүсэлт/1 хуудас; Deep: 40/3; Maximum: 100/10. Хуудас бүр 20 хүртэл үр дүн. Энэ нь дээд хязгаар, lead олдох баталгаа биш.

1–6 цагийн сонголт нь `pd` API үр дүнг нийлүүлэгчийн өгсөн цагтай metadata-аар давхар шүүнэ. Огноогүй үр дүн оруулах эсэхээ сонгоно. Нийлүүлэгчийн огноо нь Facebook нийтэлсэн цагийн баталгаа биш. Индексжээгүй болон хаалттай пост олдохгүй.

Хайлт background ажиллаж, олдсон үр дүнг хуудас бүрээр хадгална. Зогсоож болно. Request timeout 20 секунд, хүсэлтийн зай 1.1 секунд. 401/402/403/429 дээр зогсоно; өмнө хадгалсан үр дүн үлдэнэ. Давхардсан mobile/desktop Facebook URL-ийг нэгтгэнэ. Нэг хэрэглэгчид 1, серверт нийт 3 зэрэг хайлт. Legacy interval нь admin workspace-д; tenant-scoped monitor нь багцын лимит/квотоор ажиллана.

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

## v1.1 — Хяналт, имэйл, нөөц, subscription

- Шинэ суулгалтын багцууд: Starter ₮29000/300 хүсэлт/1 хяналт, Pro ₮79000/1500/3, Business ₮149000/3000/5. Хуучин админы багцыг автоматаар дарж өөрчлөхгүй; админ шинэ утгуудаа тохируулна. Үнэ, API зардлын тооцоо `PRICING.md`-д.
- Нийлүүлэгчийн 2026-09-01 нөхцөлийг шалгахад persistent Search Results storage-д тусгай эрх шаардлагатай. Иймээс `BRAVE_STORAGE_RIGHTS=false` анхдагч: үр дүн 10 минутын санах ойн transient cache, tenant бүр 200 хүртэл, CRM/database/export/backup-д орохгүй. Хэрэглэгч эх пост руу орно. Эрхтэй гэрээгүй бол monitor үүсгэх/ажиллуулах хаалттай. Тусгай эрх/гэрээг баталгаажуулсан админ л true болгоно. Өмнө хадгалсан бодит API мэдээлэл байвал оператор өөрийн хадгалалтын эрхийг тусад нь шалгана; систем автоматаар хуучин хэрэглэгчийн өгөгдөл устгахгүй.
- Monitor-ууд persisted, tenant-scoped, хугацаа/квот/давтамж/багцын лимиттэй. Tick 30 секунд; run бүр 1 API хүсэлт хүртэл. Restart дараа due monitor-оос нэг удаа үргэлжлүүлнэ; алдагдсан interval бүрийг нөхөж бөөн запрос явуулахгүй. Шинэ үр дүнгийн тоо in-app notification болно. Monitor email alert нь local account-ийн баталгаажсан имэйл, хэрэглэгчийн opt-in, Resend холболттой үед ажиллана.
- Resend transactional REST adapter нэмсэн. Admin UI-д RESEND_API_KEY (encrypted), EMAIL_FROM, REQUIRE_EMAIL_VERIFICATION тохируулна. Зөвхөн баталгаажсан HTTPS origin + илгээгч + key + encryption master бүрэн үед ажиллана. Email queue encrypted payload, persistent retry, provider idempotency key, 15 секунд timeout. 4xx permanent failure, 429/5xx retry 4 хүртэл. Sent payload арилна.
- Signup verification болон forgotten-password request/redeem UI/API. Hash token серверт, raw token зөвхөн encrypted email payload-д; холбоос fragment хэрэглэж request log-д токен оруулахгүй. Reset 1 цаг, verification 24 цаг, single-use. Токен хүсэлт 3/цаг/account, endpoint rate limit 15/15мин/IP. REQUIRE_EMAIL_VERIFICATION=true үед баталгаажаагүй local хэрэглэгчийн API хэрэглээг хаана. Default false; имэйл холболтгүйгээр true болгохгүй.
- 6 цаг тутмын SQLite online snapshot → integrity_check → AES-GCM encrypted .enc файл; сүүлийн 7 хадгална. Админ snapshot үүсгэж/татаж авна. Local volume дээрх backup нь **offsite биш**. Restore: `SETTINGS_ENCRYPTION_KEY=... node restore-backup.mjs input.enc NEW-output.sqlite CURRENT-erasure-ledger.json`. Existing output-ийг дарж бичихгүй, active DB өөрчлөхгүй. Тусдаа scratch DB-д decrypt + integrity сэргээх туршилт тэнцсэн. Production active DB-г солихдоо service зогсоож, encryption key болон шаардлагатай snapshot-оо тусад нь хадгална.
- Admin Монгол хайлтын чанарын товч 10 түлхүүр үгийг тус бүр 1 бодит API хүсэлтээр шалгаж, source links/date coverage харуулна; report database-д орохгүй. Автомат тааралт нь бодит customer relevance-ийн хүний шалгалтыг орлохгүй.
- Railway Docker entrypoint зөвхөн mount directory-уудын ownership тохируулаад `node` хэрэглэгчээр ажиллуулна. Healthcheck `/health`, restart policy configured. Бодит credentials байхгүй integration-уудыг ажилласан гэж батлахгүй.


## v1.2 — Идэвхжүүлэх заавар

### Засвар, хайлтын чанар, хадгалалтын эрх
- Monitor нь хайлт бүрэн дуусахыг хүлээдэг. Partial/cancelled/failed үед last_error хадгалж retry товлоно.
- Түр сан дүүрвэл хуучныг гаргаж шинэ үр дүн оруулна. Пост тус бүрийн 10 минутын TTL нь шинэ batch-аар сунгагдахгүй; браузер ч хугацаа дууссан мөрийг арилгана.
- Админ → Монгол хайлтын чанар шалгах: эх посттой тулгаж relevant/irrelevant/unjudged, зохиогч/цагийг хүнээр шалгасан эсэхийг тэмдэглэнэ. Precision нь зөвхөн үнэлсэн жишээнээс тооцогдоно, recall/бүх Facebook-ийн хамралтын баталгаа биш.
- Жишээ transient UI-д 10 минут. Татах JSON нь зөвхөн нийлбэр тоо; snippet болон эх URL орохгүй.
- BRAVE_STORAGE_RIGHTS=true admin update-д BRAVE_STORAGE_REFERENCE шаардлагатай. Лавлагаа нь нийлүүлэгчийн бодит гэрээг орлохгүй. Эрхгүй үед хадгалалт ба monitor хаалттай; эрхтэй эх текст импортлох боломж хэвээр.
- Нөхцөл: https://api-dashboard.search.brave.com/documentation/resources/terms-of-service
- Хадгалалтын эрх: https://api-dashboard.search.brave.com/documentation/resources/help-feedback

### QPay Merchant V2
1. QPay мерчантын гэрээ, sandbox/production credentials, invoice code авна.
2. Админд QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE, 64 hex QPAY_CALLBACK_SECRET, яг HTTPS PUBLIC_BASE_URL тохируулна. QPAY_SANDBOX=true нь sandbox; production credentials-тай false болгоно.
3. Багцын нэхэмжлэх дээр QPay-аар төлөх товчоор provider QR, банкны deeplink гарна.
4. Callback нэхэмжлэхт холбогдсон HMAC token-той. Payload-ийн paid дүнд итгэхгүй; /v2/payment/check болон /v2/payment/{payment_id}-аар INVOICE ID, PAID, MNT, яг дүнг сервер тулгана. Нэг бүтэн төлбөртэй гүйлгээ шаарддаг; хэсэгчилсэн / валют зөрсөн төлбөр автоматаар зөвшөөрөгдөхгүй.
5. Callback давтагдсан ч квот дахин шинэчлэгдэхгүй. Төлөв шинэчлэх товч зөвхөн local DB уншина; provider payment/check cron/poll хийхгүй.
6. Invoice үүсгэх timeout нь uncertain төлөвтэй үлдэнэ. Давтан үүсгэхгүй. Админ provider dashboard-д sender_invoice_no-оор тулгаж support-той шийднэ; төлөв нь тодорхойгүй invoice-г шууд устган дахин үүсгэж болохгүй.
7. Банкны гараар баталгаажуулалт хэвээр. Тусдаа card gateway болон автомат сарын суутгал нэмээгүй.
8. Sandbox UAT, бодит callback, төлбөр/refund, санхүүгийн ажиллагааг оператор бодит эрхээр батална.
Лавлах: https://developer.qpay.mn/mn/docs/merchant?version=2.0.0

### Гадаад нөөц ба устгалын хамгаалалт
- BACKUP_REMOTE_URL нь тусдаа HTTPS storage directory; bearer token-той PUT + GET дэмжинэ. BACKUP_REMOTE_TOKEN серверийн secret. Энэ нь generic HTTPS adapter: S3 bucket шууд bearer PUT дэмжихгүй тул storage gateway/WebDAV adapter шаардлагатай. Redirect дагахгүй.
- AES-GCM .enc snapshot upload хийгээд GET-ээр буцаан уншиж хэмжээ, SHA-256 тулгаж байж verified болно. Upload/verify алдаа админд харагдана.
- Local snapshot хамгийн их 7 файл / 48 цаг. Remote storage-ийн lifecycle-д snapshot-ийг 48 цагийн дотор устгах дүрэм оператор заавал тохируулна; version-уудыг мөн удирдана.
- erasure-ledger.enc нь current устгалын хэшүүд: snapshot-ийн хугацааны устгалд хамруулахгүй. Шифрлэж тусдаа хадгалан, өөрчлөгдөхөд шинэчилж checksum шалгана. Алдаа бол дараагийн tick дахин оролдоно.
- SETTINGS_ENCRYPTION_KEY-ийг storage-оос тусад нь найдвартай хадгална. Админ → Устгалын жагсаалт татах товчоор JSON ledger авч тусад нь хадгалж болно.
- Restore:
  SETTINGS_ENCRYPTION_KEY=<key> node restore-backup.mjs snapshot.enc NEW-output.sqlite CURRENT-erasure-ledger.json
  Сүүлийн аргумент нь current erasure-ledger.enc ч байж болно. Хуучин snapshot доторх ledger хангалтгүй. Active service-ийг зогсоож, зөв ledger-ээр сэргээсэн DB-г шалгаад сольдог.

### Имэйл ба бүртгэл устгах
- Мэдэгдэл анхдагчаар OFF. Local account, баталгаажсан email, Resend ready үед хэрэглэгч Тохиргооноос идэвхжүүлнэ. Facebook account-д баталгаатай email байхгүй тул in-app мэдэгдэлтэй.
- Monitor run ID-д суурилсан encrypted idempotent queue; имэйлд шинэ үр дүнгийн тоо, нэвтрэх холбоос л орно.
- Өөрийн бүртгэлийг УСТГАХ гэж батална; local account одоогийн нууц үгээ оруулна. Bootstrap admin энэ endpoint-оор устахгүй.
- Идэвхтэй хайлт abort + await; дараа нь workspace, activity, monitor, notification, subscription, session, mail queue, token, account-ийг transaction-аар устгана. SSE хаагдана.
- Paid invoice-ийн нэргүй дүн/багц/огноо болон давтан гүйлгээ ашиглахаас хамгаалах лавлагааны хэш үлдэнэ.
- Хуучин backup шууд засварлагдахгүй, retention-аар арилна. Restore current ledger-ээр устгасан account-ийг дахин арилгана. Provider талын банк/QPay/Resend бүртгэлийг устгасан гэж амлахгүй.
- OPERATOR_NAME, SUPPORT_EMAIL-ийг бодит мэдээллээр тохируулна. /privacy, /data-deletion үүнийг харуулна.

### CI ба бодит холболтын шалгалт
- GitHub Actions: Node 24 syntax, unit/integration, npm audit; desktop/mobile viewport Chromium E2E.
- E2E: Монгол нэвтрэлт, CRM хадгалалт/reload, invoice, API дутуу үеийн хайлт, responsive layout, account deletion, human quality review, mocked QPay UI.
- QPay/offsite/Resend-ийг fake provider-оор шалгана. CI нь credentials, merchant гэрээ, DNS, хадгалалтын эрх, production deploy, live Brave relevance болон бодит iPhone/Safari QA-г орлохгүй.
