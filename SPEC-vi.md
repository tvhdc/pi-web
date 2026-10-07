# SPEC — Ngôn ngữ tiếng Việt (`vi`) cho fork @agegr/pi-web

## Mục tiêu

Thêm tiếng Việt vào bộ chọn ngôn ngữ của bản fork (`/home/huy/Code/pi-web-icekale`, gói
`@agegr/pi-web`, phục vụ cổng 8504):

- Có mục **Tiếng Việt** trong Settings → Ngôn ngữ; chọn xong toàn bộ giao diện hiện tiếng Việt.
- Dịch **đủ 100%** số key của `lib/i18n/messages/en.ts` (khoảng 793 key) sang tiếng Việt.

## Ràng buộc

- **Tiếng Việt phổ thông**, câu ngắn như người Việt nói, không dịch máy từng chữ.
- **Giữ nguyên từ khoá kỹ thuật**: `skills`, `token`, `model`, `agent`, `tool`, `API key`,
  `prompt` (khi là khái niệm), `commit`, `log`, `build`, `JSON`, tên sản phẩm/đường dẫn/lệnh.
  Dịch các từ đời thường: session/chat/conversation → "cuộc trò chuyện", project → "dự án",
  settings → "cài đặt", files → "tệp", workspace → "không gian làm việc", thinking → "suy nghĩ".
- Bám theo bảng thuật ngữ sẵn có ở bản custom cũ
  (`.../pi-web-custom/src/client/src/viTranslations.ts`, ~1060 mục người dùng đã duyệt).
- Thêm ngôn ngữ phải chạm đủ các chỗ: `lib/i18n/types.ts`, `registry.ts` (đăng ký + nhận diện
  `vi`/`vi-VN`), `lib/ui-locale.ts`, `hooks/useI18n.tsx`, `app/api/ui-locale/route.ts`,
  và các test đang khoá danh sách ngôn ngữ.
- Không đụng dữ liệu phiên, không đổi hành vi khác. Bản build xong phải restart service — restart
  hẹn **ngoài lượt chat** (bài học 01/10: restart trong lượt tự giết lượt).

## Tiêu chí "xong"

1. `vi.ts` đủ số key bằng `en.ts` (kiểm bằng script đếm, 0 key thiếu/thừa).
2. `npx tsc --noEmit` sạch; `npm test` xanh (trừ các test hỏng có sẵn từ trước).
3. Chọn **Tiếng Việt** trong UI thật: chụp ảnh sidebar + khung chat + Settings, đều là tiếng Việt,
   không còn câu tiếng Anh nào lọt (trừ từ khoá cố ý giữ).
4. Build lại gói, cài, service 8504 phục vụ bản mới (kiểm bằng asset + ảnh chụp).
5. Commit + push lên fork `tvhdc/pi-web`.
