# TODO — Update theo agegr/pi-web

- [x] Điều tra: 3 remote, điểm chia 14/08, 366 commit agegr, 140 conflict khi merge, 6 file conflict khi cherry-pick.
- [x] SPEC cập nhật (SPEC-vi.md/TODO-vi.md là bộ cũ task tiếng Việt).
- [x] ⛔ TẠM DỪNG B — agegr = Next.js, nhánh mình = TanStack → người dùng chọn **B'**.
- [x] Xem 6 commit icekale: kèm nâng `pi-*` lên **1.0.0** (lock 200 dòng), thêm route `api/mcp`,
      bump v0.15.0; script `patch-pi-ai-image-limit` + postinstall là CỦA MÌNH (git giữ khi merge).
- [ ] Nhánh `update-0.15` ← merge `upstream/main`; resolve conflict dự kiến: `src/routeTree.gen.ts`,
      `lib/ui-locale.ts` + test.
- [ ] `npm install` (pi 1.0.0) → `npx tsc --noEmit` → `npm test` → `npm run lint`.
- [ ] `npm run build` (pack-tanstack).
- [ ] Cherry-pick 17 commit riêng, resolve conflict (AppShell, ChatWindow, SettingsPage, i18n…).
- [ ] Build + test: `npx tsc --noEmit`, `npm test`, `npm run lint`.
- [ ] (Tùy chọn) cherry-pick commit hay của icekale 6 commit mới nhất (speed session load…).
- [ ] Rebuild + cài global, kiểm tra cổng 8504 + UI vi + agent-styles.
- [ ] Cập nhật TODO này sau mỗi bước.
