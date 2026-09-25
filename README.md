# TravelAssistant

React + TypeScript + Vite.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Portals & login

| URL | Portal | Self sign-up |
| --- | --- | --- |
| `/admin` | 後台管理 Admin | no (accounts created by an admin) |
| `/guide` | 領隊導遊 Tour leader | no (accounts created by an admin) |
| `/traveler` | 團員 Traveler | yes |
| `/partner` | 支援店家 Partner store | yes |

- One account system for everyone. An account can hold several roles (`roles: ['guide', 'traveler']`).
- The URL decides which role you enter as. Each portal shows the same login / register modal (`app/auth/AuthModal.tsx`) until the logged-in account has that role; if it doesn't, the modal offers the account's other portals or a switch of account.
- Logging in once covers every portal the account has a role for.
- `/` redirects to the last portal used (or the account's first role); logged out, it goes to `/traveler`.
- Roles are managed in 後台管理 → 使用者管理 (multi-select).

Demo accounts (mock mode; listed in the login modal):

| Email / password | Roles |
| --- | --- |
| `admin@example.com` / `admin1234` | admin |
| `guide@example.com` / `guide1234` | guide + traveler |
| `member@example.com` / `member1234` | traveler |
| `store@example.com` / `store1234` | partner |

## Structure

```
src/
  app/                  # the product: entry, routes, one folder per portal
    main.tsx            # entry point
    router.tsx          # "/", "/admin/*", "/guide/*", "/traveler/*", "/partner/*"
    auth/               # AuthProvider (shared login state), PortalGate (role check), AuthModal (login / register)
    admin/ guide/ traveler/ partner/
  api/                  # everything backend-facing
    client.ts           # call(): sends to the real or fake backend
    resource.ts         # resource() + get/post/put/patch/del/upload: declares endpoints
    endpoints.ts        # the list every resource() registers into
    auth.ts             # login / register / logout for all roles
    admin/ guide/ traveler/ partner/   # one file per resource (usersApi, ordersApi, …) + index.ts
    fake/               # in-browser fake backend
    types/              # data types per portal
    mocks/              # sample data (and constants) used by the fake backend
  components/           # shared UI
  lib/                  # pure helpers
  styles/base.css       # global styles
```

Rule: code outside `app/` never imports from `app/`.

Each portal is loaded on demand (its own JS + CSS chunk):

| File in `app/<portal>/` | Purpose |
| --- | --- |
| `<Portal>App.tsx` | Routes for the portal, mounted at `/<portal>/*` |
| `<portal>.css` | The portal's stylesheet, scoped under `.portal-<portal>` |
| `queries/` (admin: `queries.ts`) | TanStack Query hooks for the portal's server data: reads and writes. There are no data stores; login state comes from `useAuth()` |
| `store.tsx` | Traveler only: the group-buy cart (UI state kept across screens) |
| `pages/` | One file per screen (or group of small screens) |

Each endpoint is declared once, in the resource file for its group:

```ts
// src/api/traveler/orders.ts
export const ordersApi = resource('traveler.orders', '團員 · 訂單 Orders', {
  history: get<HistoryOrder[]>()('/traveler/orders', '歷史訂單'),
  pay:     post<TripOrder>()('/traveler/trips/:tourId/orders/:orderId/pay', '訂單付款', 'U'),
})

// in a page / store
await ordersApi.pay({ tourId, orderId })
```

The type arguments are `<response, request body>`. Path params (`:tourId`) are type-checked. C/R/U/D defaults from the method (GET = R, POST = C, PUT/PATCH = U, DELETE = D); pass it only for exceptions like `pay`. Use `upload()` for multipart endpoints. The fake backend implements the same declaration: `route(ordersApi.pay, handler)`.

The backend spec (request and response shapes, rules) is in [docs/API.md](docs/API.md). The generated endpoint index (112 endpoints by portal and group, with C/R/U/D) is in [docs/ENDPOINTS.md](docs/ENDPOINTS.md). Regenerate it with `npm run api:docs` after changing a resource file.

**Fake backend & going live gradually:** which server answers is decided per endpoint group (see `.env.example`):

| Settings | Result |
| --- | --- |
| no `VITE_API_BASE_URL` | every call is answered by the in-browser fake backend (`src/api/fake/`) |
| `VITE_API_BASE_URL` | every call goes to the real backend |
| `VITE_API_BASE_URL` + `VITE_API_REAL=auth,traveler.profile` | only the listed groups go to the real backend; the rest stay fake |

Every group key is the first argument of a `resource()` call. The **API** button at the bottom-left (shown whenever any group is fake) lists every endpoint by group, marks each group 真實 / 假, and counts calls. 複製清單 copies the list as a checklist. Every portal is wired this way: auth 7, traveler 28, guide 31, partner 7, admin 39 endpoints.

**Writes are server-first:** the screen changes only after the API succeeds, and only from its response, so the frontend never shows data the backend doesn't have. On failure, the server's message is shown, nothing changes, and forms or chat input keep what the user typed.
- **All portals use TanStack Query.** Server data lives in per-resource hooks: `src/app/<portal>/queries/`, and `src/app/admin/queries.ts` for admin. Reads are `useTrips()`, `usePoints()`, …; writes are mutation hooks like `useSavePoint()` or `useDeleteNotice(tourId)`. Each read is cached by its own key and refetched when stale, and screens load only what they need.
- A mutation's `onSuccess` writes the server's response into the cache (`setQueryData`), or invalidates what the server changed (e.g. chats after a campaign call, tours after deleting a place). Failed writes show one global toast (`src/app/queryClient.ts`). The cache is cleared whenever the logged-in user changes.
- Pages wrap query results in `<QueryState queries={[…]}>`, which shows 載入中… or an error with 重新載入.
- Admin reads several lists with `useAdminData('users', 'vendors', …)`, which returns the familiar `data` shape. Admin writes use `useCrud()`: `create` / `update` / `remove(key, …)`, looking up the record type's API through `editable` in `src/api/admin/index.ts`. Modals close only when the save succeeds.
- Buttons that write use `<AsyncButton onClick={() => someWrite()}>` from `src/components`. While the returned promise is pending, the button is disabled and shows a spinner, so double clicks can't send twice. The handler must **return** the promise. For writes started from something other than a button (file picker, checkbox), use `const [busy, run] = useBusy()`.
- Confirmations use `confirmDialog({ title, message, confirmLabel: '刪除', danger: true, onConfirm: () => remove(…) })`, never `window.confirm`. It opens a modal (rendered by `<ConfirmHost />` next to `<Toaster />`). The confirm button runs `onConfirm` with a loading state, and the dialog closes when it finishes.

## Shared code

- `src/components/` — UI used across portals: `Icon`, `Modal`, `toast` / `Toaster`, `PageHead`, `Field`, `SearchBox`, `Chips`, `Tabs`, `OptSingle` / `OptMulti`, `Empty`, `StatusGroups`, cart (`CartModal`, `CartBar`, `LocationAccordion`), trip info (`VideoModal`, `NotesModal`, `FlightModal`), `MapEmbed`, `Hl`. Import from `src/components`.
- `src/lib/` — `utils.ts` (format / search helpers), `orders.ts` (order statuses), `useTitle.ts`.
- `src/api/` — `client.ts`: `call()` (base URL from `VITE_API_BASE_URL`, bearer token via `setAuthToken`, throws `ApiError`); `resource.ts`: endpoint declarations; `storage.ts`: localStorage helper (keeps the login token).

Icons come from `@tabler/icons-react`, but only the ones listed in `components/Icon.tsx` are bundled. To use a new icon, add it there; names are type-checked (`<Icon name="users" />`).

## Styles

`src/styles/base.css` is global (reset, icon sizing). The login modal has its own stylesheet (`app/auth/auth.css`), colored per portal. Each portal's stylesheet (`app/<portal>/<portal>.css`) is ported from its HTML prototype and scoped under `.portal-<name>` with native CSS nesting, so portals with the same class names never clash.
