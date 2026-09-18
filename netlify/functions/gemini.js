const MODEL = 'gemini-3.6-flash';

function json(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    if (!process.env.GEMINI_API_KEY) return json(503, { error: 'Gemini is not configured on the server' });

    try {
        const payload = JSON.parse(event.body || '{}');
        if (typeof payload.prompt !== 'string' || !payload.prompt.trim()) {
            return json(400, { error: 'A prompt is required' });
        }

        const parts = [{ text: payload.prompt }];
        if (payload.image?.data && payload.image?.mimeType) {
            parts.push({
                inline_data: {
                    mime_type: payload.image.mimeType,
                    data: payload.image.data
                }
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: { maxOutputTokens: payload.maxOutputTokens || 4096 }
                })
            }
        );

        const data = await response.json();
        if (!response.ok) return json(response.status, { error: data.error?.message || 'Gemini request failed' });

        return json(200, {
            text: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        });
    } catch (error) {
        console.error('Gemini function error:', error);
        return json(500, { error: 'Unable to process the Gemini request' });
    }
};