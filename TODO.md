# TODO — Ghi nhớ lựa chọn theo model (HOÀN TẤT 07/10)

- [x] `lib/model-preferences.ts`: read/patch localStorage `pi-web:model-preferences`
      (key `provider/modelId` → `{thinkingLevel?, agentStyle?}`), SSR/quota safe.
- [x] `useAgentSession`: `desiredThinkingLevel` ưu tiên remembered > pin > highest;
      `handleThinkingLevelChange` ghi remembered cho `displayModel` (auto → xoá).
- [x] `ChatWindow`: persist kiểu khi đổi (`handleAgentStyleChange`) + khôi phục khi
      `displayModel` đổi (isNew, ref chống lặp).
- [x] Test: `lib/model-preferences.test.mjs` (6 unit) + `hooks/model-preference-memory.test.mjs`
      (2) + `components/ChatWindow.model-preferences.test.mjs` (2) — đều pass.
- [x] `tsc` ✓ · `npm test` 1311/1314 (3 fail là của bản cũ) · `lint` 0 lỗi.
- [x] Build + cài global 0.15.0 + restart 8504 (200).
- [x] Verify trình duyệt: EXL3=Low+Láo toét, MiMo=Med+Lite, đổi model khôi phục cả 2,
      F5 vẫn nhớ (localStorage `pi-web:model-preferences`).
- [x] Commit + push.

## Ghi chú hành vi

- Thứ tự ưu tiên mức thinking khi khôi phục: **người dùng > pin cấu hình > cao nhất hỗ trợ**;
  level riêng của phiên (trong file phiên) vẫn thắng khi mở phiên cũ.
- Model chưa từng chọn style: giữ nguyên style hiện tại (không reset về Mặc định).
- Chọn "Auto" cho mức thinking = xoá mức đã nhớ của model đó.
