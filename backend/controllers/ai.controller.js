import * as ai from '../services/ai.service.js';


export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        if (!prompt) {
            return res.status(400).json({ 
                text: 'Prompt is required',
                fileTree: null
            });
        }
        
        console.log('Generating AI response for prompt:', prompt);
        const result = await ai.generateResult(prompt);
        
        try {
            let response;
            // If the result is already an object, use it directly
            if (typeof result === 'object' && result !== null) {
                response = result;
            } 
            // If it's a string, try to parse it as JSON
            else if (typeof result === 'string') {
                try {
                    response = JSON.parse(result);
                } catch (e) {
                    // If not JSON, wrap in text property
                    response = { text: result };
                }
            }
            
            // Ensure the response has the expected format
            if (!response.text && !response.fileTree) {
                // If it's an object but not in the expected format, stringify it
                response = { 
                    text: JSON.stringify(response, null, 2),
                    fileTree: null
                };
            }
            
            res.json(response);
            
        } catch (e) {
            console.error('Error processing AI response:', e);
            // If anything goes wrong, return the raw result as text
            res.json({
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                fileTree: null
            });
        }
    } catch (error) {
        console.error('Error in getResult:', error);
        res.status(500).json({ 
            text: 'Sorry, an error occurred while processing your request.',
            fileTree: null
        });
    }
};