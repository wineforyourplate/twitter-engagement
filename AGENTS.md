# Building this Lemma pod

This directory is a **pod bundle**: plain files imported with `lemma pods import`.
The bundle is the source of truth. Edit files, then re-import.

## Layout (folder name MUST equal each resource's `name`)
```
x-teammate/
  pod.json
  tables/<name>/<name>.json
  functions/<name>/<name>.json + code.py     # JSON carries permissions.grants
  agents/<name>/<name>.json    + instruction.md
  workflows/<name>/<name>.json
  schedules/<name>/<name>.json
  surfaces/<platform>/<platform>.json
  files/<folder>/.folder.json
```

## Scaffold more resources (then edit them)
```bash
lemma table init <name>        # tables/<name>/<name>.json
lemma function init <name>     # functions/<name>/<name>.json + code.py
lemma agent init <name>        # agents/<name>/<name>.json + instruction.md
lemma workflow init <name>     # workflows/<name>/<name>.json
```

## Rules that bite
- **Zero access by default.** Grant every table/folder/app an agent or function
  touches via `permissions.grants` in its JSON.
- Files referenced as `{"$file": "code.py"}` / `{"$json_file": "config.json"}`
  load from sibling files. Bundle JSON may contain `//` and `/* */` comments.
- Build order: tables -> files -> functions -> agents -> workflows -> schedules
  -> surfaces -> apps. Verify each layer before the next.
- `lemma pods import . --dry-run` validates everything without writing.

## This pod
- Timed schedules can't run more often than every 15 minutes on lemma.work.
- `on` is a reserved column name (we use `searches.active`); tables take no top-level `description`
  (it lives in a `//` comment at the top of each table file); workflows take no `run_title`.
- Kite's notes live in `files/skills/<name>/SKILL.md` (the layout Lemma's own templates use) and are published to `/skills` by `scripts/publish-skills.sh`. The GitHub import writes them into `/skills` (tested 17 Nov 2026). A CLI `pods import ./files --with-files` into a pod that already has `/skills` fails on the folder's metadata ("System skills are read-only"), so locally use `scripts/publish-skills.sh`.
- Lemma rebuilds the app with pnpm on import; `apps/x-teammate/source/pnpm-workspace.yaml` must keep allowing esbuild's install script, or the import's app build fails.
- `schedules/clock` is a template and must stay `is_active: false`. The app copies it per person.
- The dev server bakes `VITE_LEMMA_*` into Vite's dependency cache: after changing `.env*`, delete
  `apps/x-teammate/source/node_modules/.vite` and restart.
- `npm run dev` talks to a real pod. It never creates a clock unless the URL has `?clock`.
