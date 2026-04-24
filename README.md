# TRPG Sheet Dice — Owlbear Extension

แสดงผลลัพลูกเต๋าจาก TRPG Sheet บนโต๊ะ Owlbear Rodeo

## วิธีติดตั้ง

1. Deploy โฟลเดอร์นี้ขึ้น Vercel/GitHub Pages
2. เปิด Owlbear Rodeo → Settings → Extensions
3. เพิ่ม URL ของ Extension ที่ deploy แล้ว
4. Extension จะปรากฎใน sidebar

## วิธีตั้งค่า

1. เปิด Extension panel ใน Owlbear
2. ใส่ Backend URL ของ TRPG Sheet
   เช่น: `https://trpg-sheet-production.up.railway.app/api`
3. ค่าจะถูกบันทึกไว้ใน Room

## การทำงาน

- Extension poll `/api/dice/recent` ทุก 2 วินาที
- เมื่อมีการทอยใหม่ จะแสดง toast notification มุมซ้ายล่าง
- ทุกคนในห้องเห็น notification พร้อมกัน
- Toast แสดง: ชื่อตัวละคร, ตัวเลข, expression, ผลลัพ (Hit/Miss)
