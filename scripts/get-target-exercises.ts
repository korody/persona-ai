import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTargetExercises() {
  // 1. Protocolo Dor Lombar - TODOS
  const { data: lombar } = await supabase
    .from("hub_exercises")
    .select("*")
    .eq("memberkit_course_slug", "protocolo-intensivo-contra-dor-na-lombar-e-coluna-com-metodo-ye-xin")
    .is("embedding", null)
    .order("position");

  // 2. Protocolo Zumbido - TODOS que faltam
  const { data: zumbido } = await supabase
    .from("hub_exercises")
    .select("*")
    .eq("memberkit_course_slug", "protocolo-intensivo-contra-zumbido-e-labirintite-com-metodo-ye-xin")
    .is("embedding", null)
    .order("position");

  // 3. Dose Semanal - até 30% (atualmente 6/49, precisa chegar a ~15, então +9)
  const { data: dose } = await supabase
    .from("hub_exercises")
    .select("*")
    .eq("memberkit_course_slug", "dose-semanal-de-qi-gong")
    .is("embedding", null)
    .order("memberkit_lesson_id", { ascending: false }) // Mais recentes primeiro
    .limit(15);

  console.log("\n📋 EXERCÍCIOS A CURAR\n");
  console.log("=".repeat(80));

  console.log("\n🔸 PROTOCOLO DOR LOMBAR E COLUNA");
  console.log(`Total: ${lombar?.length || 0} exercícios\n`);
  lombar?.slice(0, 5).forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`);
    console.log(`   Lesson ID: ${ex.memberkit_lesson_id}`);
  });
  if ((lombar?.length || 0) > 5) {
    console.log(`   ... e mais ${(lombar?.length || 0) - 5} exercícios`);
  }

  console.log("\n🔸 PROTOCOLO ZUMBIDO E LABIRINTITE");
  console.log(`Total: ${zumbido?.length || 0} exercícios\n`);
  zumbido?.slice(0, 5).forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`);
    console.log(`   Lesson ID: ${ex.memberkit_lesson_id}`);
  });
  if ((zumbido?.length || 0) > 5) {
    console.log(`   ... e mais ${(zumbido?.length || 0) - 5} exercícios`);
  }

  console.log("\n🔸 DOSE SEMANAL (MAIS RECENTES)");
  console.log(`Selecionados: ${dose?.length || 0} exercícios (dos mais novos)\n`);
  dose?.slice(0, 10).forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`);
    console.log(`   Lesson ID: ${ex.memberkit_lesson_id}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log(`\n📊 TOTAL A CURAR: ${(lombar?.length || 0) + (zumbido?.length || 0) + Math.min(dose?.length || 0, 9)} exercícios\n`);

  // Salvar IDs para facilitar curadoria
  const allIds = [
    ...(lombar?.map(e => e.memberkit_lesson_id) || []),
    ...(zumbido?.map(e => e.memberkit_lesson_id) || []),
    ...(dose?.slice(0, 9).map(e => e.memberkit_lesson_id) || [])
  ];

  console.log("\n📝 IDs para curadoria (copiar):");
  console.log(JSON.stringify(allIds, null, 2));
}

getTargetExercises().catch(console.error);
