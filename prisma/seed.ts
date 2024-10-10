import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const actualities = async () => {
  await prisma.actuality.deleteMany();
  await prisma.actuality.createMany({
    data: Array.from({ length: 10 }).map(() => ({
      text: faker.lorem.paragraph(),
      title: faker.lorem.sentence(),
    })),
  });
};

const licenses = async () => {
  await prisma.license.deleteMany();
  await prisma.license.createMany({
    data: [
      {
        name: "Exploitation",
        rights: ["todo"],
      },
      {
        name: "Utilisation",
        rights: ["todo"],
      },
    ],
  });
};

const main = async () => {
  await Promise.all([actualities(), licenses()]);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
