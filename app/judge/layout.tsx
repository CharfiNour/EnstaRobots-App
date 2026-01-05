import "./theme.css";

export default function JudgeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="judge-theme">{children}</div>;
}
