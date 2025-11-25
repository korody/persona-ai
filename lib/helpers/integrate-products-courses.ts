/**
 * Script para integrar produtos do portfolio com cursos do Memberkit
 * Faz match automático baseado em similaridade de nomes
 */

import { createClient } from '@/lib/supabase/server'

interface Course {
  memberkit_course_id: number
  course_name: string
  course_url: string
  memberkit_course_slug: string
}

interface Product {
  id: string
  product_name: string
  memberkit_course_id: number | null
  memberkit_url: string | null
}

/**
 * Calcula similaridade entre duas strings (Levenshtein distance normalizada)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = []
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue
    }
  }
  
  return costs[s2.length]
}

/**
 * Encontra o melhor match entre um produto e os cursos
 */
function findBestCourseMatch(productName: string, courses: Course[]): {
  course: Course | null
  similarity: number
} {
  let bestMatch: Course | null = null
  let bestSimilarity = 0
  
  for (const course of courses) {
    const similarity = calculateSimilarity(productName, course.course_name)
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = course
    }
  }
  
  return { course: bestMatch, similarity: bestSimilarity }
}

export async function integrateProductsWithCourses(
  avatarSlug: string,
  minSimilarity: number = 0.6 // Threshold mínimo de 60%
): Promise<{
  success: boolean
  matched: number
  notMatched: number
  details: Array<{
    productName: string
    courseName: string | null
    similarity: number
    updated: boolean
  }>
}> {
  const supabase = await createClient()
  
  // 1. Buscar todos os cursos
  const { data: courses, error: coursesError } = await supabase
    .from('hub_courses')
    .select('memberkit_course_id, course_name, course_url, memberkit_course_slug')
    .eq('is_published', true)
  
  if (coursesError || !courses) {
    throw new Error(`Erro ao buscar cursos: ${coursesError?.message}`)
  }
  
  // 2. Buscar todos os produtos do avatar
  const { data: products, error: productsError } = await supabase
    .from('avatar_portfolio')
    .select('id, product_name, memberkit_course_id, memberkit_url')
    .eq('avatar_slug', avatarSlug)
  
  if (productsError || !products) {
    throw new Error(`Erro ao buscar produtos: ${productsError?.message}`)
  }
  
  const details: Array<{
    productName: string
    courseName: string | null
    similarity: number
    updated: boolean
  }> = []
  
  let matched = 0
  let notMatched = 0
  
  // 3. Para cada produto, encontrar melhor match
  for (const product of products) {
    const { course, similarity } = findBestCourseMatch(product.product_name, courses)
    
    if (course && similarity >= minSimilarity) {
      // Match encontrado - atualizar produto
      const { error: updateError } = await supabase
        .from('avatar_portfolio')
        .update({
          memberkit_course_id: course.memberkit_course_id,
          memberkit_url: course.course_url
        })
        .eq('id', product.id)
      
      if (!updateError) {
        matched++
        details.push({
          productName: product.product_name,
          courseName: course.course_name,
          similarity: Math.round(similarity * 100) / 100,
          updated: true
        })
      } else {
        details.push({
          productName: product.product_name,
          courseName: course.course_name,
          similarity: Math.round(similarity * 100) / 100,
          updated: false
        })
      }
    } else {
      // Nenhum match aceitável
      notMatched++
      details.push({
        productName: product.product_name,
        courseName: course ? course.course_name : null,
        similarity: course ? Math.round(similarity * 100) / 100 : 0,
        updated: false
      })
    }
  }
  
  return {
    success: true,
    matched,
    notMatched,
    details
  }
}
