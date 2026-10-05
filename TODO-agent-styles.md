# TODO — Kiểu AGENTS.md (agent styles)

- [x] 1. Viết SPEC + TODO.
- [x] 2. Khảo sát: luồng tạo phiên mới — `POST /api/agent/new` → `startRpcSession` → `resourceLoaderOptions`. (ornith down, tự làm)
- [x] 3. Khảo sát: SettingsPage section, i18n en/vi/zh-CN, route pattern, atomic-file. (tự làm)
- [x] 4. `lib/agent-styles.ts` (CRUD + validate) + test — 11/11 pass.
- [x] 5. `app/api/agent-styles/route.ts` (GET/POST/PUT/DELETE) + test — pass.
- [x] 6. `lib/rpc-manager.ts`: nhận `agentStyleContent` (noContextFiles + appendSystemPrompt); `app/api/agent/new` nhận `agentStyle` (400 nếu id lạ).
- [x] 7. UI: selector kiểu trong composer phiên mới (AppShell state → ChatWindow → ChatInput select).
- [x] 8. UI: section Settings CRUD + i18n keys (en/vi/zh-CN).
- [x] 9. `npx tsc --noEmit` + `npm test` (1296 pass / 3 fail có sẵn) + lint (0 lỗi mới).
- [x] 10. Build (77 routes, 0 failures) + cài + restart service 8504 (×2, ngoài lượt).
      Kiểm chứng trình duyệt: composer có select Default/Empty/Lite; Settings có section Edit/Delete/Add.
      Kiểm chứng E2E qua API: session Lite có nội dung kiểu + KHÔNG có AGENTS.md; session Empty KHÔNG có cả hai.
- [x] 11. commit.
- [x] 2b. Thêm env `PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT` vào systemd drop-in để worker background chạy được.

## V2 — chỉnh UI (05/10)
- [x] Composer: bỏ `<select>` khỏi toolbar → đưa vào menu "more" (mục "AGENTS.md style" + checkmark);
      helper `renderAgentStyleMenu()` để giữ toolbar JSX trong giới hạn test mobile grid (dropdownRef < 6000 ký tự).
- [x] Settings: danh sách card (tên + số ký tự + Pencil/Trash2), button "Thêm kiểu" primary,
      form trong `DialogShell size=editor`, xoá có confirm `DialogShell size=confirm`.
- [x] i18n thêm 5 keys (agentStyleCreate/EditTitle/DeleteTitle/DeleteQuestion/Chars) × 3 locale.
- [x] tsc xanh; test 1296 pass / 3 fail có sẵn; build 77 routes 0 failures; cài + restart 8504 (02:17:55).
- [x] Verify trình duyệt: desktop 1440×900 (menu more có mục style + Settings card/dialog/xoá);
      mobile 390×844 (toolbar gọn, menu more mở thấy mục style, không vỡ layout);
      CRUD UI end-to-end: tạo "Test UI" → hiện list → xoá confirm → Gone (API xác nhận).
- [x] Commit V2.

## V3 — Settings chỉ hiện nút Quản lý (05/10)
- [x] `AgentStylesSection` viết lại: tab General chỉ còn nút "Manage styles";
      dialog quản lý chứa 3 view (list → form → confirm) trong MỘT dialog, không chồng dialog.
- [x] i18n thêm `settings.agentStyleManage` × 3 locale.
- [x] Sửa test `lib/tanstack-package.test.mjs` (hỏng từ commit image-limit b513d25:
      staged package giờ có `scripts.postinstall`); suite 1296 pass / 3 fail có sẵn.
- [x] Build 77 routes 0 failures; cài + restart 8504 (09:37:22 ngoài lượt); http 200.
- [x] Verify trình duyệt 1440×900: tab chỉ có nút Manage; dialog list + Add;
      edit form trong dialog (Cancel/Save); delete confirm trong dialog (Cancel/Delete danger).
- [x] Commit + push.

## V4 — nút "Add style" gọn (05/10)
- [x] Nút Add style bị giãn full-width (icon tụt trái, text giữa) vì nằm trong column-flex
      (cross-axis) ⇒ `flex: 0 0 auto` không ăn ⇒ sửa `alignSelf: "flex-start"`.
- [x] Build 77 routes 0 failures; cài + restart 8504 (09:47:00 ngoài lượt); verify trình duyệt:
      nút gọn, icon+text cân, card list giữ full-width. Commit `115b477` + push.

## V5 — nút Add style xuống footer (05/10)
- [x] Bỏ nút Add style khỏi đầu danh sách → đặt vào footer, bên trái Cancel, bỏ icon `+`
      (bỏ luôn import `Plus` không còn dùng).
- [x] Test 1296 pass / 3 fail có sẵn; build 77 routes 0 failures; cài + restart 8504 (09:58:45).
- [x] Verify trình duyệt: footer [Add style xanh | Cancel], danh sách gọn phía trên. Commit + push.

## Kết quả cuối
Tính năng "Kiểu AGENTS.md" hoạt động: chọn Mặc định/Trống/kiểu-đã-lưu khi tạo phiên mới;
Settings thêm/sửa/xoá kiểu (lưu `~/.pi/agent-web/agent-styles.json`). Kiểu thay thế TOÀN BỘ
context files của phiên mới. Service 8504 đã chạy bản build mới.
