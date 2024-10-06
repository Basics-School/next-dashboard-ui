const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


// Ensure to import the necessary Prisma types if needed

async function main() {
  // Clear existing data
  await prisma.installment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academy.deleteMany();

  // Seed Academies
  const academies = [
    { name: 'NU Academy', slug: 'nu-academy' },
    { name: 'Admission Academy', slug: 'admission-academy' },
    { name: 'Arts Academy', slug: 'arts-academy' },
    { name: 'English Academy', slug: 'english-academy' },
    { name: 'Commerce Academy', slug: 'commerce-academy' },
  ];

  const createdAcademies = await prisma.academy.createMany({ data: academies });

  // Retrieve all academies to ensure we have their IDs
  type Academy = {
    id: string;
    name: string;
    slug: string;
  };

  const allAcademies: Academy[] = await prisma.academy.findMany(); // Define the type for allAcademies

  // Seed Users
  const users = [
    { name: 'John Doe', email: 'john.doe@academy.com' },
    { name: 'Jane Smith', email: 'jane.smith@academy.com' },
    { name: 'Emily Johnson', email: 'emily.johnson@academy.com' },
    { name: 'Michael Brown', email: 'michael.brown@academy.com' },
    { name: 'Sarah Davis', email: 'sarah.davis@academy.com' },
  ];

  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  );

  // Seed Teachers
  const teacherAcademyMap: Record<string, string> = {
    'john.doe@academy.com': 'nu-academy',
    'jane.smith@academy.com': 'english-academy',
  };

  const teachers = await Promise.all(
    Object.entries(teacherAcademyMap).map(async ([userEmail, academySlug]) => {
      const academy = allAcademies.find((a: Academy) => a.slug === academySlug); // Explicitly define the type for 'a'
      const user = createdUsers.find(user => user.email === userEmail);
      if (academy && user) {
        return prisma.teacher.create({
          data: { userId: user.id, academyId: academy.id },
        });
      }
    })
  );

  // Seed Students
  const students = await Promise.all([
    prisma.student.create({ data: { userId: createdUsers[1].id, academyId: allAcademies[0].id } }), // Jane in NU Academy
    prisma.student.create({ data: { userId: createdUsers[2].id, academyId: allAcademies[3].id } }), // Emily in English Academy
  ]);

  // Seed Parents
  const parents = await Promise.all([
    prisma.parent.create({ data: { userId: createdUsers[3].id, studentId: students[0].id } }), // Michael for Jane
    prisma.parent.create({ data: { userId: createdUsers[4].id, studentId: students[1].id } }), // Sarah for Emily
  ]);

  // Seed Staff
  const staff = await Promise.all([
    prisma.staff.create({ data: { userId: createdUsers[0].id, academyId: allAcademies[0].id } }), // John in NU Academy
    prisma.staff.create({ data: { userId: createdUsers[1].id, academyId: allAcademies[3].id } }), // Jane in English Academy
  ]);

  // Seed Courses
  const courses = await Promise.all([
    prisma.course.create({ data: { title: 'Mathematics', teacherId: teachers[0].id, academyId: allAcademies[0].id } }),
    prisma.course.create({ data: { title: 'English Literature', teacherId: teachers[1].id, academyId: allAcademies[3].id } }),
  ]);

  // Seed Invoices
  const invoices = await Promise.all(
    students.map(async student => {
      const academy = await prisma.academy.findUnique({ where: { id: student.academyId } });
      return prisma.invoice.create({
        data: {
          academyId: academy.id,
          studentId: student.id,
          amount: 1000,
          status: 'pending',
          issuedAt: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Due in 30 days
        },
      });
    })
  );

  // Seed Installments
  const installmentsData = [
    {
      invoiceId: invoices[0].id, // First invoice
      amount: 500,
      dueDate: new Date("2024-10-17T08:54:01.106Z"),
      status: "pending",
    },
    {
      invoiceId: invoices[1].id, // Second invoice
      amount: 400,
      dueDate: new Date("2024-10-17T08:54:01.106Z"),
      status: "pending",
    },
  ];

  await Promise.all(
    installmentsData.map(async (installment) => {
      await prisma.installment.create({
        data: {
          invoiceId: installment.invoiceId,
          amount: installment.amount,
          dueDate: installment.dueDate,
          status: installment.status,
        },
      });
    })
  );

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
