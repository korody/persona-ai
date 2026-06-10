/**
 * Script de teste: Course Intent Detection
 * Valida se a detecção de curso funciona corretamente
 */

import { detectCourseIntent } from '@/lib/helpers/course-intent-detection'

const testCases = [
  {
    message: 'Me passa um exercício do curso Longevidade e Independência com Qi Gong',
    expectedCourse: 'Longevidade & Independência com Qi Gong',
  },
  {
    message: 'Quero fazer aulas do curso Saúde e Longevidade',
    expectedCourse: 'Saúde e Longevidade com Qi Gong',
  },
  {
    message: 'qual exercício você recomenda para o zumbido?',
    expectedCourse: null, // Sem menção de curso
  },
  {
    message: 'No curso longevidade e independência, qual é o primeiro exercício?',
    expectedCourse: 'Longevidade & Independência com Qi Gong',
  },
  {
    message: 'Me mostra um vídeo de qi gong',
    expectedCourse: null, // Genérico, sem curso específico
  },
]

async function runTests() {
  console.log('🧪 Testing Course Intent Detection\n')
  console.log('='.repeat(70))

  let passed = 0
  let failed = 0

  for (const test of testCases) {
    try {
      const result = await detectCourseIntent(test.message)

      const courseName = result?.courseName
      const success = courseName === test.expectedCourse

      if (success) {
        console.log(`✅ PASS: "${test.message}"`)
        console.log(`   → Detected: ${courseName || '(no course)'}`)
        passed++
      } else {
        console.log(`❌ FAIL: "${test.message}"`)
        console.log(`   Expected: ${test.expectedCourse || '(no course)'}`)
        console.log(`   Got: ${courseName || '(no course)'}`)
        if (result) {
          console.log(`   Confidence: ${result.confidence}`)
        }
        failed++
      }
      console.log()
    } catch (error) {
      console.log(`❌ ERROR: "${test.message}"`)
      console.log(`   ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests()
