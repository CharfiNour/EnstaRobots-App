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
    size?: 'default' | 'compact';
}

export default function CustomSelector({
    options,
    value,
    onChange,
    placeholder = "Select...",
    prefix,
    className = "",
    variant = 'inline',
    fullWidth = false,
    size = 'default'
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
                    animate={{ opacity: 1, y: 8, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999,
                    }}
                    className="bg-white/90 backdrop-blur-2xl border border-card-border/60 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden"
                >
                    <div className="p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={String(option.value)}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full p-3 rounded-[1rem] text-left transition-all flex items-center gap-3 group relative overflow-hidden mb-0.5 last:mb-0 ${isSelected
                                        ? 'bg-blue-50 text-role-primary'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        } ${option.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                >
                                    {/* Indicator Dot */}
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'}`} />

                                    <span className={`relative z-10 text-xs font-black uppercase tracking-widest truncate`}>
                                        {option.label}
                                    </span>
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
                    className={`w-full ${size === 'compact' ? 'px-4 py-2.5 rounded-xl' : 'px-5 py-3.5 rounded-[2rem]'} bg-white border-2 flex items-center justify-between transition-all duration-300 group ${isOpen
                        ? 'border-role-primary/40 shadow-xl shadow-role-primary/5'
                        : 'border-card-border/50 hover:border-role-primary/20 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center gap-4 overflow-hidden">
                        {selectedOption && (
                            <div className={`${size === 'compact' ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] shrink-0`} />
                        )}
                        <span className={`${size === 'compact' ? 'text-xs' : 'text-sm'} font-black uppercase tracking-widest truncate ${!selectedOption ? 'text-muted-foreground opacity-50' : 'text-foreground'}`}>
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
