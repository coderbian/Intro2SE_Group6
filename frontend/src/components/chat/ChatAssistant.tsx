import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '../../types';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatAssistantProps {
    project?: Project | null;
}

interface Position {
    x: number;
    y: number;
}

export function ChatAssistant({ project }: ChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 24, y: 24 }); // bottom-right offset
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus textarea when chat opens
    useEffect(() => {
        if (isOpen) {
            textareaRef.current?.focus();
        }
    }, [isOpen]);

    // Drag handlers
    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragRef.current = {
            startX: clientX,
            startY: clientY,
            startPosX: position.x,
            startPosY: position.y,
        };
        setIsDragging(true);
    }, [position]);

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !dragRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = dragRef.current.startX - clientX;
        const deltaY = dragRef.current.startY - clientY;

        const newX = Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.startPosX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.startPosY + deltaY));

        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        dragRef.current = null;
    }, []);

    // Add/remove global listeners for drag
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Build project context for AI
    const getProjectContext = () => {
        if (!project) return undefined;
        return `Tên dự án: ${project.name}
Mô tả: ${project.description || 'Không có'}
Deadline: ${project.deadline}
Template: ${project.template}
Số thành viên: ${project.members?.length || 0}`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { chat } = await import('../../lib/aiService');
            const reply = await chat(input.trim(), messages, getProjectContext());

            const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Lỗi khi gửi tin nhắn. Vui lòng thử lại.');
            // Remove the user message if AI fails
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <>
            {/* Floating Button with Label */}
            <div
                className="fixed z-50 flex items-center gap-2"
                style={{ bottom: position.y, right: position.x }}
            >
                {/* Drag Handle - shows when chat is closed */}
                {!isOpen && (
                    <div
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                        className={`bg-white shadow-lg rounded-full p-2 border cursor-move hover:bg-gray-50 transition-colors ${isDragging ? 'ring-2 ring-purple-400' : ''}`}
                        title="Kéo để di chuyển"
                    >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                )}

                {/* Label - always rendered with transition */}
                <div
                    className={`bg-white shadow-lg rounded-full px-4 py-2 border hidden sm:flex items-center gap-2 transition-all duration-300 ${!isOpen && !isDragging
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-4 pointer-events-none'
                        }`}
                >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Hỏi AI Assistant</span>
                </div>

                {/* Button */}
                <button
                    onClick={() => !isDragging && setIsOpen(!isOpen)}
                    className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group ${isOpen
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        }`}
                    title={isOpen ? "Đóng chat" : "Mở AI Assistant"}
                >
                    {/* Pulse animation when closed */}
                    {!isOpen && !isDragging && (
                        <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30" />
                    )}

                    {/* Icons with smooth transition */}
                    <span className="relative w-6 h-6">
                        <X
                            className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
                                }`}
                        />
                        <MessageCircle
                            className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${isOpen ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                        />
                    </span>
                </button>
            </div>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="fixed z-50 w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                    style={{ bottom: position.y + 70, right: position.x }}
                >
                    {/* Header with drag handle */}
                    <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center gap-3 cursor-move"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold">AI Assistant</h3>
                            <p className="text-white/80 text-xs">Hỗ trợ quản lý dự án</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-white/80 hover:text-white hover:bg-white/20 text-xs h-7"
                        >
                            Xóa chat
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <Bot className="w-16 h-16 mb-4 text-gray-300" />
                                <p className="font-medium mb-2">Xin chào! 👋</p>
                                <p className="text-sm">Tôi là AI Assistant của Planora.</p>
                                <p className="text-sm">Hãy hỏi tôi về quản lý dự án!</p>
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={() => setInput('Làm sao để ước tính story points?')}
                                        className="text-xs bg-white border rounded-full px-3 py-1.5 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                    >
                                        💡 Làm sao để ước tính story points?
                                    </button>
                                    <button
                                        onClick={() => setInput('Scrum và Kanban khác nhau thế nào?')}
                                        className="text-xs bg-white border rounded-full px-3 py-1.5 hover:bg-purple-50 hover:border-purple-300 transition-colors block"
                                    >
                                        📋 Scrum và Kanban khác nhau thế nào?
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                                        : 'bg-white border shadow-sm rounded-bl-md'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t">
                        <div className="flex gap-2">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                className="resize-none min-h-[44px] max-h-24 text-sm"
                                rows={1}
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Powered by Google Gemini
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
