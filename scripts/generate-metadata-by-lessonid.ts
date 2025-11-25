import { createAdminClient } from '../lib/supabase/server.js'
import fs from 'fs'

// Metadados curados por SLUG (mais fácil de manter)
const metadataBySlug: Record<string, any> = {
  "sustentar-o-ceu-com-as-maos-para-regular-o-triplo-aquecedor-shuang-shou-tuo-tian": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["BAÇO", "ESTÔMAGO"],
    benefits: ["Alonga coluna vertebral", "Regula Triplo Aquecedor", "Melhora digestão", "Aumenta energia geral"],
    indications: ["digestão", "fadiga", "tensão_ombros", "má_digestão", "falta_energia"],
    contraindications: ["Lesões agudas nos ombros"]
  },
  "puxar-o-arco-e-lancar-a-flecha-para-fortalecer-os-pulmoes-zuo-you-kai-gong-si-sh": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "METAL",
    organs: ["PULMÃO"],
    benefits: ["Fortalece pulmões", "Expande tórax", "Melhora respiração", "Aumenta imunidade"],
    indications: ["respiração_curta", "asma", "bronquite", "imunidade_baixa", "tosse"],
    contraindications: ["Lesões agudas no ombro"]
  },
  "elevar-um-braco-para-regular-o-baco-e-o-estomago-tiao-li-pi-wei-xu-dan-ju": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["BAÇO", "ESTÔMAGO"],
    benefits: ["Regula digestão", "Fortalece baço", "Melhora apetite", "Tonifica qi"],
    indications: ["digestão", "má_digestão", "inchaço", "falta_apetite", "gases"],
    contraindications: []
  },
  "olhar-para-tras-para-recuperar-de-cansaco-e-desgastes-wulaoqishang-xianghou-qiao": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CORAÇÃO"],
    benefits: ["Alivia cansaço", "Reduz estresse", "Relaxa pescoço", "Melhora visão"],
    indications: ["fadiga", "estresse", "tensão_pescoço", "cansaço_mental", "vista_cansada"],
    contraindications: ["Problemas cervicais graves"]
  },
  "balancar-a-cabeca-e-o-coccix-para-acalmar-o-fogo-do-coracao-yao-tou-bai-wei-qu-x": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CORAÇÃO"],
    benefits: ["Acalma mente", "Reduz ansiedade", "Equilibra fogo do coração", "Relaxa quadril"],
    indications: ["ansiedade", "agitação", "insônia", "palpitação", "nervosismo"],
    contraindications: ["Problemas graves na coluna lombar"]
  },
  "segurar-a-ponta-dos-pes-para-fortalecer-os-rins-liang-shou-pan-zu-gu-shen-yao": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM", "BEXIGA"],
    benefits: ["Fortalece rins", "Alonga lombar", "Aumenta energia vital", "Nutre essência"],
    indications: ["dor_lombar", "fadiga", "fraqueza_pernas", "zumbido", "libido_baixa"],
    contraindications: ["Hérnia de disco aguda", "Pressão alta severa"]
  },
  "fechar-as-maos-em-punho-com-um-olhar-firme-para-aumentar-a-forca-fisica-zan-quan": {
    duration_minutes: 3,
    level: "INTERMEDIÁRIO",
    element: "MADEIRA",
    organs: ["FÍGADO"],
    benefits: ["Aumenta força física", "Tonifica fígado", "Melhora determinação", "Fortalece visão"],
    indications: ["fraqueza_muscular", "falta_vontade", "fadiga", "visão_fraca"],
    contraindications: ["Pressão alta não controlada"]
  },
  "suspender-os-calcanhares-sete-vezes-para-afastar-as-doencas-beihou-cidian-baibin": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Estimula todos meridianos", "Previne doenças", "Fortalece tornozelos", "Harmoniza energia"],
    indications: ["circulação_ruim", "pés_frios", "fadiga", "prevenção", "desequilíbrio"],
    contraindications: ["Problemas graves nos tornozelos"]
  },

  "respiracao-la-sal": {
    duration_minutes: 10,
    level: "INICIANTE",
    element: "METAL",
    organs: ["PULMÃO"],
    benefits: ["Fortalece pulmões", "Melhora capacidade respiratória", "Desintoxica"],
    indications: ["ansiedade", "estresse", "respiração_curta", "asma_leve"],
    contraindications: []
  },
  "respiracao-profunda-e-abdominal-em-4-4-tempos": {
    duration_minutes: 8,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CORAÇÃO"],
    benefits: ["Regula ritmo cardíaco", "Acalma coração", "Reduz ansiedade", "Aumenta foco"],
    indications: ["ansiedade", "palpitação", "agitação", "estresse", "falta_concentração"],
    contraindications: []
  },
  "yi-jin-jing-reverencias": {
    duration_minutes: 5,
    level: "INTERMEDIÁRIO",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Fortalece região lombar", "Nutre rins", "Aumenta flexibilidade", "Tonifica energia vital"],
    indications: ["dor_lombar", "fadiga", "fraqueza_pernas", "rigidez_coluna"],
    contraindications: ["Hérnia de disco aguda", "Pressão alta descontrolada"]
  },
  "5-mantra-1-xu": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "MADEIRA",
    organs: ["FÍGADO"],
    benefits: ["Tonifica fígado", "Libera raiva", "Desintoxica fígado", "Melhora visão"],
    indications: ["raiva", "irritação", "olhos_vermelhos", "tensão_muscular", "fígado_congestionado"],
    contraindications: []
  },
  "6-mantra-2-_-he": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CORAÇÃO"],
    benefits: ["Acalma coração", "Reduz ansiedade", "Equilibra emoções", "Melhora sono"],
    indications: ["ansiedade", "palpitação", "agitação", "insônia", "nervosismo"],
    contraindications: []
  },
  "7-mantra-3-_-hu": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["BAÇO", "ESTÔMAGO"],
    benefits: ["Fortalece digestão", "Elimina preocupação", "Tonifica baço", "Reduz pensamento excessivo"],
    indications: ["digestão", "preocupação", "pensamento_excessivo", "inchaço", "má_digestão"],
    contraindications: []
  },
  "8-mantra-4-_-si": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "METAL",
    organs: ["PULMÃO"],
    benefits: ["Fortalece pulmões", "Libera tristeza", "Melhora respiração", "Aumenta imunidade"],
    indications: ["tristeza", "melancolia", "respiração_fraca", "pulmão_fraco", "luto"],
    contraindications: []
  },
  "9-mantra-5-_-chui": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Tonifica rins", "Libera medo", "Aumenta energia vital", "Fortalece ossos"],
    indications: ["medo", "fadiga", "fraqueza", "zumbido", "ossos_fracos"],
    contraindications: []
  },
  "10-mantra-6-_-xi": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["TRIPLO_AQUECEDOR"],
    benefits: ["Equilibra temperatura corporal", "Harmoniza todos órgãos", "Regula metabolismo"],
    indications: ["desequilíbrio_térmico", "fadiga", "má_circulação", "metabolismo_lento"],
    contraindications: []
  },
  "primeiro-ponto-c7": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CORAÇÃO"],
    benefits: ["Acalma coração e mente", "Reduz ansiedade", "Melhora sono"],
    indications: ["ansiedade", "insônia", "palpitação", "agitação", "nervosismo"],
    contraindications: []
  },
  "quarto-ponto-ig4": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "METAL",
    organs: ["INTESTINO_GROSSO"],
    benefits: ["Alivia dor em geral", "Fortalece imunidade", "Libera tensão", "Elimina calor"],
    indications: ["dor_cabeça", "dor_geral", "tensão", "constipação", "resfriado"],
    contraindications: ["Gravidez"]
  },
  "quinto-ponto-r3": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Tonifica rins", "Fortalece lombar", "Aumenta energia vital", "Melhora audição"],
    indications: ["fadiga", "dor_lombar", "fraqueza", "zumbido", "libido_baixa"],
    contraindications: []
  },
  "nono-ponto-e36": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["ESTÔMAGO"],
    benefits: ["Tonifica energia geral", "Fortalece digestão", "Aumenta imunidade", "Longevidade"],
    indications: ["fadiga", "digestão", "imunidade_baixa", "fraqueza_geral", "prevenção"],
    contraindications: []
  },
  "decimo-terceiro-ponto-yin-tang": {
    duration_minutes: 3,
    level: "INICIANTE",
    element: "FOGO",
    organs: ["CÉREBRO"],
    benefits: ["Acalma mente profundamente", "Melhora sono", "Reduz ansiedade", "Medita"],
    indications: ["insônia", "ansiedade", "agitação_mental", "meditação", "estresse"],
    contraindications: []
  },
  "escalda-pes-r1-yong-quan": {
    duration_minutes: 15,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Relaxa corpo", "Tonifica rins", "Melhora sono", "Aquece corpo"],
    indications: ["insônia", "pés_frios", "fadiga", "ansiedade", "hipertensão"],
    contraindications: ["Feridas nos pés", "Diabetes avançado"]
  },
  "massagem-auricular": {
    duration_minutes: 5,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Tonifica rins", "Melhora audição", "Equilibra corpo todo", "Previne zumbido"],
    indications: ["zumbido", "audição_fraca", "fadiga", "desequilíbrio"],
    contraindications: ["Infecções ativas no ouvido"]
  },
  "workshop-acabe-com-o-zumbido-chato-no-ouvido-e-a-labirintite-com-a-medicina-mile": {
    duration_minutes: 60,
    level: "INICIANTE",
    element: "ÁGUA",
    organs: ["RIM"],
    benefits: ["Protocolo completo zumbido", "Técnicas específicas", "Compreensão profunda MTC"],
    indications: ["zumbido", "labirintite", "tontura", "vertigem", "audição"],
    contraindications: []
  },
  "1-a-sequencia-completa-com-narracao": {
    duration_minutes: 20,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["TODOS"],
    benefits: ["Prática completa guiada", "Todos elementos", "Explicações detalhadas"],
    indications: ["prática_diária", "iniciantes", "aprendizado", "rotina_completa"],
    contraindications: []
  },
  "introducao-ao-ba-duan-jin": {
    duration_minutes: 15,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["TODOS"],
    benefits: ["Fundamentos Ba Duan Jin", "Teoria e prática", "Base sólida"],
    indications: ["iniciantes", "aprendizado", "fundamentos"],
    contraindications: []
  },
  "introducao-ao-yi-jin-jing": {
    duration_minutes: 15,
    level: "INTERMEDIÁRIO",
    element: "MADEIRA",
    organs: ["FÍGADO"],
    benefits: ["Fundamentos Yi Jin Jing", "Transformação tendões", "Preparação"],
    indications: ["praticantes", "aprendizado_intermediário", "desenvolvimento"],
    contraindications: []
  }
}

