# SPEC — Tuỳ chọn "Giao diện thử nghiệm" cho fork @agegr/pi-web

## Mục tiêu

Thêm công tắc **"Giao diện thử nghiệm"** vào Settings → General của bản fork
(`/home/huy/Code/pi-web-icekale`, gói `@agegr/pi-web`, phục vụ cổng 8504):

- **Tắt (mặc định)**: giao diện y hệt hiện tại, không đổi 1 pixel nào.
- **Bật**: transcript + composer theo các đề xuất đã duyệt (phiên đánh giá 03/10/2026):
  1. Nhãn model chỉ hiện **1 lần đầu mỗi lượt** (không lặp sau mỗi bước).
  2. Dòng số liệu token/đô la (`1,539 in · 126 out · … · $0.0003`) **ẩn đi, đưa vào hover** (title).
  3. Dòng trạng thái cuối hết trùng chữ: `Running agent_browser · <lệnh>` (bỏ `Running` nhân đôi).
  4. Khối `Thinking` có dấu ▸ báo bấm được.
  5. Placeholder ô nhập khi đang chạy viết lại cho dễ hiểu (key i18n mới).
  6. Tự cuộn đáy **chỉ khi người dùng đang ở gần đáy**; đã cuộn lên thì đừng kéo về.
  7. Ô vuông minimap trôi nổi: ẩn khi transcript chưa đủ dài (vẽ lại chỉ khi có track).
  8. Giờ trong transcript đổi sang dạng tương đối ("1 minute ago") cùng kiểu sidebar.
  9. Màu giờ sidebar `#6b7280` → đậm hơn cho đủ tương phản (chỉ khi bật cờ).

**Sửa vô hình (luôn áp dụng, không đổi hiển thị)** — a11y: `role="list"` bọc `listitem`,
`.desktop-context-progress` thêm `role="progressbar"` + aria-label làm tròn, trang phiên có `<h1>`,
`<html lang>` theo locale.

## Ràng buộc

- Bám đúng recipe có sẵn của repo (đã dùng cho "Hide thinking and tools"):
  `lib/*-preference.ts` (localStorage `pi-experimental-ui`, dispatch event) →
  `hooks/useExperimentalUiPreference.ts` → khoá i18n `en`/`zh-CN`/`vi` →
  `SettingsPage.tsx` (section + `settings-switch`) → `AppShell.tsx` sở hữu state, truyền xuống.
- Không đụng dữ liệu phiên, không đổi server. `npm run lint` + `npx tsc --noEmit` + `npm test` xanh
  (test component là `assert.match` regex trên source — đọc lại các regex liên quan).
- Build + cài + restart hẹn **ngoài lượt chat** (bài học 01/10: restart trong lượt tự giết lượt).

## Tiêu chí "xong"

1. Tắt cờ: DOM giống trước (label model mỗi bước, usage hiện, placeholder cũ…).
2. Bật cờ: các mục 1–9 ăn thật, kiểm chứng bằng screenshot + query DOM trên fixture (8518).
3. `npx tsc --noEmit`, `npm test`, `npm run lint` xanh.
4. A11y: `axe` không còn 5 vi phạm cũ (chừa phần ngoài tầm với nếu có).
5. Ghi trạng thái vào TODO-giao-dien-thu-nghiem.md sau mỗi việc xong.
