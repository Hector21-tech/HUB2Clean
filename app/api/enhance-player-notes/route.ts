import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI only if API key is available
let openai: OpenAI | null = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Enhance Player Notes API called')

    // Check if OpenAI is available
    if (!openai) {
      console.warn('OpenAI API not available - missing OPENAI_API_KEY')
      return NextResponse.json(
        { success: false, error: 'AI service not available. Please contact administrator.' },
        { status: 503 }
      )
    }

    const { notes, playerInfo } = await request.json()

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { success: false, error: 'Notes text is required' },
        { status: 400 }
      )
    }

    console.log('📋 Enhancing notes for player:', {
      name: `${playerInfo?.firstName} ${playerInfo?.lastName}`,
      originalLength: notes.length
    })

    // Create a prompt that improves grammar, structure AND adds football terminology
    const prompt = `Du är en professionell fotbollsscout som förbättrar scout-anteckningar.

HUVUDUPPDRAG: Förbättra texten med professionella fotbollstermer och scout-språk.

Du får:
- Rätta grammatik och stavfel
- Förbättra meningsstruktur och flyt
- Använda professionella fotbollstermer och scout-språk
- Göra texten mer teknisk och specifik
- Behålla EXAKT samma faktiska information och betydelse

PROFESSIONELLA FOTBOLLSTERMER att använda när relevant:
- Tekniska: bollbehandling, första touch, speluppfattning, rymdkänsla, passningsspel
- Fysiska: explosivitet, uthållighet, styrka i dueller, snabbhet, vändighet
- Mentala: spelförståelse, beslutsfattande, lagarbete, ledarskap, press-resistens
- Positionsspel: positionering, defensiv stabilitet, offensiv närvaro
- Taktiska: pressing, uppbyggnadsspel, övergångsspel, rumsuppfattning

ABSOLUT FÖRBUD MOT:
- Att lägga till ny information som inte finns
- Att hitta på fakta, siffror eller detaljer
- Att ändra grundläggande betydelse
- Att spekulera om prestationer som inte nämns

Spelarinformation (för kontext):
- Namn: ${playerInfo?.firstName || 'Okänd'} ${playerInfo?.lastName || ''}
- Position: ${playerInfo?.position || 'Okänd'}
- Klubb: ${playerInfo?.club || 'Okänd'}
- Nationalitet: ${playerInfo?.nationality || 'Okänd'}
- Ålder: ${playerInfo?.age || 'Okänd'}

Ursprungliga scout-anteckningar att förbättra:
"${notes}"

FÖRBÄTTRA genom att:
1. Rätta grammatik och språkfel
2. Använd professionella fotbollstermer där relevant
3. Gör texten mer teknisk och scout-liknande
4. Behåll EXAKT samma faktiska innehåll och mening
5. Skriv som en professionell scout skulle skriva

EXEMPEL TRANSFORMATION:
"snabb spelare, bra skott" → "Visar god explosivitet och snabbhet, kombinerat med kvalitativ avslutningsförmåga"
"duktig försvarare" → "Stark defensiv närvaro med god positionering och duellstyrka"

Ge tillbaka den förbättrade texten utan förklaringar eller kommentarer.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du är en professionell fotbollsscout och expert på scout-rapporter. Förbättra texten med fotbollstermer och professionellt språk. Du MÅSTE behålla exakt samma faktiska information och ALDRIG lägga till ny information. Fokusera på grammatik, fotbollsterminologi och professionell scout-stil."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3, // Lower temperature for more consistent results
    })

    const enhancedNotes = completion.choices[0]?.message?.content

    if (!enhancedNotes) {
      throw new Error('Failed to enhance notes')
    }

    console.log('✅ Notes enhanced successfully:', {
      originalLength: notes.length,
      enhancedLength: enhancedNotes.length
    })

    return NextResponse.json({
      success: true,
      enhancedNotes: enhancedNotes.trim()
    })

  } catch (error) {
    console.error('❌ Error enhancing player notes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enhance notes. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}