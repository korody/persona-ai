import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      )
    }

    // Buscar a página
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Não foi possível acessar a URL' },
        { status: 400 }
      )
    }

    const html = await response.text()
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Extrair informações
    const data = {
      title: '',
      description: '',
      price: null as number | null,
      image: '',
      type: ''
    }

    // 1. Título - tentar múltiplas fontes
    data.title = 
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('title')?.textContent?.trim() ||
      ''

    // 2. Descrição
    data.description = 
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      document.querySelector('p')?.textContent?.trim() ||
      ''

    // 3. Preço - tentar encontrar em vários formatos
    const priceSelectors = [
      '[itemprop="price"]',
      '.price',
      '[class*="price"]',
      '[class*="valor"]',
      'meta[property="product:price:amount"]'
    ]

    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector)
      if (priceElement) {
        const priceText = priceElement.getAttribute('content') || priceElement.textContent || ''
        // Extrair números e converter
        const priceMatch = priceText.match(/[\d.,]+/)
        if (priceMatch) {
          const cleanPrice = priceMatch[0].replace(/\./g, '').replace(',', '.')
          const parsedPrice = parseFloat(cleanPrice)
          if (!isNaN(parsedPrice)) {
            data.price = parsedPrice
            break
          }
        }
      }
    }

    // 4. Imagem
    data.image = 
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
      document.querySelector('img')?.getAttribute('src') ||
      ''

    // 5. Tipo de conteúdo (curso, evento, etc)
    const typeKeywords = {
      curso: ['curso', 'course', 'aula', 'treinamento'],
      evento: ['evento', 'event', 'workshop', 'imersão', 'retiro'],
      ebook: ['ebook', 'e-book', 'livro', 'book'],
      mentoria: ['mentoria', 'coaching', 'consultoria']
    }

    const fullText = (data.title + ' ' + data.description).toLowerCase()
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        data.type = type
        break
      }
    }

    // Limpar descrição muito longa
    if (data.description.length > 500) {
      data.description = data.description.substring(0, 497) + '...'
    }

    return NextResponse.json({
      success: true,
      data: {
        product_name: data.title,
        product_description: data.description,
        product_price_brl: data.price,
        product_type: data.type,
        product_url: url,
        image_url: data.image
      }
    })

  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar URL' },
      { status: 500 }
    )
  }
}
