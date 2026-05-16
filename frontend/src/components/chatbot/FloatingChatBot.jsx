import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { 
    FaRobot, FaUser, FaPaperPlane, FaTimes, FaMinus, 
    FaExpandArrowsAlt, FaTrashAlt, FaPlus 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import './FloatingChatBot.css';

const FloatingChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Window size and position state
    const [windowState, setWindowState] = useState({
        width: 380,
        height: 500,
        x: window.innerWidth - 420,
        y: window.innerHeight - 560
    });

    useEffect(() => {
        // Load history from localStorage
        const savedMessages = localStorage.getItem('chatbot_history');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            // Welcome message
            setMessages([
                { id: 1, text: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?", sender: 'ai', time: new Date() }
            ]);
        }
    }, []);

    useEffect(() => {
        // Save history to localStorage
        localStorage.setItem('chatbot_history', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            time: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await API.post('/ai/chat', { message: inputText });
            const aiMsg = {
                id: Date.now() + 1,
                text: response.data.response,
                sender: 'ai',
                time: new Date(),
                model: response.data.modelUsed
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                text: "Désolé, je rencontre une erreur de connexion.",
                sender: 'ai',
                time: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        if (window.confirm("Effacer tout l'historique ?")) {
            const welcome = [{ id: 1, text: "Nouvelle discussion commencée. Comment puis-je vous aider ?", sender: 'ai', time: new Date() }];
            setMessages(welcome);
            localStorage.removeItem('chatbot_history');
        }
    };

    if (!isOpen) {
        return (
            <div className="chatbot-container" style={{ bottom: '30px', right: '30px' }}>
                <button className="chatbot-fab" onClick={() => setIsOpen(true)}>
                    <FaRobot size={28} />
                </button>
            </div>
        );
    }

    return (
        <div className="chatbot-container">
            <Rnd
                size={{ width: windowState.width, height: isMinimized ? 60 : windowState.height }}
                position={{ x: windowState.x, y: windowState.y }}
                onDragStop={(e, d) => setWindowState(prev => ({ ...prev, x: d.x, y: d.y }))}
                onResizeStop={(e, direction, ref, delta, position) => {
                    setWindowState({
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        ...position
                    });
                }}
                minWidth={300}
                minHeight={isMinimized ? 60 : 400}
                dragHandleClassName="chatbot-header"
                bounds="window"
                enableResizing={!isMinimized}
            >
                <div className="chatbot-window" style={{ height: '100%' }}>
                    <div className="chatbot-header">
                        <div className="chatbot-header-title">
                            <FaRobot />
                            <span>Assistant IA SmartPFE</span>
                        </div>
                        <div className="chatbot-header-actions">
                            <button className="chatbot-header-btn" onClick={clearHistory} title="Nouvelle discussion">
                                <FaPlus size={12} />
                            </button>
                            <button className="chatbot-header-btn" onClick={() => setIsMinimized(!isMinimized)}>
                                <FaMinus size={12} />
                            </button>
                            <button className="chatbot-header-btn" onClick={() => setIsOpen(false)}>
                                <FaTimes size={12} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            <div className="chatbot-messages">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`message-bubble ${msg.sender === 'user' ? 'message-user' : 'message-ai'}`}>
                                        <div className={`message-avatar ${msg.sender === 'user' ? 'avatar-user' : 'avatar-ai'}`}>
                                            {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
                                        </div>
                                        {msg.text}
                                        {msg.model && (
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                                                {msg.model}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="message-bubble message-ai">
                                        <div className="typing-indicator">
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chatbot-input-container" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chatbot-input"
                                    placeholder="Posez votre question..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isTyping}
                                />
                                <button type="submit" className="chatbot-send-btn" disabled={isTyping || !inputText.trim()}>
                                    <FaPaperPlane size={16} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </Rnd>
        </div>
    );
};

export default FloatingChatBot;
