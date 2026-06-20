# Cloudflare D1 Todo Demo

This is a small to-do list web app using:

- Cloudflare Pages for hosting
- Cloudflare Pages Functions for the API
- Cloudflare D1 for SQL storage
- GitHub as the source-code repo

## Cloudflare Pages settings

Use these settings when connecting the GitHub repo to Cloudflare Pages:

```txt
Production branch: master
Framework preset: None
Build command: leave blank
Build output directory: public
Root directory: /
```

## Required D1 binding

Create a Cloudflare D1 database named:

```txt
cloudflare-d1-todo-db
```

Then add this D1 binding to the Pages project:

```txt
Variable name: DB
D1 database: cloudflare-d1-todo-db
```

The API automatically creates the `todos` table on first request, so you do not need to manually run the SQL migration for this demo.

## API routes

```txt
GET     /api/todos
POST    /api/todos
PATCH   /api/todos
DELETE  /api/todos?id=1
```
