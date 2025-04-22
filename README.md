
```
vendorse
├─ apps
│  ├─ api
│  │  ├─ .prettierrc
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
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.controller.ts
│  │  │  │  └─ dashboard.module.ts
│  │  │  ├─ file
│  │  │  │  ├─ file.controller.ts
│  │  │  │  ├─ file.module.ts
│  │  │  │  └─ file.service.ts
│  │  │  ├─ main.ts
│  │  │  └─ tender
│  │  │     ├─ tender.controller.ts
│  │  │     ├─ tender.module.ts
│  │  │     └─ tender.service.ts
│  │  └─ test
│  │     └─ app.e2e-spec.ts
│  └─ web
│     ├─ next.config.ts
│     ├─ public
│     │  ├─ file.svg
│     │  ├─ globe.svg
│     │  ├─ next.svg
│     │  ├─ vercel.svg
│     │  └─ window.svg
│     ├─ README.md
│     └─ src
│        └─ app
│           ├─ api
│           │  ├─ auth
│           │  │  └─ [...path]
│           │  │     └─ route.ts
│           │  ├─ dashboard
│           │  │  └─ stats
│           │  │     └─ route.ts
│           │  └─ tenders
│           │     └─ route.ts
│           ├─ bids
│           │  └─ page.tsx
│           ├─ components
│           │  ├─ AppLayout.tsx
│           │  └─ ProtectedRoute.tsx
│           ├─ contexts
│           │  └─ AuthContext.tsx
│           ├─ dashboard
│           │  └─ page.tsx
│           ├─ error.tsx
│           ├─ evaluations
│           │  └─ page.tsx
│           ├─ favicon.ico
│           ├─ globals.css
│           ├─ layout.tsx
│           ├─ login
│           │  └─ page.tsx
│           ├─ not-found.tsx
│           ├─ page.tsx
│           ├─ register
│           │  └─ page.tsx
│           └─ tenders
│              ├─ new
│              │  └─ page.tsx
│              └─ [id]
│                 └─ page.tsx
├─ packages
│  ├─ database
│  │  ├─ prisma
│  │  │  └─ schema.prisma
│  │  ├─ src
│  │  │  └─ index.ts
│  │  └─ tsup.config.ts
│  ├─ shared
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  └─ types.ts
│  │  └─ tsup.config.ts
│  └─ ui
│     ├─ src
│     │  ├─ components
│     │  │  ├─ BidForm.tsx
│     │  │  ├─ Button.tsx
│     │  │  ├─ FileUpload.tsx
│     │  │  ├─ Form
│     │  │  │  ├─ FormField.tsx
│     │  │  │  ├─ index.ts
│     │  │  │  ├─ Input.tsx
│     │  │  │  ├─ RadioGroup.tsx
│     │  │  │  ├─ Select.tsx
│     │  │  │  └─ TextArea.tsx
│     │  │  ├─ Form.tsx
│     │  │  ├─ TenderCard.tsx
│     │  │  └─ TenderEvaluation.tsx
│     │  └─ index.ts
│     ├─ tsconfig.tsbuildinfo
│     └─ tsup.config.ts
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
└─ README.md

```