import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessment } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `You are a skincare expert. Based on this user profile, recommend 4-6 skincare products.

User Profile:
- Age: ${assessment.age_range}
- Skin Type: ${assessment.skin_type}
- Concerns: ${assessment.skin_concerns?.join(', ') || 'None specified'}
- Climate: ${assessment.climate}
- Allergies: ${assessment.allergies?.join(', ') || 'None'}
- Goals: ${assessment.skin_goals || 'General skincare improvement'}
- Budget: ${assessment.budget_range}

Return a JSON object with:
{
  "summary": "Brief personalized summary",
  "products": [
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "description": "What this product does",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "priceRange": "$" or "$$" or "$$$",
      "whySuitable": "Why this is good for this user's skin",
      "usageInstructions": "How to use"
    }
  ]
}

Recommend real, popular skincare products that are widely available.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert skincare consultant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean up markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      result = {
        summary: 'Based on your skin profile, we recommend a gentle routine.',
        products: []
      };
    }

    // Try to enrich with Firecrawl if available
    if (FIRECRAWL_API_KEY && result.products?.length > 0) {
      try {
        const searchQuery = `${result.products[0].brand} ${result.products[0].name} buy`;
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: searchQuery, limit: 1 }),
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data?.[0]?.url) {
            result.products[0].productUrl = searchData.data[0].url;
          }
        }
      } catch (e) {
        console.log('Firecrawl enrichment failed, continuing without URLs');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
