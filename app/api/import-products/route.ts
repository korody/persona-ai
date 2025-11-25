import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface CSVProduct {
  'Nome do Produto': string
  'Acesso': string
  'CAMPANHAS': string
  'Categoria': string
  'Descrição': string
  'Pra que Serve': string
  'Sigla': string
  'Status': string
  'Tipo': string
  'URL Memberkit': string
  'URL de vendas': string
  'Valor Prateleira': string
  'Valor Praticado': string
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const avatarSlug = formData.get('avatarSlug') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      )
    }

    if (!avatarSlug) {
      return NextResponse.json(
        { error: 'Avatar slug não informado' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    let parsedData: CSVProduct[] = []

    if (isExcel) {
      // Processar arquivo Excel
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      parsedData = XLSX.utils.sheet_to_json<CSVProduct>(worksheet, { 
        raw: false,
        defval: ''
      })
    } else {
      // Processar arquivo CSV
      const text = await file.text()
      const parsed = Papa.parse<CSVProduct>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      })

      if (parsed.errors.length > 0) {
        return NextResponse.json(
          { error: 'Erro ao processar CSV', details: parsed.errors },
          { status: 400 }
        )
      }

      parsedData = parsed.data
    }

    const supabase = await createClient()

    // Processar cada linha
    const products = parsedData
      .filter(row => row['Nome do Produto'] && row['Status'] !== 'Descontinuado')
      .map(row => {
        // Extrair preço praticado
        let price = null
        if (row['Valor Praticado']) {
          const originalValue = row['Valor Praticado']
          
          // Converter para string e limpar
          let priceStr = originalValue
            .toString()
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .trim()
          
          // Se a string estiver vazia após limpeza, pular
          if (!priceStr) {
            price = null
          }
          // Detectar formato misto: tem vírgula E ponto (ex: 12,000.00 ou 1,197.00)
          // Neste caso, vírgula é separador de milhares e ponto é decimal
          else if (priceStr.includes(',') && priceStr.includes('.')) {
            // Formato: 1,197.00 ou 12,000.00 (vírgula = milhares, ponto = decimal)
            priceStr = priceStr.replace(/,/g, '')  // Remove vírgulas (milhares)
            const parsedPrice = parseFloat(priceStr)
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice
            }
          }
          // Só tem vírgula, sem ponto (ex: 297,00 - formato BR)
          else if (priceStr.includes(',') && !priceStr.includes('.')) {
            // Formato brasileiro puro: 297,00
            priceStr = priceStr
              .replace(/\./g, '')  // Remove pontos (se houver)
              .replace(',', '.')   // Converte vírgula para ponto decimal
            
            const parsedPrice = parseFloat(priceStr)
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice
            }
          }
          // Só tem ponto, sem vírgula
          else if (priceStr.includes('.')) {
            const parsedPrice = parseFloat(priceStr)
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice
            }
          }
          // Apenas números
          else {
            const parsedPrice = parseFloat(priceStr)
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice
            }
          }
        }

        // Mapear tipo de produto
        const typeMap: Record<string, string> = {
          'Curso Gravado': 'curso',
          'Workshop': 'workshop',
          'Lives': 'live',
          'E-book': 'ebook',
          'Livro': 'livro',
          'Produto Físico': 'produto-fisico',
          'Evento Presencial': 'evento-presencial',
          'Evento Online': 'evento-online',
          'Mentoria': 'mentoria',
          'Sessão Individual': 'sessao-individual',
          'Comunidade': 'comunidade',
          'Clube': 'clube',
          'Desafio': 'desafio',
          'AI as a Service': 'ai-service'
        }

        const productType = typeMap[row['Tipo']] || row['Tipo']?.toLowerCase() || 'outro'

        // Extrair tags da categoria (mas NÃO incluir o tipo, pois já está em product_type)
        const tags = []
        if (row['Categoria']) {
          tags.push(row['Categoria'].toLowerCase())
        }
        // Removido: não adicionar o Tipo nas tags pois já está em product_type

        // Detectar elemento baseado na descrição/nome
        let element = null
        const fullText = (row['Nome do Produto'] + ' ' + row['Descrição']).toLowerCase()
        
        if (fullText.includes('metal') || fullText.includes('pulmão') || fullText.includes('respiração')) {
          element = 'METAL'
        } else if (fullText.includes('fogo') || fullText.includes('coração')) {
          element = 'FOGO'
        } else if (fullText.includes('terra') || fullText.includes('baço') || fullText.includes('digestão')) {
          element = 'TERRA'
        } else if (fullText.includes('água') || fullText.includes('rim') || fullText.includes('longevidade')) {
          element = 'ÁGUA'
        } else if (fullText.includes('madeira') || fullText.includes('fígado') || fullText.includes('movimento')) {
          element = 'MADEIRA'
        }

        // Determinar se é featured baseado na categoria
        const isFeatured = row['Categoria'] === 'Front End' || row['Categoria'] === 'High End'

        return {
          avatar_slug: avatarSlug,
          product_name: row['Nome do Produto'].trim(),
          product_type: productType,
          product_description: row['Descrição']?.trim() || '',
          product_price_brl: price,
          product_url: row['URL de vendas']?.trim() || '',
          memberkit_url: row['URL Memberkit']?.trim() || null,
          tags: tags.length > 0 ? tags : null,
          element: element,
          is_available: row['Status'] === 'Ativo' || row['Status'] === 'Planejado',
          is_featured: isFeatured,
          recommended_for: row['Pra que Serve']?.trim() || '',
          benefits: row['Pra que Serve']?.trim() || ''
        }
      })

    // Inserir produtos no banco
    const { data, error } = await supabase
      .from('avatar_portfolio')
      .insert(products)
      .select()

    if (error) {
      console.error('Erro ao inserir produtos:', error)
      return NextResponse.json(
        { error: 'Erro ao importar produtos', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      products: data
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar importação' },
      { status: 500 }
    )
  }
}
