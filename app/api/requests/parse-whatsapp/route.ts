import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
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

interface ParsedRequest {
  id: string // Temporary ID for frontend tracking
  club: string
  country: string
  league: string
  position: string
  windowCloseAt?: string
  dealType: string
  priority: string
  status: string
  ageMax?: number
  birthYear?: number
  notes?: string
  confidence: {
    club: number
    position: number
    overall: number
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Parse WhatsApp Request API called')

    // Check if OpenAI is available
    if (!openai) {
      console.warn('OpenAI API not available - missing OPENAI_API_KEY')
      return NextResponse.json(
        { success: false, error: 'AI service not available. Please add OPENAI_API_KEY to .env.local' },
        { status: 503 }
      )
    }

    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp text is required' },
        { status: 400 }
      )
    }

    console.log('📋 Parsing WhatsApp request text:', {
      textLength: text.length,
      preview: text.substring(0, 100)
    })

    // AI Prompt for parsing WhatsApp scout requests
    const systemPrompt = `Du är en expert på att parse scout requests från WhatsApp meddelanden till strukturerad data.

PARSING REGLER:

1. KLUBBAR & POSITIONER:
   - Klubbnamn gäller för alla positioner under tills nästa klubb nämns
   - Varje position på egen rad = en separat request
   - Exempel:
     "Beşiktaş
      Right winger
      Striker"
     → 2 requests (Beşiktaş RW, Beşiktaş ST)

2. POSITION MAPPNING (svenska/engelska → kod):
   - "Right winger", "Right-Winger", "RW" → "RW"
   - "Left winger", "Left-Winger", "LW" → "LW"
   - "Striker", "Forward", "Anfallare" → "ST"
   - "Centre-Back", "Central defender", "Mittback" → "CB"
   - "Right-Back", "Högerback" → "RB"
   - "Left-Back", "Vänsterback" → "LB"
   - "Defensive Midfield", "DMF", "Defensiv mittfältare" → "DMF"
   - "Central Midfield", "CMF", "Mittfältare" → "CMF"
   - "Attacking Midfield", "AMF", "N10", "Offensiv mittfältare" → "AMF"
   - "Winger" (utan specifikation) → "W"
   - "Wing-Back" → "WB"

3. LAND & LIGA:
   - Emoji flags: 🇹🇷=Turkey, 🇸🇪=Sweden, 🇪🇸=Spain, 🇩🇪=Germany, 🇮🇹=Italy, 🇫🇷=France, etc.
   - "Süper Lig" → league: "Turkish Super League"
   - "1.Lig", "2nd Div" → league: "Turkish 2nd Division"
   - "Allsvenskan" → league: "Allsvenskan"
   - "La Liga" → league: "La Liga"
   - etc.

4. ÅLDERSKRAV:
   - "max. 23y.", "max 23" → ageMax: 23
   - "born 2002", "född 2002" → birthYear: 2002
   - Om inget nämns → lämna tomt

5. TRANSFERFÖNSTER:
   - "open till 12/09/25" → windowCloseAt: "2025-09-12"
   - "open till 31/01/25" → windowCloseAt: "2025-01-31"
   - Parse datum format DD/MM/YY eller DD/MM/YYYY

6. SPECIAL CASES:
   - "Right-Winger (can play Striker)" → position: "RW", notes: "Can play Striker"
   - Om position är oklar → position: "UNKNOWN", confidence.position: 0.3

7. CONFIDENCE SCORES (0.0-1.0):
   - 0.9-1.0: Mycket säker (tydlig match)
   - 0.6-0.9: Ganska säker (behöver lite tolkning)
   - 0.0-0.6: Osäker (behöver manual review)

OUTPUT FORMAT (JSON Array):
[
  {
    "id": "temp-1",
    "club": "Beşiktaş",
    "country": "Turkey",
    "league": "Turkish Super League",
    "position": "RW",
    "windowCloseAt": "2025-09-12",
    "dealType": "BUY,LOAN,FREE",
    "priority": "MEDIUM",
    "status": "OPEN",
    "ageMax": null,
    "birthYear": null,
    "notes": "",
    "confidence": {
      "club": 0.95,
      "position": 0.90,
      "overall": 0.92
    }
  }
]

VIKTIGT:
- Returnera ENDAST valid JSON array
- Inkludera ALLA requests från texten
- Använd temporary IDs (temp-1, temp-2, etc)
- Sätt dealType till "BUY,LOAN,FREE" om inget specifikt nämns
- Sätt priority till "MEDIUM" som default
- Sätt status till "OPEN" som default`

    const userPrompt = `Parse följande WhatsApp scout request text och returnera JSON array enligt formatet:

${text}

Returnera ENDAST JSON array, ingen annan text.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      response_format: { type: "json_object" }
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No response from AI')
    }

    console.log('🤖 AI Response:', responseText.substring(0, 200))

    // Parse AI response
    let parsedData
    try {
      parsedData = JSON.parse(responseText)

      // Handle if AI wraps the array in an object
      if (parsedData.requests && Array.isArray(parsedData.requests)) {
        parsedData = parsedData.requests
      } else if (!Array.isArray(parsedData)) {
        // If it's an object with keys, try to extract array
        const firstKey = Object.keys(parsedData)[0]
        if (Array.isArray(parsedData[firstKey])) {
          parsedData = parsedData[firstKey]
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError)
      return NextResponse.json(
        { success: false, error: 'AI returned invalid JSON. Please try again.' },
        { status: 500 }
      )
    }

    // Validate and enhance parsed data
    const requests: ParsedRequest[] = parsedData.map((req: any, index: number) => ({
      id: req.id || `temp-${index + 1}`,
      club: req.club || '',
      country: req.country || '',
      league: req.league || '',
      position: req.position || '',
      windowCloseAt: req.windowCloseAt || undefined,
      dealType: req.dealType || 'BUY,LOAN,FREE',
      priority: req.priority || 'MEDIUM',
      status: req.status || 'OPEN',
      ageMax: req.ageMax || undefined,
      birthYear: req.birthYear || undefined,
      notes: req.notes || '',
      confidence: {
        club: req.confidence?.club || 0.5,
        position: req.confidence?.position || 0.5,
        overall: req.confidence?.overall || 0.5
      }
    }))

    console.log('✅ Successfully parsed', requests.length, 'requests')

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length
    })

  } catch (error) {
    console.error('❌ Error parsing WhatsApp request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse WhatsApp text. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
