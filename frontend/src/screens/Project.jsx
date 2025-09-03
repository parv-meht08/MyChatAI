import React from 'react';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useUser } from '../context/user.context';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, removeListener, sendMessage, isSocketConnected } from '../config/socket';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer';

// Helper component for syntax highlighting
function SyntaxHighlightedCode({ className, children }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && window.hljs) {
            // If it's a JSON string, try to format it
            if (typeof children === 'string' && (className?.includes('json') || children.trim().startsWith('{') || children.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(children);
                    children = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    // Not valid JSON, use as is
                }
            }
            
            const codeElement = ref.current;
            codeElement.textContent = children;
            window.hljs.highlightElement(codeElement);
            codeElement.style.whiteSpace = 'pre-wrap';
            codeElement.style.wordBreak = 'break-word';
        }
    }, [className, children]);
    
    return (
        <pre className="bg-gray-800 p-4 rounded-md overflow-auto my-2">
            <code ref={ref} className={`${className || ''} text-sm`}>
                {children}
            </code>
        </pre>
    );
}
SyntaxHighlightedCode.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
};

// --- ✨ AI MESSAGE COMPONENT ---
function AiMessage({ message }) {
    // If message is a string, try to parse it as JSON
    const normalizedMessage = React.useMemo(() => {
        if (!message) return { text: '' };
        
        // If message is already in the correct format
        if (typeof message === 'object' && message !== null) {
            // Handle React boilerplate format
            if (message.text && message.fileTree) {
                return message;
            }
            // Handle fileTree at root level (for backward compatibility)
            if (message.fileTree) {
                return { fileTree: message.fileTree };
            }
            return message;
        }
        
        // If message is a string, try to parse it
        if (typeof message === 'string') {
            try {
                const parsed = JSON.parse(message);
                if (typeof parsed === 'object' && parsed !== null) {
                    // Handle React boilerplate format
                    if (parsed.fileTree) {
                        return parsed;
                    }
                    return parsed;
                }
                return { text: message };
            } catch (e) {
                return { text: message };
            }
        }
        
        return { text: String(message) };
    }, [message]);

    // Function to render file tree recursively as JSX
    const renderFileTree = (tree, path = '') => {
        if (!tree || typeof tree !== 'object') return null;
        
        return Object.entries(tree).map(([key, value]) => {
            if (!value) return null;
            
            const currentPath = path ? `${path}/${key}` : key;
            
            // Handle file with contents
            if (value.file && value.file.contents) {
                const extension = key.split('.').pop().toLowerCase();
                const languageMap = {
                    'js': 'javascript',
                    'jsx': 'javascript',
                    'ts': 'typescript',
                    'tsx': 'typescript',
                    'py': 'python',
                    'json': 'json',
                    'html': 'html',
                    'css': 'css',
                    'md': 'markdown'
                };
                
                // Format file contents for better display
                let fileContents = value.file.contents;
                if (typeof fileContents === 'string') {
                    // Remove any leading/trailing whitespace and newlines
                    fileContents = fileContents.trim();
                }
                
                return (
                    <div key={currentPath} className="mt-3 mb-6 bg-gray-900 rounded-md overflow-hidden">
                        <div className="bg-gray-800 px-4 py-2 text-blue-300 font-mono text-sm flex items-center justify-between">
                            <span className="truncate">{currentPath}</span>
                            <span className="ml-2 text-xs text-gray-400">{extension.toUpperCase()}</span>
                        </div>
                        <div className="p-0 max-h-96 overflow-auto">
                            <SyntaxHighlightedCode className={`language-${languageMap[extension] || 'plaintext'}`}>
                                {fileContents}
                            </SyntaxHighlightedCode>
                        </div>
                    </div>
                );
            } 
            // Handle nested objects (directories)
            else if (typeof value === 'object' && value !== null) {
                return (
                    <div key={currentPath} className="mt-3">
                        <div className="text-yellow-300 font-mono text-sm font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {key}/
                        </div>
                        <div className="ml-6 border-l-2 border-gray-700 pl-4">
                            {renderFileTree(value, currentPath)}
                        </div>
                    </div>
                );
            }
            return null;
        });
    };

    // Format message text with proper markdown and code highlighting
    const formatMessageText = (text) => {
        if (!text) return null;
        
        // Check if text is a JSON string
        if (typeof text === 'string' && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try {
                const parsed = JSON.parse(text);
                if (typeof parsed === 'object' && parsed !== null) {
                    return (
                        <div className="mt-2">
                            <SyntaxHighlightedCode className="language-json">
                                {JSON.stringify(parsed, null, 2)}
                            </SyntaxHighlightedCode>
                        </div>
                    );
                }
            } catch (e) {
                // Not valid JSON, continue with normal rendering
            }
        }
        
        // Handle markdown content
        return (
            <div className='prose prose-sm prose-invert max-w-none'>
                <Markdown options={{ 
                    overrides: { 
                        code: SyntaxHighlightedCode,
                        pre: ({ children }) => (
                            <div className="my-2">
                                {children}
                            </div>
                        )
                    } 
                }}>
                    {text}
                </Markdown>
            </div>
        );
    };

    const { text, fileTree } = normalizedMessage;
    
    return (
        <div className='w-full'>
            {text && (
                <div className='mb-6 p-4 bg-gray-800 rounded-lg'>
                    {formatMessageText(text)}
                </div>
            )}
            {fileTree && (
                <div className='mt-6'>
                    <div className='flex items-center text-lg font-semibold mb-4 text-gray-200'>
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generated Project Structure
                    </div>
                    <div className='bg-gray-900 p-4 rounded-lg border border-gray-700'>
                        <div className='space-y-6'>
                            {renderFileTree(fileTree)}
                        </div>
                    </div>
                    {normalizedMessage.buildCommand && (
                        <div className='mt-6 bg-blue-900/20 p-4 rounded-lg border border-blue-800/50'>
                            <h4 className='text-blue-300 font-medium mb-2'>Build Commands</h4>
                            <div className='bg-gray-900 p-3 rounded font-mono text-sm overflow-x-auto'>
                                <div className='text-yellow-400'>$ {normalizedMessage.buildCommand.mainItem} {normalizedMessage.buildCommand.commands.join(' ')}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
AiMessage.propTypes = {
    message: PropTypes.shape({
        text: PropTypes.string,
        fileTree: PropTypes.object,
    }).isRequired,
};


const Project = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const [project, setProject] = useState(location.state?.project);
    const [message, setMessage] = useState('');
    const { user } = useUser();
    const messageBox = useRef();

    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});

    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);

    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);

    const [runProcess, setRunProcess] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    useEffect(() => {
        if (!location.state?.project) {
            navigate('/dashboard');
        }
    }, [location.state, navigate]);

    const handleUserClick = (id) => {
        setSelectedUserId(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data);
            setIsModalOpen(false);
        }).catch(err => console.log(err));
    }

    const send = async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        const isAIMessage = trimmedMessage.startsWith('@ai');
        let messageToSend = trimmedMessage;

        if (isAIMessage) {
            messageToSend = trimmedMessage.substring(3).trim();
            if (!messageToSend) return;

            const userMessage = {
                message: messageToSend,
                sender: user,
                timestamp: new Date().toISOString(),
                isAI: false
            };
            setMessages(prev => [...prev, userMessage]);
            setMessage("");

            try {
                const response = await axios.get(`/ai/get-result?prompt=${encodeURIComponent(messageToSend)}`);
                let aiResponse = response.data;
                
                // If the response is a string that looks like JSON, parse it
                if (typeof aiResponse === 'string' && (aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('['))) {
                    try {
                        aiResponse = JSON.parse(aiResponse);
                    } catch (e) {
                        console.error('Failed to parse JSON response:', e);
                    }
                }
                
                // Ensure the response has the expected format
                if (aiResponse && typeof aiResponse === 'object') {
                    // If it already has text or fileTree, use as is
                    if (aiResponse.text || aiResponse.fileTree) {
                        // Already in correct format
                    }
                    // If it's a file tree response without text
                    else if (Object.keys(aiResponse).length > 0) {
                        aiResponse = { fileTree: aiResponse };
                    }
                } 
                // If it's a string or something else, wrap in text
                else {
                    aiResponse = { text: String(aiResponse) };
                }

                const aiMessage = {
                    message: aiResponse,
                    sender: { _id: 'ai', email: 'AI Assistant' },
                    timestamp: new Date().toISOString(),
                    isAI: true
                };

                setMessages(prev => [...prev, aiMessage]);

                if (aiResponse.fileTree && webContainer) {
                    try {
                        await webContainer.mount(aiResponse.fileTree);
                        setFileTree(aiResponse.fileTree);
                    } catch (err) {
                        console.error('Error mounting file tree:', err);
                        // Don't show error to user for mounting issues
                    }
                }
            } catch (error) {
                console.error('Error getting AI response:', error);
                const errorMessage = {
                    message: { 
                        text: 'Sorry, I encountered an error processing your request. Please try again later.' 
                    },
                    sender: { _id: 'ai', email: 'AI Assistant' },
                    timestamp: new Date().toISOString(),
                    isAI: true
                };
                setMessages(prev => [...prev, errorMessage]);
            }
            return;
        }

        if (!isSocketConnected()) {
            alert('Socket not connected.');
            return;
        }

        const messageData = {
            message: messageToSend,
            sender: user,
            timestamp: new Date().toISOString(),
            isAI: false
        };

        try {
            sendMessage('project-message', messageData);
            setMessages(prev => [...prev, messageData]);
            setMessage("");
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message.');
        }
    };

    const loadChatHistory = async () => {
        try {
            const response = await axios.get(`/messages/project/${project._id}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const scrollToBottom = () => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (!project) return;
        loadChatHistory();

        console.log('Initializing socket for project:', project._id);
        const socket = initializeSocket(project._id);
        if (socket) {
            socket.on('connect', () => setSocketConnected(true));
            socket.on('disconnect', () => setSocketConnected(false));
            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setSocketConnected(false);
            });
            setSocketConnected(socket.connected);
        }

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container);
                console.log("WebContainer started");
            });
        }

        const handler = (data) => {
            console.log('Received message:', data);
            setMessages(prevMessages => {
                const messageExists = prevMessages.some(msg =>
                    msg.sender?._id === data.sender?._id &&
                    JSON.stringify(msg.message) === JSON.stringify(data.message) &&
                    Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000
                );
                return messageExists ? prevMessages : [...prevMessages, data];
            });

            if ((data.isAI || data.sender?._id === 'ai') && webContainer && data.message?.fileTree) {
                webContainer.mount(data.message.fileTree);
                setFileTree(data.message.fileTree);
            }
        };

        receiveMessage('project-message', handler);

        axios.get(`/projects/get-project/${project._id}`)
            .then(res => {
                setProject(res.data.project);
                setFileTree(res.data.project.fileTree || {});
            })
            .catch(err => console.error('Error loading project:', err));

        axios.get('/users/all')
            .then(res => setUsers(res.data.users))
            .catch(err => console.error('Error loading users:', err));

        return () => {
            removeListener('project-message', handler);
        };
    }, [project?._id]);

    useEffect(scrollToBottom, [messages]);

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => console.log('File tree saved:', res.data))
          .catch(err => console.error('Error saving file tree:', err));
    }

    if (!project) {
        return <div className="min-h-screen flex items-center justify-center">Loading project...</div>;
    }

    return (
        <div className="h-screen w-screen flex">
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0'>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-200 rounded" title="Back to Dashboard">
                            <i className="ri-arrow-left-line"></i>
                        </button>
                        <span className="font-semibold">{project.name}</span>
                        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={socketConnected ? 'Connected' : 'Disconnected'}></div>
                    </div>
                    <div className="flex gap-2">
                        <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                            <i className="ri-add-fill mr-1"></i> Add collaborator
                        </button>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>
                </header>
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative bg-white">
                    <div ref={messageBox} className="message-box p-1 flex-grow flex flex-col overflow-y-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => {
                            const isAIMessage = msg.sender?._id === 'ai' || msg.isAI;
                            let messageContent = msg.message;

                            if (isAIMessage) {
                                if (typeof messageContent === 'string') {
                                    try { messageContent = JSON.parse(messageContent); } 
                                    catch (e) { messageContent = { text: messageContent }; }
                                }
                                if (typeof messageContent !== 'object' || messageContent === null) {
                                    messageContent = { text: String(messageContent) };
                                }
                            }

                            const isCurrentUser = msg.sender?._id === user?._id && !isAIMessage;
                            const isError = (msg.message?.text?.toLowerCase()?.includes('error') || 
                                         (typeof msg.message === 'string' && msg.message.toLowerCase().includes('error')));

                            // Ensure messageContent is properly formatted
                            let displayContent = messageContent;
                            if (isAIMessage && typeof messageContent === 'string') {
                                try {
                                    // Try to parse if it's a JSON string
                                    const parsed = JSON.parse(messageContent);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        displayContent = parsed;
                                    }
                                } catch (e) {
                                    // Not JSON, use as is
                                }
                            }

                            return (
                                <div key={`${msg.sender?._id || 'system'}-${index}-${msg.timestamp}`} className="w-full mb-4 px-4">
                                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[80%] w-full">
                                            <div className={`inline-flex flex-col w-full p-3 rounded-lg ${
                                                isAIMessage ? 'bg-slate-100' : 
                                                isCurrentUser ? 'bg-blue-500' : 
                                                isError ? 'bg-red-100' : 'bg-gray-200'
                                            }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <small className={`text-xs font-medium ${
                                                        isCurrentUser ? 'text-white' : 
                                                        isError ? 'text-red-700' : 'text-gray-600'
                                                    }`}>
                                                        {isAIMessage ? 'AI Assistant' : (isCurrentUser ? 'You' : msg.sender?.email?.split('@')[0] || 'User')}
                                                    </small>
                                                    <small className="text-xs text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </small>
                                                </div>
                                                <div className='w-full break-words'>
                                                    {isAIMessage ? (
                                                        <AiMessage message={displayContent} />
                                                    ) : (
                                                        <div className={isCurrentUser ? 'text-white' : isError ? 'text-red-900' : 'text-gray-800'}>
                                                            {typeof displayContent === 'string' ? displayContent : JSON.stringify(displayContent, null, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <small className={`text-xs mt-1 block ${
                                                isCurrentUser ? 'text-right' : 'text-left'
                                            } text-gray-500`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="inputField w-full flex absolute bottom-0 bg-white p-2 border-t">
                        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && send()} className='p-2 px-4 border rounded-lg outline-none flex-grow' type="text" placeholder={socketConnected ? 'Type a message or @ai...' : 'Connecting...'} disabled={!socketConnected} />
                        <button onClick={send} disabled={!socketConnected || !message.trim()} className='px-5 bg-slate-950 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'>
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>
            </section>
            
            {/* Side Panel and Right Section remain the same */}
            <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>
                    <h1 className='font-semibold text-lg'>Collaborators</h1>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className="ri-close-fill"></i>
                    </button>
                </header>
                <div className="users flex flex-col gap-2">
                    {project.users && project.users.map(u => {
                        const userEmail = u.email || u;
                        const userId = u._id || u;
                        return (
                            <div key={userId} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-semibold text-lg'>{userEmail}</h1>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <section className="right bg-red-50 flex-grow h-full flex">
                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree).map((file) => (
                            <button key={file} onClick={() => { setCurrentFile(file); setOpenFiles(prev => [...new Set([...prev, file])]); }} className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full hover:bg-slate-400">
                                <p className='font-semibold text-lg'>{file}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full">
                        <div className="files flex">
                            {openFiles.map((file) => (
                                <button key={file} onClick={() => setCurrentFile(file)} className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''} hover:bg-slate-400`}>
                                    <p className='font-semibold text-lg'>{file}</p>
                                </button>
                            ))}
                        </div>
                        <div className="actions flex gap-2">
                            <button onClick={async () => {
                                if (!webContainer) {
                                    alert('Web container not ready. Please wait.');
                                    return;
                                }
                                try {
                                    await webContainer.mount(fileTree);
                                    const install = await webContainer.spawn("npm", ["install"]);
                                    install.output.pipeTo(new WritableStream({ write: chunk => console.log(chunk) }));
                                    await install.exit;
                                    
                                    if (runProcess) runProcess.kill();
                                    
                                    const start = await webContainer.spawn("npm", ["start"]);
                                    start.output.pipeTo(new WritableStream({ write: chunk => console.log(chunk) }));
                                    setRunProcess(start);

                                    webContainer.on('server-ready', (port, url) => setIframeUrl(url));
                                } catch (error) {
                                    console.error('Error running code:', error);
                                    alert('Error running code. Check console.');
                                }
                            }} className='p-2 px-4 bg-green-600 text-white hover:bg-green-700'>
                                Run
                            </button>
                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {fileTree[currentFile] && (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                <pre className="hljs h-full">
                                    <code className="hljs h-full outline-none" contentEditable suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = { ...fileTree, [currentFile]: { file: { contents: updatedContent } } };
                                            setFileTree(ft);
                                            saveFileTree(ft);
                                        }}
                                        dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value }}
                                        style={{ whiteSpace: 'pre-wrap', paddingBottom: '25rem' }} />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
                {iframeUrl && webContainer && (
                    <div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar">
                            <input type="text" onChange={(e) => setIframeUrl(e.target.value)} value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full" title="Web Preview" />
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'><i className="ri-close-fill"></i></button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(u => (
                                <div key={u._id} className={`user cursor-pointer hover:bg-slate-200 ${selectedUserId.has(u._id) ? 'bg-slate-200' : ''} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(u._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button onClick={addCollaborators} className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Project;