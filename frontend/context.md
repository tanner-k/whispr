# frontend/

## Scope
- UI components, pages, routes
- Client-side state management
- Styles, assets, public files

## Not in scope
- Business logic → `backend/`
- Data models and migrations → `data/`
- Deployment / infrastructure → `infra/`

## Stack
React 18 + Vite + TypeScript

## Local skills / conventions
- None yet — add as needed

## Run
```bash
cd frontend
npm run dev
```

## Notes for agents
- Component files: one component per file, named in PascalCase
- Co-locate `Component.tsx` + `Component.test.tsx` + `Component.module.css`
- API calls go through a single client in `frontend/src/lib/api.ts` (do not fetch directly from components)
- Before adding a new dependency, check whether it duplicates something already in `package.json`
