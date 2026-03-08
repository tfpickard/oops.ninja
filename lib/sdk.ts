export const typescriptSdkSnippet = `export class OopsNinjaClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  async generate(payload: {
    scenario: string;
    mode: string;
    tone: string;
    formality?: string;
    accountabilityPosture?: string;
    audience?: string;
    medium?: string;
    llm?: {
      provider?: 'openai' | 'anthropic' | 'openrouter';
      model?: string;
      reasoningEffort?: 'minimal' | 'none' | 'low' | 'medium' | 'high' | 'xhigh';
      verbosity?: 'low' | 'medium' | 'high';
    };
  }) {
    const response = await fetch(\`${'${this.baseUrl}'}/api/v1/generate\`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Generation request failed');
    }

    return response.json();
  }
}`;
