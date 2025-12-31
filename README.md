# Intro2SE_Group6

## Project Overview

This repository contains the code and documentation for the Intro to Software Engineering Group 6 project. The project focuses on developing a software solution to address the needs for a user-friendly but efficient and AI-powered project management tool.

## Run locally (essential steps)

Project code is in the `src` folder. The instructions below are generic and intended for anyone cloning the repository.

Requirements:
- Node 18+
- `pnpm` recommended (the project includes `pnpm-lock.yaml`).

Install and run (recommended with pnpm):

```powershell
# from the repository root
cd ./src
pnpm install
pnpm dev
```

Build and preview:

```powershell
# from the `src` folder
pnpm build
pnpm exec vite preview
```

If you prefer `npm`:

```powershell
# from the repository root
cd ./src
npm install
npm run dev
```

Clean install (start fresh):

```powershell
# from the repository root
cd ./src
Remove-Item -Recurse -Force node_modules
pnpm install
pnpm dev
```

Notes:
- Run these commands from the `src` directory (where `package.json` lives).
- Keep `pnpm-lock.yaml` to reproduce exact dependency versions.
