# RAINY Lead Finder

Монгол интерфэйстэй, нэг байгууллагын lead хайлт ба хүсэлтийн самбар. Node.js 24, SQLite, нэмэлт npm dependency байхгүй.

## Ажиллуулах

1. `.env.example`-ийг `.env` болгож хуулна.
2. `APP_PASSWORD`-ийг 16-аас урт санамсаргүй нууц үгээр солино.
3. `BRAVE_SEARCH_API_KEY` тохируулна (автомат хайлт ашиглах бол).
4. `npm start`, дараа нь http://localhost:3000 нээнэ. Нэвтрэх нэр `admin`.
5. Facebook хайлт → **Одоо хайж lead цуглуулах** дарна. Дараа нь хүсэлтийн самбараас шалгаж, хариу бэлтгэнэ.

`SEARCH_INTERVAL_MINUTES=30` бол ажиллаж буй сервер 30 минут тутам хайна. Анхдагч утга 0, унтраалттай. Нэг удаад эхний 10 түлхүүр үг тус бүрээр 20 хүртэл үр дүн хүснэ; төлбөртэй API хэрэглээ үүсэж болно. Давхар ажиллахгүй, хайлтууд 60 секундийн зайтай. Алдаа болон хамгийн сүүлийн үр дүнг хадгална. Сервер унтарсан үед хуваарь ажиллахгүй.

## Юу хийдэг

- Brave Search Web API-аар `site:facebook.com` хайлт хийнэ; нийтийн индекст байгаа постын гарчиг, snippet-ийг авна.
- Сүүлийн сарын freshness шүүлт ашиглана. Энэ нь постын бодит нийтлэгдсэн огнооны баталгаа биш.
- Постын холбоосыг шалгаж, tracking параметрийг цэвэрлэн, давхардлыг арилгана.
- Түлхүүр үг болон хасах үгээр шүүнэ. Оноо нь дүрэмд суурилна; AI үнэлгээ биш.
- SQLite хадгалалт, хүсэлтийн төлөв, Монгол хариуны засварлах ноорог, CSV/JSON экспорт болон сэргээх.
- Бусдын постод хариугаа хуулж, эх постыг нээн, өөрөө нийтэлнэ.

## Хязгаар

Facebook нэвтрэлт, хаалттай групп унших, Facebook даяар бүрэн хайх, хувийн аккаунтаар автомат comment бичих холболт **байхгүй**. Нийтийн хайлтын индекс бүх постыг хамрахгүй; үр дүн хоосон байж болно. Lead нь хайлтын snippet бөгөөд бүтэн пост, зохиогчийн баталгаатай мэдээлэл биш. Meta Page-ийн comment API нь дурын групп дээр хувийн аккаунтаар бичих эрх олгохгүй.

Энэ нь нэг байгууллагын MVP. SaaS төлбөр, tenant isolation, олон хэрэглэгчийн эрх, email нэвтрэлт хараахан байхгүй. Хүсэлтийн өгөгдлийг localStorage-д хадгалахгүй. Хоёр таб зэрэг засахад revision зөрчлийг 409 алдаагаар мэдэгдэж, шинэ өгөгдлийг чимээгүй дарж бичихээс хамгаална. Зөрчил гарвал JSON нөөц татаж, серверийн хувилбарыг шинэчлэн, өөрчлөлтөө дахин нэгтгэнэ. Нийтэд нээхдээ HTTPS заавал ашиглана.

## Railway

Репог холбоод Dockerfile-оор deploy хийнэ. `APP_PASSWORD`, `BRAVE_SEARCH_API_KEY`, `DATA_DIR=/data` тохируулна. `/data` дээр persistent volume холбоно. Healthcheck `/health`. Нэг replica ажиллуулна (SQLite ба scheduler). Volume-гүй redeploy хийвэл өгөгдөл алдагдана. Нөөцийг JSON-оор татаж болно.

## Шалгалт

`npm test`; `node --check server.mjs`; `node --check public/app.js`; `node --check public/app.js`.

Brave API: https://api-dashboard.search.brave.com/app/documentation/web-search/get-started

