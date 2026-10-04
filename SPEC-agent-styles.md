# SPEC — Kiểu AGENTS.md (agent styles) cho fork @agegr/pi-web

## Mục tiêu
Người dùng được chọn "kiểu" chỉ thị (AGENTS.md) khi **bắt đầu phiên mới** trên pi-web
(cổng 8504, fork `/home/huy/Code/pi-web-icekale`):

- Selector trong vùng tạo phiên mới: **Mặc định** / **Trống (Empty)** / + các kiểu đã lưu.
- Section trong Settings: thêm, sửa, xoá kiểu; mỗi kiểu = tên + nội dung markdown.
- **Không hardcode** kiểu: lưu ở `~/.pi/agent-web/agent-styles.json` (agent-dir của service).

## Semantic
- **Mặc định**: hành vi pi bình thường (nạp đầy đủ AGENTS.md/CLAUDE.md ở mọi cấp).
- **Kiểu có tên**: `noContextFiles: true` + `appendSystemPrompt: [content]`
  → kiểu thay thế TOÀN BỘ context files (kể cả AGENTS.md của dự án).
- **Trống**: `noContextFiles: true`, không append → không có chỉ thị nào.
- Chỉ áp dụng cho phiên MỚI; phiên đã chạy giữ prompt cũ (không làm switch giữa phiên).

## Ràng buộc
- Bám pattern có sẵn của fork: `lib/atomic-file.ts`, `lib/json-response.ts`,
  i18n đủ 3 locale (en/vi/zh-CN), test `*.test.mjs` theo quy ước repo.
- Không đụng dữ liệu phiên; `agent-styles.json` khởi tạo rỗng, fail-closed nếu file hỏng
  (mượn pattern `lib/subagent-settings.ts`).
- Build + cài + restart service 8504 phải **ngoài lượt chat** (bài học 01/10: restart
  trong lượt tự giết lượt).

## Tiêu chí "xong"
1. `npx tsc --noEmit` + `npm test` xanh (trừ test hỏng có sẵn).
2. API `GET/POST/PUT/DELETE /api/agent-styles` hoạt động (test trong repo + curl instance test).
3. UI: tạo phiên mới có selector (Mặc định/Trống/kiểu đã lưu); Settings thêm/sửa/xoá kiểu,
   nội dung lưu lại sau khi reload trang.
4. Kiểm chứng trình duyệt: phiên mới chọn "Trống" → không còn AGENTS.md trong system prompt;
   chọn kiểu "Lite" → đúng nội dung kiểu đó.
5. Service 8504 restart ngoài lượt, `curl http://127.0.0.1:8504/` = 200, gửi 1 tin phiên mới chạy được.
