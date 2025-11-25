import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getExerciseDetails() {
  const targetIds = [
    "88e94590-e532-46f5-b702-ef297458c095", // Revisão Jogo dos 5 animais
    "6515b788-85d3-4721-aa84-fdd1c4205ada", // Revisão Yi Jin Jing
    "6adf5f07-14a3-4db3-b609-d6e0eb475a35", // Ba Duan Jin com Yi Jin Jing
    "17c21a7f-f4e6-41a4-87de-a4dc9195a64e", // Exercícios para Joelhos
    "b75526a6-4635-4dd1-bfe5-01f9345e4951", // Exercícios para fortalecer a coluna
    "4b49b49a-ccd1-4fe7-b2d0-0711937f616f", // Exercícios para desintoxicar o corpo
  ];

  const { data: exercises, error } = await supabase
    .from("hub_exercises")
    .select("*")
    .in("id", targetIds);

  if (error) {
    console.error("❌ Erro:", error);
    return;
  }

  console.log("\n📋 DETALHES DOS EXERCÍCIOS\n");
  console.log("━".repeat(80));

  for (const ex of exercises || []) {
    console.log(`\n📝 ${ex.title}`);
    console.log(`   ID: ${ex.id}`);
    console.log(`   Memberkit Lesson ID: ${ex.memberkit_lesson_id}`);
    console.log(`   URL: ${ex.url}`);
    console.log(`   Duração: ${ex.duration_minutes || "N/A"} minutos`);
    console.log(`   Ativo: ${ex.is_active}`);
    console.log(`   Element: ${ex.element || "N/A"}`);
    console.log(`   Has embedding: ${ex.embedding !== null}`);
  }

  console.log("\n" + "━".repeat(80) + "\n");
}

getExerciseDetails().catch(console.error);
