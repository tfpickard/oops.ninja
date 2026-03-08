export const typescriptSdkSnippet = `export class OopsNinjaClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  async generate(payload: {
    scenario: string;
    mode: string;
    tone: 'empathetic' | 'neutral' | 'professional' | 'authoritative';
    formality?: 'casual' | 'standard' | 'executive';
    accountabilityPosture?: string;
    audience?: string;
    medium?: string;
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
