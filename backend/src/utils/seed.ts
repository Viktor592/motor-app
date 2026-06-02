import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Сидируем базу данных МОТОР...\n');

  // ── Очистка ──
  await prisma.chatMessage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.calendarSlot.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.priceRule.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ База очищена');

  // ── Пользователи ──
  const hash = await bcrypt.hash('test1234', 12);

  const [client1, master1, master2, receptionist, admin] = await Promise.all([
    prisma.user.create({ data: {
      phone: '+79001234567', phoneMasked: '+7 (9**) ***-**-67',
      name: 'Алексей Петров', passwordHash: hash, role: 'CLIENT',
    }}),
    prisma.user.create({ data: {
      phone: '+79111111111', phoneMasked: '+7 (9**) ***-**-11',
      name: 'Иван Слесарев', passwordHash: hash, role: 'MASTER',
    }}),
    prisma.user.create({ data: {
      phone: '+79222222222', phoneMasked: '+7 (9**) ***-**-22',
      name: 'Пётр Электриков', passwordHash: hash, role: 'MASTER',
    }}),
    prisma.user.create({ data: {
      phone: '+79333333333', phoneMasked: '+7 (9**) ***-**-33',
      name: 'Ольга Приёмщик', passwordHash: hash, role: 'RECEPTIONIST',
    }}),
    prisma.user.create({ data: {
      phone: '+79444444444', phoneMasked: '+7 (9**) ***-**-44',
      name: 'Дмитрий Админов', passwordHash: hash, role: 'ADMIN',
    }}),
  ]);
  console.log('✓ Пользователи: 5 создано');

  // ── Автомобили ──
  const vehicle1 = await prisma.vehicle.create({ data: {
    clientId: client1.id, brand: 'Toyota', model: 'Camry',
    year: 2021, mileage: 48000, plateNum: 'А123ВС799',
  }});
  console.log('✓ Автомобили: 1 создан');

  // ── Посты ──
  const [post1, post2, post3, post4] = await Promise.all([
    prisma.post.create({ data: { name: 'Пост #1 — Слесарный', type: 'MECHANIC' }}),
    prisma.post.create({ data: { name: 'Пост #2 — Слесарный', type: 'MECHANIC' }}),
    prisma.post.create({ data: { name: 'Пост #3 — Электрик',  type: 'ELECTRICIAN' }}),
    prisma.post.create({ data: { name: 'Пост #4 — Диагностика', type: 'DIAGNOSTICS' }}),
  ]);
  console.log('✓ Посты: 4 создано');

  // ── Слоты — ближайшие 7 рабочих дней, 9:00–20:00 ──
  const slotsData: any[] = [];
  const hours = [9,10,11,12,13,14,15,16,17,18,19];
  const posts  = [post1, post2, post3, post4];
  const masters: Record<string, string> = {
    [post1.id]: master1.id, [post2.id]: master1.id,
    [post3.id]: master2.id, [post4.id]: master2.id,
  };

  let daysAdded = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);

  while (daysAdded < 7) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue; // пропустить воскресенье
    for (const post of posts) {
      for (const h of hours) {
        const start = new Date(d);
        start.setHours(h, 0, 0, 0);
        const end = new Date(d);
        end.setHours(h + 1, 0, 0, 0);
        slotsData.push({
          postId:   post.id,
          masterId: masters[post.id],
          startAt:  start,
          endAt:    end,
          isBooked: false,
        });
      }
    }
    daysAdded++;
  }

  await prisma.calendarSlot.createMany({ data: slotsData });
  console.log(`✓ Слоты: ${slotsData.length} создано (7 дней × 4 поста × 11 часов)`);

  // ── Правила ценообразования ──
  await prisma.priceRule.createMany({ data: [
    { category: 'OIL_FILTERS', markupPct: 30 },
    { category: 'OEM',         markupPct: 20 },
    { category: 'AFTERMARKET', markupPct: 40 },
    { category: 'BRAKES',      markupPct: 35 },
    { category: 'BODY',        markupPct: 25 },
    { category: 'CHEMICALS',   markupPct: 50 },
  ]});
  console.log('✓ Правила ценообразования: 6 создано');

  // ── Тестовый заказ ──
  const firstSlot = await prisma.calendarSlot.findFirst({
    where: { postId: post1.id, isBooked: false },
    orderBy: { startAt: 'asc' },
  });

  if (firstSlot) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: {
        orderNumber:    'ЗН-2025-TEST1',
        clientId:       client1.id,
        vehicleId:      vehicle1.id,
        slotId:         firstSlot.id,
        specialistType: 'MECHANIC',
        complaintRaw:   'Стук в передней подвеске при проезде неровностей, особенно на левом колесе. Появился 2 недели назад.',
        status:         'CONFIRMED',
        totalRetail:    8500,
        totalCost:      5200,
      }});
      await tx.calendarSlot.update({ where: { id: firstSlot.id }, data: { isBooked: true } });
      await tx.orderItem.createMany({ data: [
        { orderId: order.id, type: 'WORK', name: 'Диагностика подвески', qty: 1, costPrice: 800,  retailPrice: 1500, markup: 88 },
        { orderId: order.id, type: 'WORK', name: 'Замена стойки стаб. левая', qty: 1, costPrice: 1200, retailPrice: 2000, markup: 67 },
        { orderId: order.id, type: 'PART', name: 'Стойка стабилизатора Lada/FEBEST', article: 'FEBEST-2023', qty: 2, costPrice: 1600, retailPrice: 2500, markup: 56 },
      ]});
    });
    console.log('✓ Тестовый заказ ЗН-2025-TEST1 создан');
  }

  console.log('\n✅ Сид завершён!\n');
  console.log('Тестовые аккаунты (пароль: test1234):');
  console.log('  CLIENT:       +79001234567');
  console.log('  MASTER:       +79111111111');
  console.log('  RECEPTIONIST: +79333333333');
  console.log('  ADMIN:        +79444444444\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
