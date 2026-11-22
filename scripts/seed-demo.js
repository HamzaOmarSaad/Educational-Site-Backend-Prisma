require("dotenv/config");
const bcrypt = require("bcrypt");
const { db } = require("../dist/prisma/db");

const models = db.orm.public;
const password = "DemoPass123!";

async function findOrCreate(model, where, data) {
  const existing = await model.where(where).first();
  return existing ?? model.create(data);
}

async function addYearCatalog(year, gradeName, tracks) {
  const grade = await findOrCreate(models.Grade, { name: gradeName }, {
    name: gradeName, description: `Egyptian general secondary curriculum, ${year - 1}/${year}`,
  });
  const academicYear = await findOrCreate(models.AcademicYear, { gradeId: grade.id, year }, {
    gradeId: grade.id, year, name: `${year - 1}/${year}`,
  });

  for (const { name, subjects } of tracks) {
    const track = await findOrCreate(models.Track, { academicYearId: academicYear.id, name }, {
      academicYearId: academicYear.id, name,
      description: `${gradeName} ${name === "General" ? "common" : name.toLowerCase()} track`,
    });
    for (const subject of subjects) {
      await findOrCreate(models.Subject, { trackId: track.id, name: subject.name }, {
        trackId: track.id, name: subject.name, description: subject.description,
      });
    }
  }
}

const counted = (name) => ({ name, description: "Core subject counted toward the academic total." });
const passFail = (name) => ({ name, description: "Required pass/fail subject; not counted toward the academic total." });
const firstYearCore = ["Arabic Language", "First Foreign Language", "History", "Mathematics", "Integrated Science", "Philosophy and Logic"].map(counted);
const firstYearRequired = ["Religious Education", "Second Foreign Language", "Physical Education", "Programming and Artificial Intelligence"].map(passFail);
const secondYearRequired = ["Religious Education", "Second Foreign Language", "Physical Education", "National Education"].map(passFail);
const thirdYearRequired = ["Religious Education", "Second Foreign Language", "Physical Education", "National Education"].map(passFail);

