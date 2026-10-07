# TODO — Update theo upstream (B' = update trong nhánh icekale)

- [x] Điều tra 3 nhánh: agegr = Next.js, mình = TanStack ⇒ B' (không chuyển framework).
- [x] Merge `upstream/main` (icekale v0.15.0 + pi 1.0.0) — conflict 2 file i18n, ghép cả hai bên.
- [x] `vi.ts` dịch thêm 25 khoá MCP mới → en=vi=848 khoá.
- [x] Sửa test do merge: inventory 52→53 route; regex `loadSession` 5-arg (upstream sửa code
      nhưng không sửa test của họ).
- [x] `npm install` (pi 1.0.0) → `tsc --noEmit` ✓ → `npm test` ✓ (1300/1303) → `lint` ✓ (0 lỗi).
- [x] `npm run build` ✓ (smoke test 79 route, 0 lỗi) → tarball `~/Code/pi-web-0.15.0.tgz`.
- [x] Cài global `@agegr/pi-web@0.15.0`; patch image-limit chạy đúng (marker trong 2 file).
- [x] Restart `pi-web.service` → `/` 200, Host 200, `/api/models` 200, locale `vi` giữ nguyên.
- [x] E2E: phiên mới gửi tin → pi 1.0.0 trả lời "OK" (file JSONL ghi đúng).
- [x] Gộp `main` + push `tvhdc/pi-web` (ddd7515..32fe150).

- [x] **Báo lỗi sau update: "Ẩn phần suy nghĩ và tool" không hoạt động** — nguyên nhân gốc:
      commit `42ae6cf` (speed up session loading) hạ cửa sổ tin tải ban đầu 80→20; cửa sổ 20 tin
      thường bắt đầu giữa lượt ⇒ không có mốc `user` ⇒ vòng gộp lượt không chạy (đã tái hiện:
      state 39 tin = assistant/toolResult, 0 user, 0 dòng gộp). Sửa: coi tin process đầu cửa sổ
      làm mốc ảo (`windowAnchorIdx`), live tail vẫn render thô khi đang chạy. Test mới + rebuild
      + cài + verify trình duyệt: session ngắn ✓, session dài 80 tin ẩn vẫn gộp "worked in 01:28" ✓,
      TẮT → 19 dòng "Processed" + thinking mở ✓. Push `e44c22b`.

## Việc còn lại (tách phiên khác)

- [ ] **3 test fail có sẵn từ nhánh icekale** (không phải do update — đã kiểm trên base):
      `session-reference.test.mjs` ×2 (đường dẫn ngoài allowed roots trả 200 thay vì 403 —
      đáng xem, liên quan bảo mật) và `AppShell.mobile-toolbar.test.mjs` (regex lệch code).
- [ ] (Tùy chọn) port feat từ agegr: nút lệnh extension trong status bar, đổi reasoning khi
      đang stream, phím gửi cấu hình được, Enable/Disable all Skills & Plugins.
- [ ] Rollback nếu cần: `npm i -g ~/Code/pi-web-0.14.7...` không đủ (thiếu 17 commit) —
      dùng `~/Code/pi-web-0.15.0.tgz` để giữ bản này, hoặc build lại từ git tag/commit cũ.
