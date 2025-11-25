import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listExercisesByCourse() {

  // Buscar todos os exercícios
  const { data: exercises, error } = await supabase
    .from("hub_exercises")
    .select("id, title, memberkit_course_id, memberkit_course_slug, embedding, position")
    .order("memberkit_course_slug", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    console.error("❌ Erro ao buscar exercícios:", error);
    return;
  }

  // Agrupar por curso
  const courseMap = new Map<string, any[]>();
  
  for (const exercise of exercises || []) {
    const courseKey = exercise.memberkit_course_slug || exercise.memberkit_course_id;
    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, []);
    }
    courseMap.get(courseKey)!.push(exercise);
  }

  // Calcular estatísticas
  console.log("\n📊 EXERCÍCIOS POR CURSO\n");
  console.log("━".repeat(80));

  const courseStats: Array<{
    course: string;
    total: number;
    withMetadata: number;
    percentage: number;
  }> = [];

  for (const [course, exs] of courseMap.entries()) {
    const withMetadata = exs.filter((e) => e.embedding !== null).length;
    const percentage = (withMetadata / exs.length) * 100;

    courseStats.push({
      course,
      total: exs.length,
      withMetadata,
      percentage,
    });
  }

  // Ordenar por % de metadata (menos completos primeiro)
  courseStats.sort((a, b) => a.percentage - b.percentage);

  // Mostrar estatísticas
  for (const stat of courseStats) {
    const bar = "█".repeat(Math.floor(stat.percentage / 5));
    const empty = "░".repeat(20 - Math.floor(stat.percentage / 5));

    console.log(`\n📁 ${stat.course}`);
    console.log(
      `   ${stat.withMetadata}/${stat.total} curados (${stat.percentage.toFixed(1)}%)`
    );
    console.log(`   [${bar}${empty}]`);
  }

  // Mostrar cursos prioritários (0-50% curados, mais de 3 exercícios)
  console.log("\n\n🎯 CURSOS PRIORITÁRIOS PARA CURADORIA\n");
  console.log("━".repeat(80));

  const priorityCourses = courseStats.filter(
    (s) => s.percentage < 50 && s.total >= 3
  );

  for (const course of priorityCourses.slice(0, 5)) {
    console.log(`\n📁 ${course.course}`);
    console.log(
      `   ${course.withMetadata}/${course.total} curados (${course.percentage.toFixed(1)}%)`
    );

    // Listar primeiros 10 exercícios sem metadata
    const exercisesFromCourse = courseMap.get(course.course) || [];
    const uncurated = exercisesFromCourse.filter((e) => e.embedding === null);

    console.log(`   \n   Exercícios sem metadata (primeiros 10):`);
    for (const ex of uncurated.slice(0, 10)) {
      console.log(`   - ${ex.title}`);
      console.log(`     ID: ${ex.id}`);
    }
  }

  console.log("\n" + "━".repeat(80));
  console.log(
    `\n📊 Total: ${exercises.length} exercícios, ${
      exercises.filter((e) => e.embedding !== null).length
    } com metadata\n`
  );
}

listExercisesByCourse().catch(console.error);