async function seed() {
  await db.connect();

  const grade = await findOrCreate(models.Grade, { name: "Demo Secondary" }, {
    name: "Demo Secondary", description: "Sample grade for API testing",
  });
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  const academicYear = await findOrCreate(models.AcademicYear, { gradeId: grade.id, year }, {
    gradeId: grade.id, year, name: `${year} Academic Year`,
  });
  const track = await findOrCreate(models.Track, { academicYearId: academicYear.id, name: "General" }, {
    academicYearId: academicYear.id, name: "General", description: "General secondary track",
  });
  const subject = await findOrCreate(models.Subject, { trackId: track.id, name: "Mathematics" }, {
    trackId: track.id, name: "Mathematics", description: "Sample mathematics subject",
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const teacher = await findOrCreate(models.User, { email: "teacher.demo@example.test" }, {
    name: "Demo Teacher", email: "teacher.demo@example.test", password: hashedPassword,
    role: "TEACHER", gender: "MALE", EmailConfirmedAt: new Date(),
  });
  await findOrCreate(models.TeacherProfile, { userId: teacher.id }, {
    userId: teacher.id, bio: "Sample teacher profile for testing the education API.",
    specialization: "Mathematics", experience: 8, qualifications: "BSc Mathematics",
  });
  await findOrCreate(models.Teaches, { teacherId: teacher.id, subjectId: subject.id }, {
    teacherId: teacher.id, subjectId: subject.id,
  });

  const student = await findOrCreate(models.User, { email: "student.demo@example.test" }, {
    name: "Demo Student", email: "student.demo@example.test", password: hashedPassword,
    role: "STUDENT", gender: "FEMALE", EmailConfirmedAt: new Date(),
  });
  await findOrCreate(models.User, { email: "admin.demo@example.test" }, {
    name: "Demo Administrator", email: "admin.demo@example.test", password: hashedPassword,
    role: "ADMIN", gender: "MALE", EmailConfirmedAt: new Date(),
  });
  await findOrCreate(models.StudentProfile, { userId: student.id }, {
    userId: student.id, school: "Demo Secondary School", gradeId: grade.id,
    academicYearId: academicYear.id, trackId: track.id, parentPhone: "01000000000",
  });
  await findOrCreate(models.Wallet, { studentId: student.id }, { studentId: student.id });
  await findOrCreate(models.Subscription, { studentId: student.id, teacherId: teacher.id }, {
    studentId: student.id, teacherId: teacher.id, status: "APPROVED",
  });

  const course = await findOrCreate(models.Course, {
    teacherId: teacher.id, title: "Demo Mathematics: Algebra Foundations",
  }, {
    teacherId: teacher.id, gradeId: grade.id, subjectId: subject.id,
    title: "Demo Mathematics: Algebra Foundations",
    description: "Sample course with a lesson and quiz for endpoint testing.",
    price: "0", status: "PUBLISHED",
  });
  const section = await findOrCreate(models.CourseSection, { courseId: course.id, order: 1 }, {
    courseId: course.id, title: "Getting Started", description: "Sample course section", order: 1,
  });
  const lesson = await findOrCreate(models.Lesson, { sectionId: section.id, order: 1 }, {
    sectionId: section.id, title: "Introduction to Algebra", order: 1,
    description: "A sample lesson record.", content: "Algebra uses symbols to represent numbers.", isFree: true,
  });
  const quiz = await findOrCreate(models.Quiz, { lessonId: lesson.id, title: "Algebra Check" }, {
    lessonId: lesson.id, title: "Algebra Check", description: "A sample quiz", passingScore: 1, timeLimit: 10,
  });
  const question = await findOrCreate(models.QuizQuestion, { quizId: quiz.id, order: 1 }, {
    quizId: quiz.id, question: "What is x if x + 2 = 5?", type: "SINGLE_CHOICE", points: 1, order: 1,
  });
  await findOrCreate(models.Answer, { questionId: question.id, order: 1 }, {
    questionId: question.id, text: "3", isCorrect: true, order: 1,
  });
  await findOrCreate(models.Answer, { questionId: question.id, order: 2 }, {
    questionId: question.id, text: "7", isCorrect: false, order: 2,
  });
  await findOrCreate(models.Enrollment, { studentId: student.id, courseId: course.id }, {
    studentId: student.id, courseId: course.id, status: "ACTIVE",
  });

  // Egyptian Thanaweya Amma curriculum for academic year 2026/2027.
  await addYearCatalog(year, "First Secondary", [
    { name: "General", subjects: [...firstYearCore, ...firstYearRequired] },
  ]);
  await addYearCatalog(year, "Second Secondary", [
    { name: "Scientific", subjects: ["Arabic Language", "First Foreign Language", "Mathematics", "History", "Chemistry", "Physics"].map(counted).concat(secondYearRequired) },
    { name: "Literary", subjects: ["Arabic Language", "First Foreign Language", "History", "Geography", "Psychology and Sociology", "Mathematics"].map(counted).concat(secondYearRequired) },
  ]);
  await addYearCatalog(year, "Third Secondary", [
    { name: "Scientific Science", subjects: ["Arabic Language", "First Foreign Language", "Biology", "Chemistry", "Physics"].map(counted).concat(thirdYearRequired) },
    { name: "Scientific Mathematics", subjects: ["Arabic Language", "First Foreign Language", "Mathematics", "Chemistry", "Physics"].map(counted).concat(thirdYearRequired) },
    { name: "Literary", subjects: ["Arabic Language", "First Foreign Language", "History", "Geography", "Statistics"].map(counted).concat(thirdYearRequired) },
  ]);

  console.log("Demo records are ready.");
  console.log("Teacher: teacher.demo@example.test / DemoPass123!");
  console.log("Student: student.demo@example.test / DemoPass123!");
  console.log("Admin: admin.demo@example.test / DemoPass123!");
  console.log("Sample course, lesson, and quiz are linked to the demo accounts.");
  console.log("Added Egyptian Thanaweya Amma subject catalog for the current academic year.");
}

seed().catch((error) => {
  console.error("Could not seed demo records:", error);
  process.exitCode = 1;
});
