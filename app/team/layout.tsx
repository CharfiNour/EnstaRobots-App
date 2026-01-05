import "./theme.css";

export default function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="team-theme">{children}</div>;
}
