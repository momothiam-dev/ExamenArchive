function json(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    if (!process.env.OCR_API_KEY) return json(503, { error: 'OCR is not configured on the server' });

    try {
        const payload = JSON.parse(event.body || '{}');
        if (typeof payload.dataUrl !== 'string' || !payload.dataUrl.startsWith('data:')) {
            return json(400, { error: 'An image data URL is required' });
        }

        const formData = new FormData();
        formData.append('base64Image', payload.dataUrl);
        formData.append('language', 'fre');
        formData.append('isOverlayRequired', 'false');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: { apikey: process.env.OCR_API_KEY },
            body: formData
        });
        const data = await response.json();

        if (!response.ok) return json(response.status, { error: 'OCR request failed' });
        return json(200, data);
    } catch (error) {
        console.error('OCR function error:', error);
        return json(500, { error: 'Unable to process the OCR request' });
    }
};