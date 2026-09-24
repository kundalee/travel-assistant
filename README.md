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
    client.ts           # shared fetch client
    session.ts          # session storage
    auth.ts             # login / register / logout for all roles
    admin.ts  guide.ts  traveler.ts  partner.ts   # each portal's API interface + `api` export
    types/              # data types per portal
    mocks/              # sample data (and constants) used by the mock APIs
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
| `store.tsx` | Provider + hook (`useAdmin`, `useGuide`, …): the portal's profile, data and write actions (login state comes from `useAuth()`) |
| `pages/` | One file per screen (or group of small screens) |

The portal's backend contract lives in `src/api/<portal>.ts` (types in `src/api/types/<portal>.ts`, sample data in `src/api/mocks/<portal>.ts`). Each is currently a mock — implement it with `request()` from `src/api/client.ts` and swap the `api` export.

Backend seams: admin uses `create` / `update` / `remove` per collection; guide and traveler send every write through `api.send(action)` (a typed union of actions); partner has one method per operation.

## Shared code

- `src/components/` — UI used across portals: `Icon`, `Modal`, `toast` / `Toaster`, `PageHead`, `Field`, `SearchBox`, `Chips`, `Tabs`, `OptSingle` / `OptMulti`, `Empty`, `StatusGroups`, cart (`CartModal`, `CartBar`, `LocationAccordion`), trip info (`VideoModal`, `NotesModal`, `FlightModal`), `MapEmbed`, `Hl`. Import from `src/components`.
- `src/lib/` — `utils.ts` (format / search helpers), `orders.ts` (order statuses), `useTitle.ts`.
- `src/api/` — `client.ts`: `request()` (base URL from `VITE_API_BASE_URL`, bearer token via `setAuthToken`, throws `ApiError`); `session.ts`: session storage helper.

Icons come from `@tabler/icons-react`, but only the ones listed in `components/Icon.tsx` are bundled. To use a new icon, add it there; names are type-checked (`<Icon name="users" />`).

## Styles

`src/styles/base.css` is global (reset, icon sizing). The login modal has its own stylesheet (`app/auth/auth.css`), colored per portal. Each portal's stylesheet (`app/<portal>/<portal>.css`) is ported from its HTML prototype and scoped under `.portal-<name>` with native CSS nesting, so portals with the same class names never clash.
