
```
vendorse
├─ apps
│  ├─ api
│  │  ├─ .prettierrc
│  │  ├─ dist
│  │  │  ├─ app.controller.d.ts
│  │  │  ├─ app.controller.js
│  │  │  ├─ app.controller.js.map
│  │  │  ├─ app.module.d.ts
│  │  │  ├─ app.module.js
│  │  │  ├─ app.module.js.map
│  │  │  ├─ app.service.d.ts
│  │  │  ├─ app.service.js
│  │  │  ├─ app.service.js.map
│  │  │  ├─ auth
│  │  │  │  ├─ auth.controller.d.ts
│  │  │  │  ├─ auth.controller.js
│  │  │  │  ├─ auth.controller.js.map
│  │  │  │  ├─ auth.module.d.ts
│  │  │  │  ├─ auth.module.js
│  │  │  │  ├─ auth.module.js.map
│  │  │  │  ├─ auth.service.d.ts
│  │  │  │  ├─ auth.service.js
│  │  │  │  ├─ auth.service.js.map
│  │  │  │  ├─ decorators
│  │  │  │  │  ├─ roles.decorator.d.ts
│  │  │  │  │  ├─ roles.decorator.js
│  │  │  │  │  └─ roles.decorator.js.map
│  │  │  │  ├─ guards
│  │  │  │  │  ├─ jwt-auth.guard.d.ts
│  │  │  │  │  ├─ jwt-auth.guard.js
│  │  │  │  │  ├─ jwt-auth.guard.js.map
│  │  │  │  │  ├─ roles.guard.d.ts
│  │  │  │  │  ├─ roles.guard.js
│  │  │  │  │  └─ roles.guard.js.map
│  │  │  │  └─ strategies
│  │  │  │     ├─ jwt.strategy.d.ts
│  │  │  │     ├─ jwt.strategy.js
│  │  │  │     └─ jwt.strategy.js.map
│  │  │  ├─ file
│  │  │  │  ├─ file.controller.d.ts
│  │  │  │  ├─ file.controller.js
│  │  │  │  ├─ file.controller.js.map
│  │  │  │  ├─ file.module.d.ts
│  │  │  │  ├─ file.module.js
│  │  │  │  ├─ file.module.js.map
│  │  │  │  ├─ file.service.d.ts
│  │  │  │  ├─ file.service.js
│  │  │  │  └─ file.service.js.map
│  │  │  ├─ main.d.ts
│  │  │  ├─ main.js
│  │  │  ├─ main.js.map
│  │  │  ├─ tender
│  │  │  │  ├─ tender.controller.d.ts
│  │  │  │  ├─ tender.controller.js
│  │  │  │  ├─ tender.controller.js.map
│  │  │  │  ├─ tender.module.d.ts
│  │  │  │  ├─ tender.module.js
│  │  │  │  ├─ tender.module.js.map
│  │  │  │  ├─ tender.service.d.ts
│  │  │  │  ├─ tender.service.js
│  │  │  │  └─ tender.service.js.map
│  │  │  └─ tsconfig.build.tsbuildinfo
│  │  ├─ eslint.config.mjs
│  │  ├─ nest-cli.json
│  │  ├─ package-lock.json
│  │  ├─ package.json
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ app.controller.spec.ts
│  │  │  ├─ app.controller.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ app.service.ts
│  │  │  ├─ auth
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ auth.module.ts
│  │  │  │  ├─ auth.service.ts
│  │  │  │  ├─ decorators
│  │  │  │  │  └─ roles.decorator.ts
│  │  │  │  ├─ guards
│  │  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  │  └─ roles.guard.ts
│  │  │  │  └─ strategies
│  │  │  │     └─ jwt.strategy.ts
│  │  │  ├─ file
│  │  │  │  ├─ file.controller.ts
│  │  │  │  ├─ file.module.ts
│  │  │  │  └─ file.service.ts
│  │  │  ├─ main.ts
│  │  │  └─ tender
│  │  │     ├─ tender.controller.ts
│  │  │     ├─ tender.module.ts
│  │  │     └─ tender.service.ts
│  │  ├─ test
│  │  │  ├─ app.e2e-spec.ts
│  │  │  └─ jest-e2e.json
│  │  ├─ tsconfig.build.json
│  │  └─ tsconfig.json
│  └─ web
│     ├─ .next
│     │  ├─ app-build-manifest.json
│     │  ├─ build-manifest.json
│     │  ├─ cache
│     │  │  ├─ .rscinfo
│     │  │  ├─ swc
│     │  │  │  └─ plugins
│     │  │  │     └─ v7_windows_x86_64_9.0.0
│     │  │  └─ webpack
│     │  │     ├─ client-development
│     │  │     │  ├─ 0.pack.gz
│     │  │     │  ├─ 1.pack.gz
│     │  │     │  ├─ 2.pack.gz
│     │  │     │  ├─ 3.pack.gz
│     │  │     │  ├─ index.pack.gz
│     │  │     │  └─ index.pack.gz.old
│     │  │     ├─ client-development-fallback
│     │  │     │  ├─ 0.pack.gz
│     │  │     │  ├─ 1.pack.gz
│     │  │     │  ├─ index.pack.gz
│     │  │     │  └─ index.pack.gz.old
│     │  │     └─ server-development
│     │  │        ├─ 0.pack.gz
│     │  │        ├─ 1.pack.gz
│     │  │        ├─ 2.pack.gz
│     │  │        ├─ 3.pack.gz
│     │  │        ├─ 4.pack.gz
│     │  │        ├─ 5.pack.gz
│     │  │        ├─ index.pack.gz
│     │  │        └─ index.pack.gz.old
│     │  ├─ package.json
│     │  ├─ react-loadable-manifest.json
│     │  ├─ server
│     │  │  ├─ app-paths-manifest.json
│     │  │  ├─ interception-route-rewrite-manifest.js
│     │  │  ├─ middleware-build-manifest.js
│     │  │  ├─ middleware-manifest.json
│     │  │  ├─ middleware-react-loadable-manifest.js
│     │  │  ├─ next-font-manifest.js
│     │  │  ├─ next-font-manifest.json
│     │  │  ├─ pages-manifest.json
│     │  │  ├─ server-reference-manifest.js
│     │  │  └─ server-reference-manifest.json
│     │  ├─ static
│     │  │  ├─ chunks
│     │  │  │  └─ polyfills.js
│     │  │  └─ development
│     │  │     ├─ _buildManifest.js
│     │  │     └─ _ssgManifest.js
│     │  ├─ trace
│     │  └─ types
│     │     ├─ cache-life.d.ts
│     │     └─ package.json
│     ├─ eslint.config.mjs
│     ├─ next-env.d.ts
│     ├─ next.config.ts
│     ├─ package-lock.json
│     ├─ package.json
│     ├─ postcss.config.mjs
│     ├─ public
│     │  ├─ file.svg
│     │  ├─ globe.svg
│     │  ├─ next.svg
│     │  ├─ vercel.svg
│     │  └─ window.svg
│     ├─ README.md
│     ├─ src
│     │  └─ app
│     │     ├─ bids
│     │     │  └─ page.tsx
│     │     ├─ components
│     │     │  ├─ AppLayout.tsx
│     │     │  └─ ProtectedRoute.tsx
│     │     ├─ contexts
│     │     │  └─ AuthContext.tsx
│     │     ├─ dashboard
│     │     │  └─ page.tsx
│     │     ├─ error.tsx
│     │     ├─ evaluations
│     │     │  └─ page.tsx
│     │     ├─ favicon.ico
│     │     ├─ globals.css
│     │     ├─ layout.tsx
│     │     ├─ login
│     │     │  └─ page.tsx
│     │     ├─ not-found.tsx
│     │     ├─ page.tsx
│     │     ├─ register
│     │     │  └─ page.tsx
│     │     └─ tenders
│     │        ├─ new
│     │        │  └─ page.tsx
│     │        └─ [id]
│     │           └─ page.tsx
│     └─ tsconfig.json
├─ package-lock.json
├─ package.json
├─ packages
│  ├─ database
│  │  ├─ .env
│  │  ├─ package-lock.json
│  │  ├─ package.json
│  │  ├─ prisma
│  │  │  ├─ migrations
│  │  │  │  ├─ 20250421101235_init
│  │  │  │  │  └─ migration.sql
│  │  │  │  └─ migration_lock.toml
│  │  │  └─ schema.prisma
│  │  └─ tsup.config.ts
│  ├─ shared
│  │  ├─ dist
│  │  │  ├─ index.d.mts
│  │  │  ├─ index.d.ts
│  │  │  ├─ index.js
│  │  │  ├─ index.js.map
│  │  │  ├─ index.mjs
│  │  │  └─ index.mjs.map
│  │  ├─ package-lock.json
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  └─ types.ts
│  │  ├─ tsconfig.json
│  │  └─ tsup.config.ts
│  └─ ui
│     ├─ dist
│     │  ├─ index.d.mts
│     │  ├─ index.d.ts
│     │  ├─ index.js
│     │  ├─ index.js.map
│     │  ├─ index.mjs
│     │  └─ index.mjs.map
│     ├─ package-lock.json
│     ├─ package.json
│     ├─ src
│     │  ├─ components
│     │  │  ├─ BidForm.tsx
│     │  │  ├─ Button.tsx
│     │  │  ├─ FileUpload.tsx
│     │  │  ├─ Form.tsx
│     │  │  ├─ TenderCard.tsx
│     │  │  └─ TenderEvaluation.tsx
│     │  └─ index.ts
│     ├─ tsconfig.json
│     ├─ tsconfig.tsbuildinfo
│     └─ tsup.config.ts
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml

```