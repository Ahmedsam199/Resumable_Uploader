import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear old data (optional)
  await prisma.case.deleteMany();

  // Insert new data
  await prisma.case.create({
    data: {
      name: 'Ahmed Case',
    },
  });

  await prisma.document.createMany({
    data: [
      {
        name: 'Document 1',
        caseId: 1,
        postingDate: new Date('2025-11-01'),
      },
      {
        name: 'Document 2',
        caseId: 1,
        postingDate: new Date('2025-09-01'),
      },
      {
        name: 'Document 3',
        caseId: 1,
        postingDate: new Date('2025-08-02'),
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
