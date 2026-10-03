# TODO — Tuỳ chọn "Giao diện thử nghiệm"

- [x] 1. `lib/experimental-ui-preference.ts` + hook `useExperimentalUiPreference` + test (mẫu hide-activity).
- [x] 2. Khoá i18n `settings.experimentalUi*` + `chat.agentPlaceholderExperimental` trong `lib/i18n/messages/{en,zh-CN,vi}.ts`.
- [x] 3. `SettingsPage.tsx`: section switch trong General; `AppShell.tsx`: sở hữu state, truyền props.
- [x] 4. Transcript: nhãn model 1 lần/lượt — gộp nhóm với timestamp (assistant cuối lượt) + streaming tail (`ChatWindow`).
- [x] 5. Transcript: ẩn dòng usage, toàn bộ số liệu đưa vào title hover (`MessageView`).
- [x] 6. Dòng trạng thái: bỏ trùng "Running" khi tool có progress (`phaseLabel` trong `ChatWindow`).
- [x] 7. Thinking: dấu ▸ (ChevronDown xoay, `ThinkingBlock` trong `MessageView`).
- [x] 8. Placeholder khi đang chạy: key mới, `ChatInput` (chỉ desktop, mobile giữ key cũ).
- [x] 9. Tự cuộn đáy: code ĐÃ có guard `isNearBottomRef` (detach khi cuộn lên, reattach trong 96px) — giữ nguyên, không sửa.
- [x] 10. Minimap: khi bật cờ render INSIDE row (rail có track, đúng chiều cao); tắt giữ vị trí cũ (`ChatWindow`).
- [x] 11. Timestamp transcript → tương đối cho user + assistant + compaction khi bật cờ (`formatRelativeTime`).
- [x] 12. Màu giờ sidebar đủ tương phản (gated, `color-mix(in srgb, var(--text-dim) 60%, var(--text))`).
- [x] 13. A11y vô hình (luôn áp dụng): `listitem` cho sidebar recent/projects, `role="progressbar"` + aria tròn (2 chỗ), `<h1>` trong TaskHeader + CSS; `html lang` đã có sẵn trong `useI18n`.
- [x] 14. `npx tsc --noEmit` ✔ · `npm test` 1288/1291 (3 fail có sẵn từ HEAD, đối chiếu bằng worktree HEAD sạch) · `npm run lint` 0 error.
- [x] 15. QA thật trên instance 30199: bật/tắt cờ, screenshot đối chiếu (`/tmp/piqa-on.png`, `/tmp/piqa-off.png`), axe 5 → 1 vi phạm.
- [ ] 16. Build + cài + hẹn restart ngoài lượt; commit.

## Kết quả QA (03/10/2026, instance 30199)

- Cờ ON: 1 nhãn model/lượt (3 lượt → 3 nhãn), usage ẩn + title, timestamp user + assistant
  tương đối, placeholder mới khi streaming (`Press Enter to queue a follow-up · Shift+Enter for
  a new line`), Thinking có ▸ (8/8), minimap rail đúng chiều cao khi transcript cuộn được /
  ẩn khi không cuộn được, h1 trong TaskHeader, switch Settings hiện + lưu localStorage.
- Cờ OFF: usage hiện đủ (11 dòng), nhãn model mỗi bước, không ▸, giờ absolute `08:26 PM` —
  khớp bản cũ từng像素.
- Lưu ý đã ghi nhận: dòng trạng thái nhân đôi "Running" chỉ xuất hiện khi tool có progress;
  đã sửa theo code (bỏ prefix `Running` trong progress, nối `·`).
