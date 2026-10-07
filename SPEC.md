# SPEC — Ghi nhớ lựa chọn THEO MODEL (mức thinking + kiểu AGENTS.md)

## Hiện trạng

- Mức thinking đổi model: `desiredThinkingLevel()` (hooks/useAgentSession.ts) chỉ có
  pin cấu hình (`:level` trong enabledModels) → mức **cao nhất model hỗ trợ** →
  lựa chọn người dùng chọn tay **không được nhớ** ⇒ "tự nhảy sang thinking khác".
- Kiểu AGENTS.md (`newSessionAgentStyle` ở AppShell) = state RAM, chỉ có ở trang
  phiên mới, mất khi tải lại trang; không gắn với model.

## Mục tiêu

1. Chọn tay mức thinking cho model nào ⇒ nhớ cho đúng model đó (khoá `provider/modelId`,
   localStorage `pi-web:model-preferences`). Ứng lại khi: đổi model sang model đó,
   mở phiên không có level riêng, refresh danh sách model.
2. Chọn kiểu AGENTS.md ở phiên mới ⇒ nhớ theo model đang chọn; đổi model trong
   composer phiên mới thì khôi phục đúng kiểu đã lưu của model đó; F5 vẫn còn.
3. Thứ tự ưu tiên mức thinking khi khôi phục: **lựa chọn người dùng > pin cấu hình >
   mặc định (cao nhất hỗ trợ)**. Level riêng của phiên (đã ghi trong file phiên) vẫn thắng.

## Ràng buộc

- KHÔNG sửa server; chỉ client (lib mới + useAgentSession + ChatWindow).
- Giữ nguyên các chuỗi mà test đang khoá (xem `hooks/model-switching.test.mjs`,
  `hooks/model-scope-startup.test.mjs`, `hooks/useAgentSession.test.mjs`).
- SSR-safe: không đụng `window` khi server render; lỗi localStorage (private mode) → bỏ qua.
- "auto" khi đổi thinking = xoá mức đã nhớ của model đó (trở về mặc định).
- Không thêm khoá i18n (không có chữ mới trên UI).

## Tiêu chí "xong"

1. `lib/model-preferences.ts` + test unit (fake storage): ghi/đọc/xoá/JSON hỏng không nổ.
2. `npx tsc --noEmit` · `npm test` (không thêm fail) · `npm run lint` 0 lỗi.
3. Build + cài global + restart 8504.
4. Trình duyệt: EXL3 đặt xhigh → đổi Swift → đổi lại EXL3 = xhigh; F5 vẫn nhớ;
   kiểu AGENTS.md: chọn style → đổi model → style về đúng của model đó; reload còn.