async function generateMetadataByLessonId() {
  const supabase = await createAdminClient()
  
  // Buscar TODOS os exercícios
  const { data: allExercises } = await supabase
    .from('hub_exercises')
    .select('memberkit_lesson_id, slug')
  
  if (!allExercises) {
    console.error('Nenhum exercício encontrado')
    return
  }
  
  // Criar mapa slug → lesson_id
  const slugToLessonId: Record<string, string> = {}
  for (const ex of allExercises) {
    slugToLessonId[ex.slug] = ex.memberkit_lesson_id
  }
  
  // Converter metadataBySlug para metadataByLessonId
  const metadataByLessonId: Record<string, any> = {}
  
  for (const [slug, metadata] of Object.entries(metadataBySlug)) {
    const lessonId = slugToLessonId[slug]
    if (lessonId) {
      metadataByLessonId[lessonId] = metadata
      console.log(`✅ Mapeado: ${slug} → ${lessonId}`)
    } else {
      console.log(`⚠️  Slug não encontrado: ${slug}`)
    }
  }
  
  // Gerar JSON final
  const finalJson = {
    version: "2.0.0",
    lastSync: null,
    description: "Metadados curados - 30 exercícios essenciais do Método Ye Xin",
    total_curated: Object.keys(metadataByLessonId).length,
    exercicios: metadataByLessonId
  }
  
  // Salvar
  fs.writeFileSync(
    'exercicios-metadata.json',
    JSON.stringify(finalJson, null, 2),
    'utf-8'
  )
  
  console.log(`\n✅ Arquivo gerado com ${Object.keys(metadataByLessonId).length} exercícios!`)
  console.log('📁 Salvo em: exercicios-metadata.json\n')
}

generateMetadataByLessonId()