## CRM ажлын урсгал

Тойм самбар дээр идэвхтэй хүсэлт, хугацаа болсон ажил, захиалга, бүртгэсэн борлуулалтын дүн харагдана. Хүсэлт бүр дээр эрэмбэ, тэмдэглэл, дараа холбогдох өдөр, боломжит үнийн дүн, архив нэмсэн. Огнооны хяналтыг Asia/Ulaanbaatar бүсээр хийнэ. Борлуулалтын самбарын карт дээр дарж төлөв шинэчилнэ. Олон хүсэлтийг сонгон архивлаж, эрэмбэ/төлөв/текстээр шүүж, CSV экспорт хийж болно. Хайлтын сүүлийн 50 ажиллагааны үр дүн, алдааг хадгална. Хугацаа сануулах нь зөвхөн самбар дээр харагдана; email эсвэл push мэдэгдэл биш.

## Facebook-ээр нэвтрэх

`/login` хуудас дээр Facebook болон админ нэвтрэлттэй. Facebook нэвтрэлт дараах environment тохиргоонууд бүрэн үед идэвхжинэ:

- `PUBLIC_BASE_URL=https://your-domain.example` — path-гүй, яг production origin.
- `FACEBOOK_APP_ID` болон `FACEBOOK_APP_SECRET` — Meta app-ын утгууд. Secret-ийг зөвхөн серверийн secret variable-д хадгална.
- `META_GRAPH_VERSION` — тухайн Meta App dashboard-аас одоо дэмжигдэж буй хувилбарыг сонгож `vNN.0` хэлбэрээр өгнө. Жишээн дэх NN нь бодит хувилбар биш.
- `FACEBOOK_ALLOWED_IDS` — энэ аппын app-scoped Facebook user ID-ууд, таслалаар тусгаарлана. Энэ нь нэг байгууллагын shared workspace тул дурын Facebook хэрэглэгчийг оруулахгүй. ID-г Meta-ийн тухайн app-аар авсан user token-ий `/me` үр дүнгээс админ авна.

Meta Dashboard → тухайн аппын Facebook Login web тохиргоонд **Valid OAuth Redirect URI**-г `https://your-domain.example/auth/facebook/callback` гэж яг тааруулна. App domain болон Website URL-ийг тохируулна. Public profile нэвтрэлт ашиглана; Page удирдах эсвэл comment бичих permission хүсэхгүй. Development горимд аппын зөвшөөрөгдсөн тест хэрэглэгчээр туршина. Нийтэд нээхэд Meta-аас шаардсан app mode, review, privacy/data-deletion нөхцөлүүдийг тухайн dashboard-ын шаардлагаар гүйцээнэ.

Authorization code солилцоо сервер дээр хийгдэнэ. Нэг удаагийн OAuth state, HttpOnly/SameSite cookie, app ID болон user ID token баталгаажуулалт, app-secret proof, ID allowlist, 8 цагийн серверийн session, logout нэмсэн. Facebook access token хадгалахгүй. Нууц үгийн форм rate limit-тэй. Админ `APP_PASSWORD` нөөц нэвтрэлт хэвээр. Basic API auth нийцтэй байдлаар хадгалагдсан; браузерийн форм нь cookie session хэрэглэнэ.

`/privacy`, `/data-deletion` хуудсууд тайлбарын эх загвар агуулна. Нийтэд нээхээс өмнө операторын бодит холбоо барих суваг болон устгалын үйл явцыг гүйцээнэ. `sessions` хүснэгтээс тухайн Facebook ID бүхий session-уудыг админ устгаж хандалтыг цуцална; allowlist-ээс мөн хасна. Апп устгасан Facebook webhook автомат боловсруулах холболт одоогоор байхгүй.

Meta-ийн үндсэн баримт:
https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/

OAuth тестүүд нь mock provider ашиглаж state/replay, app token, allowlist, session/logout-ийг шалгана. Бодит Meta App-аар нэвтрэх туршилтыг deployment болон credentials тохируулсны дараа хийнэ.
