# SPEC — Update pi-web theo upstream `agegr/pi-web`

## Hiện trạng (điều tra 07/10/2026 — CẬP NHẬT sau khi chuẩn bị làm B)

- ⚠️ **PHÁT HIỆN DỪNG LẠI:** `agegr/main` vẫn là **Next.js** (`next.config.ts`, script
  `next build --webpack`, dep `next@16.3.6`), trong khi nhánh của bạn (icekale) đã **chuyển sang
  TanStack Start** (`vite.tanstack.config.ts`, `scripts/pack-tanstack.mjs`, `bin/pi-web.js`, không
  `next.config.ts`). Hai nhánh khác **framework** hoàn toàn ⇒ "rebase lên agegr" = vứt TanStack +
  pipeline build/deploy đang chạy. **Không làm B nữa trừ khi người dùng xác nhận.**
- Cũng 07/10: base v0.14.7 của bạn = icekale v0.15.0-trừ-6-commit ⇒ **không phải bản cũ** theo nhánh
  của mình; 6 commit mới nhất (speed session load, MCP settings route…) cherry-pick được ngay.
- `agegr` = Next.js, pin `pi-* 1.0.0`; bạn = TanStack, `^0.99.1`.

- Repo: `/home/huy/Code/pi-web-icekale` — `origin` = `tvhdc/pi-web` (fork của bạn),
  `upstream` = `icekale/pi-web`, `agegr` = `agegr/pi-web`. Tree sạch, `main` = `origin/main`,
  chưa tạo nhánh mới (checkout `update-agegr` bị hủy, không có gì thay đổi).
- Bản đang chạy = build từ chính checkout này (`@agegr/pi-web@0.14.7`, global, cổng 8504),
  chứa đủ 17 commit riêng của bạn (agent-styles, vi i18n, usage line…).
- Điểm chia agegr ⇄ icekale: `77e482d` (14/08/2026, v0.8.8). Từ đó:
  - `agegr/main`: **+366 commit** (v0.10.0, "upgrade pi 1.0.0", ~153k dòng mới) — README icekale
    cũng ghi "This tree follows agegr/pi-web" ⇒ agegr là upstream thật.
  - `icekale/main` (gốc của bạn): **+387 commit** riêng (v0.15.0), **0 commit trùng patch** với agegr.
- Thử merge agegr vào main: **140 file conflict**. Thử cherry-pick 17 commit riêng lên gốc agegr:
  conflict ở commit đầu (6 file: AppShell, ChatWindow, SettingsPage, en/zh i18n).

## Mục tiêu

Đưa codebase về **gốc `agegr/main`** (upstream đang phát triển mạnh nhất), giữ nguyên các tweak riêng của
bản fork, rồi build + test + cài lại bản chạy thật.

## Ràng buộc

- **KHÔNG** đụng `main` / `origin/main` cho tới khi build+testpass trên nhánh mới.
- Giữ đủ 17 commit riêng (agent-styles, vi i18n 100%, usage line, placeholder, composer…).
- Build phải pass: `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Cài lại global phải xong mà server 8504 chạy lại được với dữ liệu cũ (không đổi cách tìm session).

## Phương án (chọn 1)

- **B (khuyến nghị)** — nhánh mới `update-agegr` từ `agegr/main`, cherry-pick 17 commit riêng,
  resolve conflict từng dòng, build/test, rồi mới cân nhắc gộp vào `main`.
  Mất: code riêng của nhánh icekale mà agegr không có (6 commit mới nhất + v0.9→v0.15 extras) —
  agegr có tương đương hầu hết tính năng đã kiểm (subagents, queue, worktrees, minimap).
- **A** — merge agegr vào `main` hiện tại: giữ mọi thứ nhưng tự giải 140 file conflict (rủi ro cao).
- **C** — giữ gốc, cherry-pick vài feat agegr lẻ: không "update" thật, MCP suite phụ thuộc infra lớn.

## Tiêu chí "xong" — KẾT QUẢ 07/10/2026 (đủ cả 4)

1. ✅ Merge `upstream/main` (v0.15.0 + pi 1.0.0); `vi` dịch đủ 25 khoá MCP mới (en=vi=848).
2. ✅ `tsc` / `npm test` (1300/1303 — 3 fail CÓ SẴN từ nhánh icekale, đã kiểm baseline) / `lint`.
3. ✅ Build + cài global 0.15.0 + restart 8504: 200 toàn bộ, locale vi, e2e trả lời OK.
4. ✅ Đã gộp `main` + push `tvhdc/pi-web`; rollback tarball: `~/Code/pi-web-0.15.0.tgz`.

Phương án B (rebase lên agegr/Next.js) ĐÃ BỎ — xem mục Hiện trạng. Việc còn lại: xem TODO.md.
