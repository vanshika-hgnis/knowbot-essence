


export interface DiagramRequest {
    query: string;
    user_id?: string;
    notebook_id?: string;
    diagramType?: 'mindmap' | 'flowchart' | 'graph' | 'sequenceDiagram';
    diagramConfig?: {
        theme?: string;
        fontSize?: number;
        nodeSpacing?: number;
        rankSpacing?: number;
    };
}


export const DIAGRAM_PROMPT_TEMPLATES = {
    mindmap: `You are a mindmap expert. Convert this information into a Mermaid mindmap.
    Rules:
    1. Use proper Mermaid mindmap syntax
    2. Center the main concept
    3. Use 2-3 word node labels
    4. Maintain clear hierarchy
    5. Return ONLY the Mermaid code between \`\`\`mermaid and \`\`\`
    
    Context: {context}
    Query: {query}`,

    flowchart: `You are a flowchart expert. Convert this process into a Mermaid flowchart.
    Rules:
    1. Use TB (top-bottom) orientation
    2. Use rectangular nodes for steps
    3. Use diamond nodes for decisions
    4. Keep node text under 5 words
    5. Return ONLY the Mermaid code between \`\`\`mermaid and \`\`\`
    
    Context: {context}
    Query: {query}`,

    sequenceDiagram: `You are a sequence diagram expert. Convert this interaction into Mermaid syntax.
    Rules:
    1. Show participants on top
    2. Use solid arrows for synchronous messages
    3. Use dotted arrows for asynchronous
    4. Keep message texts concise
    5. Return ONLY the Mermaid code between \`\`\`mermaid and \`\`\`
    
    Context: {context}
    Query: {query}`
};
