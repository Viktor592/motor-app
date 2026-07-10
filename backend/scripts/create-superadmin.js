// Создаёт (или обновляет) супер-админа платформы.
// Запуск внутри контейнера backend:
//   docker compose exec backend node scripts/create-superadmin.js +79991234567 "Имя" "пароль123"
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function maskPhone(phone) {
  return phone.replace(/\d(?=\d{4})/g, '*');
}

async function main() {
  const [phone, name, password] = process.argv.slice(2);
  if (!phone || !name || !password) {
    console.error('Использование: node create-superadmin.js <+7XXXXXXXXXX> "<Имя>" "<пароль>"');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where:  { phone },
    update: { role: 'SUPERADMIN', passwordHash, name },
    create: { phone, phoneMasked: maskPhone(phone), name, passwordHash, role: 'SUPERADMIN' },
  });

  console.log(`✅ Супер-админ готов: ${user.name} (${user.phoneMasked}), id=${user.id}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
