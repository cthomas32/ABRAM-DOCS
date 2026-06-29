import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "glass" | "ghost" | "danger";
    size?: "default" | "sm" | "xs";
    children: React.ReactNode;
}
declare function Button({ variant, size, children, className, style, ...props }: ButtonProps): React.JSX.Element;

interface GlassPanelProps {
    hover?: boolean;
    rounded?: "lg" | "xl" | "2xl";
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
declare function GlassPanel({ hover, rounded, children, className, style, }: GlassPanelProps): React.JSX.Element;

interface FeatureCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    href?: string;
    horizontal?: boolean;
    children?: React.ReactNode;
    className?: string;
}
declare function FeatureCard({ title, description, icon, href, horizontal, children, className, }: FeatureCardProps): React.JSX.Element;

interface WorkflowCardProps {
    step: string;
    title: string;
    tag: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}
declare function WorkflowCard({ step, title, tag, description, children, className, }: WorkflowCardProps): React.JSX.Element;
interface WorkflowCardGroupProps {
    cols?: 1 | 2 | 3 | 4;
    children: React.ReactNode;
    className?: string;
}
declare function WorkflowCardGroup({ cols, children, className }: WorkflowCardGroupProps): React.JSX.Element;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}
declare function Input({ label, error, className, id, style, ...props }: InputProps): React.JSX.Element;

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "accent" | "muted";
    className?: string;
}
declare function Badge({ children, variant, className }: BadgeProps): React.JSX.Element;

interface SectionProps {
    children: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
    className?: string;
    style?: React.CSSProperties;
}
declare function Section({ children, maxWidth, className, style, }: SectionProps): React.JSX.Element;
interface SectionHeaderProps {
    overline?: string;
    title: string;
    description?: string;
    align?: "left" | "center";
    className?: string;
}
declare function SectionHeader({ overline, title, description, align, className, }: SectionHeaderProps): React.JSX.Element;

interface BackgroundGlowProps {
    variant?: "premium" | "brand" | "space" | "emerald" | "amber" | "rose";
    techGrid?: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
declare function BackgroundGlow({ variant, techGrid, children, className, style, }: BackgroundGlowProps): React.JSX.Element;

export { BackgroundGlow, type BackgroundGlowProps, Badge, type BadgeProps, Button, type ButtonProps, FeatureCard, type FeatureCardProps, GlassPanel, type GlassPanelProps, Input, type InputProps, Section, SectionHeader, type SectionHeaderProps, type SectionProps, WorkflowCard, WorkflowCardGroup, type WorkflowCardGroupProps, type WorkflowCardProps };
