# TODO — Ngôn ngữ tiếng Việt (`vi`)

- [ ] 1. Dịch `lib/i18n/messages/vi.ts` (793 key, chia 5 phần theo mục của `en.ts`).
- [ ] 2. Đăng ký `vi`: `lib/i18n/types.ts`, `lib/i18n/registry.ts` (nhận `vi`, `vi-VN`),
      `lib/ui-locale.ts`, `hooks/useI18n.tsx`, `app/api/ui-locale/route.ts`.
- [ ] 3. Cập nhật test đang khoá danh sách ngôn ngữ: `lib/i18n/registry.test.mjs`,
      `lib/ui-locale.test.mjs`, `components/SettingsPage.test.mjs`, `components/GitChangesPanel.test.mjs`,
      `lib/i18n/messages/remote-i18n.test.mjs`, `components/SubagentSessions.test.mjs`.
- [ ] 4. Đếm key: `vi` phải bằng `en` (script so khớp).
- [ ] 5. `npx tsc --noEmit` + `npm test` + `npm run lint`.
- [ ] 6. Kiểm chứng bằng trình duyệt: chọn Tiếng Việt, chụp sidebar/chat/Settings.
- [ ] 7. Ghi `docs/i18n.md`; cập nhật `PRODUCT.md` nếu cần.
- [ ] 8. Build gói + cài + hẹn restart ngoài lượt; commit + push.

## Việc cũ (đã xong)

- [x] Công tắc "ẩn thinking và tool" + `worked in MM:SS` (xem lịch sử git).
- [x] Chuyển service 8504 sang bản fork, bucket hardlink, dọn sự cố "operation was aborted".
- [x] Ô nhập prompt dãn nhiều dòng (`flexBasis: auto`); placeholder rút gọn thành `Messages…`.
- [ ] (chưa làm) telemetry `PI_PERF_LOG` + metrics cho dashboard: bản fork không ghi.
