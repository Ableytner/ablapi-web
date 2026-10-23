# AblapiWeb

A Web frontend for interacting with the AblApi. This is basically a fancy curl wrapper.

This project is pure vibe-coded slop, no code in this repository should be trusted.

## Modules

After logging in you land on the **Dashboard** (`/dashboard`), which presents the
available modules as cards. Each card links to its own page:

| Card | Route | Description |
| --- | --- | --- |
| GTNH | `/gtnh` | View GTNewHorizons Minecraft modpack build versions, including daily and stable releases. |
| Minecraft | `/minecraft` | Discover and monitor Minecraft servers on the local network. |
| Willhaben | `/willhaben` | Manage Willhaben.at search configurations and monitoring. Only visible to users with the `WillhabenConfig` or `Admin` role. |

## GTNH build versions

The app includes a **GTNH** page (`/gtnh`) that shows build versions of the
[GTNewHorizons](https://gtnewhorizons.com/) Minecraft modpack. It displays the
**latest daily build**, the **latest stable build**, and lets you look up a
**specific daily run** by its run number. Each build shows its version, status,
and download links (client/server, with and without Java 8), and daily builds
link back to their GitHub run.

Build data is fetched from the AblApi backend:

- `GET {apiUrl}/gtnh/daily/latest`
- `GET {apiUrl}/gtnh/daily/{runNumber}`
- `GET {apiUrl}/gtnh/stable/latest`
- `GET {apiUrl}/gtnh/stable/{version}`

## Minecraft server monitor

The app includes a **Minecraft** page (`/minecraft`) that discovers Minecraft
servers on the LAN host `192.168.0.11` (ports `25566`–`25666`) and shows their
live status — MOTD (with color codes), player count, version, ping, and favicon —
as cards sorted by descending player count.

The scan is performed **server-side** by an Angular SSR (Node.js) server using the
[`minecraft-protocol`](https://github.com/PrismarineJS/minecraft-protocol) library.
The browser cannot open raw TCP sockets, so this must run on the Node server rather
than in the frontend.

- Endpoint: `GET /api/minecraft/scan`
- Discovered ports are cached for 24 h; live status (MOTD/players/ping) is always
  re-fetched. If a cached port stops responding, the cache is invalidated and a full
  rescan runs.

### Running locally

The scan endpoint is served by the **built Node server**, *not* by `ng serve`.

```bash
# Requires Node.js >= 22
npm install
npm run build
npm run start:server        # listens on http://localhost:4000 (or $PORT)
```

Then open <http://localhost:4000>. For UI-only development you can still use
`npm start` (`ng serve`), but the Minecraft scan will not work there.

## Willhaben

The app includes a **Willhaben** page (`/willhaben`) for managing
[Willhaben.at](https://www.willhaben.at) search configurations. You can create,
edit, and delete named search configs, each defining a keyword plus filters such
as category, price range, max distance (with a reference location), handover
types, allowed states, and must-include / must-exclude terms. A `Filter
Paylivery` option is also available. The card is only shown on the dashboard to
users with the `WillhabenConfig` or `Admin` role.

Configurations are stored via the AblApi backend:

- `GET {apiUrl}/willhaben/config`
- `POST {apiUrl}/willhaben/config`
- `POST {apiUrl}/willhaben/config/{name}`
- `DELETE {apiUrl}/willhaben/config/{name}`

## Docker

The `Dockerfile` builds the app and runs the Node SSR server (it serves the browser
assets, renders pages, and exposes the scan endpoint). It listens on port `8080`
inside the container and runs as the non-root `node` user (UID 1000);
`docker-compose.yml` maps `80:8080`.

```bash
docker compose up --build
```
