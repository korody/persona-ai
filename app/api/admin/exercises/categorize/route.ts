import { NextResponse } from 'next/server'
import { runBatchAutoCategorize } from '@/lib/ai/actions'

export async function POST() {
    try {
        const result = await runBatchAutoCategorize()

        return NextResponse.json({
            success: true,
            categorized: result.categorized,
            skipped: result.skipped,
            errors: result.errors,
            total: result.total
        })
    } catch (error) {
        console.error('Error in categorization API:', error)
        return NextResponse.json(
            { error: 'Failed to categorize exercises', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
