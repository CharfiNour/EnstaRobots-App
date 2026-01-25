"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

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

    const dropdownMenu = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999,
                    }}
                    className="bg-card/80 backdrop-blur-2xl border border-card-border/60 rounded-[1.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    <div className="p-1.5">
                        {options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={String(option.value)}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group relative overflow-hidden mb-0.5 last:mb-0 ${isSelected
                                        ? 'bg-role-primary text-white shadow-md shadow-role-primary/20'
                                        : 'text-muted-foreground hover:bg-role-primary/10 hover:text-foreground'
                                        } ${option.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="selector-active"
                                            className="absolute inset-0 bg-gradient-to-r from-role-primary to-role-secondary opacity-100"
                                        />
                                    )}
                                    <span className={`relative z-10 text-[11px] font-black uppercase tracking-[0.1em] truncate ${option.color || ''} ${isSelected ? 'text-white' : ''}`}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (variant === 'block') {
        return (
            <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`} ref={containerRef}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-5 py-4 bg-muted/20 border rounded-2xl flex items-center justify-between transition-all duration-300 group ${isOpen
                        ? 'border-role-primary/50 bg-muted/30 ring-4 ring-role-primary/10 shadow-lg shadow-role-primary/5'
                        : 'border-card-border hover:border-role-primary/30 hover:bg-muted/30'
                        }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`text-sm font-bold truncate tracking-tight ${selectedOption?.color || 'text-foreground'} ${!selectedOption ? 'text-muted-foreground opacity-50' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <div className={`p-1 rounded-lg transition-colors ${isOpen ? 'bg-role-primary text-white' : 'bg-muted/50 text-muted-foreground group-hover:bg-role-primary/10 group-hover:text-role-primary'}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
            </div>
        );
    }

    // Inline variant (for smaller selectors like Phase, Grp, Count)
    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center bg-muted/40 backdrop-blur-md border border-card-border/50 rounded-xl px-3 py-1.5 gap-2.5 transition-all hover:bg-muted/60 ${isOpen ? 'border-role-primary/50 ring-2 ring-role-primary/10 bg-muted/60' : ''
                    }`}
            >
                {prefix && <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{prefix}</span>}
                <span className={`text-[11px] font-black tracking-tight truncate ${selectedOption?.color || 'text-role-primary'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
        </div>
    );
}
