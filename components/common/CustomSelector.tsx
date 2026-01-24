"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: any;
    label: string;
    disabled?: boolean;
    color?: string;
}

interface CustomSelectorProps {
    options: Option[];
    value: any;
    onChange: (value: any) => void;
    placeholder?: string;
    prefix?: string;
    className?: string;
    variant?: 'inline' | 'block';
    fullWidth?: boolean;
}

export default function CustomSelector({
    options,
    value,
    onChange,
    placeholder = "Select...",
    prefix,
    className = "",
    variant = 'inline',
    fullWidth = false
}: CustomSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
    };

    if (variant === 'block') {
        return (
            <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`} ref={containerRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-4 py-3 bg-background border rounded-2xl flex items-center justify-between transition-all group ${isOpen ? 'border-accent ring-2 ring-accent/20' : 'border-card-border hover:border-accent/40'
                        }`}
                >
                    <span className={`text-sm font-bold truncate ${selectedOption?.color || 'text-foreground'} ${!selectedOption ? 'text-muted-foreground opacity-50' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 z-[100] bg-card border border-card-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden backdrop-blur-xl"
                        >
                            <div className="max-h-[250px] overflow-y-auto p-1.5 custom-scrollbar">
                                {options.map((option) => (
                                    <button
                                        key={String(option.value)}
                                        type="button"
                                        disabled={option.disabled}
                                        onClick={() => handleSelect(option)}
                                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between group ${value === option.value ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50'
                                            } ${option.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                    >
                                        <span className={`text-xs font-black uppercase tracking-widest truncate ${option.color || ''}`}>
                                            {option.label}
                                        </span>
                                        {value === option.value && (
                                            <div className="w-1 h-1 rounded-full bg-accent" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Inline variant (for smaller selectors like Phase, Grp, Count)
    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center bg-muted/50 border border-card-border rounded-lg px-2 py-1 gap-2 transition-all hover:bg-muted ${isOpen ? 'border-accent/50 ring-1 ring-accent/20' : ''
                    }`}
            >
                {prefix && <span className="text-[10px] font-black text-muted-foreground uppercase">{prefix}</span>}
                <span className={`text-xs font-black truncate ${selectedOption?.color || 'text-accent'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 z-[100] bg-card border border-card-border rounded-xl shadow-xl overflow-hidden min-w-[120px] backdrop-blur-xl"
                    >
                        <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={String(option.value)}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between group ${value === option.value ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50'
                                        } ${option.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-wider truncate ${option.color || ''}`}>
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
