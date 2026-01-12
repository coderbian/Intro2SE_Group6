import Markdown from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-sm max-w-none 
      prose-p:my-1 prose-p:leading-relaxed
      prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 
      prose-headings:my-2 prose-headings:font-bold
      prose-strong:font-semibold prose-strong:text-gray-900
      prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg
      prose-a:text-purple-600 prose-a:underline
      ${className}`}
        >
            <Markdown>{content}</Markdown>
        </div>
    );
}
