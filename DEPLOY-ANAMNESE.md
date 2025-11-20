# 🚀 Deploy Anamnese + RAG System

## ✅ What's Already Done

All code is implemented and ready:
- ✅ `lib/types/anamnese.ts` - Type definitions
- ✅ `lib/helpers/anamnese-helpers.ts` - Helper functions
- ✅ `lib/rag/vector-search.ts` - Enhanced with anamnese-aware search
- ✅ `app/api/chat/route.ts` - Integrated with elemento filtering
- ✅ `app/api/avatar-training/knowledge/route.ts` - Fixed metadata parsing

## 📋 SQL Migration Needed

**ONLY ONE STEP**: Run the SQL migration in Supabase

### Instructions:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql/new

2. **Copy the SQL**
   - Open: `supabase/migrations/anamnese-complete.sql`
   - Copy ALL content

3. **Execute**
   - Paste in SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see: "Anamnese RAG functions created successfully!"

## 🧪 Test After Deployment

### Test 1: Add Knowledge with Metadata

Try adding knowledge in the training interface with metadata:

```
METADATA_DOCUMENTO:
elemento: METAL
orgaos: [Pulmao, Intestino Grosso]
sintomas_fisicos: [problemas_respiratorios, pele_seca, constipacao, tosse_cronica]
sintomas_emocionais: [tristeza, melancolia, dificuldade_soltar, apego_excessivo]
tipo_conteudo: diagnostico_completo
---

[Your content here...]
```

**Expected**: Knowledge saved successfully with metadata parsed

### Test 2: Chat with User Who Has Quiz

1. Make sure you have a quiz record in `quiz_leads` table
2. Chat with the avatar
3. Check browser console logs

**Expected logs**:
```
🎯 Anamnese-aware search for elemento: RIM (intensidade: 4)
✅ Found 5 knowledge items with anamnese filtering
   Primary elemento matches: 2
   Secondary elemento matches: 1
```

### Test 3: Chat with User Without Quiz

1. Use a different email (no quiz record)
2. Chat with the avatar

**Expected logs**:
```
🔍 Generic search (no anamnese data)
✅ Found 5 knowledge items (generic search)
```

## 🎯 How It Works

### User WITH Quiz (Anamnese):
1. System loads: `elemento_principal`, `contagem_elementos`, `intensidade_calculada`
2. Calculates secondary elementos (score > 2)
3. RAG search filtered by:
   - **Primary elemento** (highest priority)
   - **Secondary elementos** (medium priority)
   - **General knowledge** (lowest priority)
4. Filters by `intensidade_calculada` to match severity
5. Context shows "⭐ ELEMENTO PRINCIPAL" badges

### User WITHOUT Quiz:
1. Uses generic RAG search (no filters)
2. Shows friendly invitation to take quiz
3. Natural suggestions after 2-3 messages

## 🔍 Verify Functions in Database

Run this query to check functions were created:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%knowledge%'
ORDER BY routine_name;
```

**Expected results**:
- `insert_knowledge_with_embedding`
- `search_knowledge_generic`
- `search_knowledge_with_anamnese`

## 🐛 Troubleshooting

### Error: "Failed to create knowledge"
- ✅ **Fixed**: Updated API to parse metadata and use RPC function
- Just run the SQL migration

### PostgREST cache issues
- All functions use `NOTIFY pgrst, 'reload schema'`
- Or manually: Settings → API → "Restart API server"

### RPC function not found
- Verify function exists: Check "Database → Functions" in Supabase
- Re-run the migration SQL

## 📊 Expected Behavior

| User State | Search Type | Filtering | Context |
|------------|-------------|-----------|---------|
| Has Quiz | `searchKnowledgeWithAnamnese()` | By elemento + intensidade | Shows elemento badges |
| No Quiz | `searchKnowledgeGeneric()` | None | Suggests quiz |

## ✨ Next Steps After Deployment

1. Add knowledge entries with elemento metadata (METAL, RIM, FÍGADO, etc.)
2. Test chat with users who have different elementos
3. Verify RAG returns elemento-specific knowledge first
4. Check console logs show correct filtering

---

**Status**: Ready to deploy - just run the SQL migration! 🚀
