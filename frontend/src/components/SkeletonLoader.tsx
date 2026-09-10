import "./SkeletonLoader.css";

interface SkeletonProps {
  type?: "card" | "table-row" | "table" | "text" | "chart";
  count?: number;
  height?: string;
}

export default function SkeletonLoader({ type = "card", count = 1, height }: SkeletonProps) {
  const items = Array.from({ length: count });

  if (type === "table-row" || type === "table") {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {items.map((_, i) => (
            <tr key={i} className="skeleton-row">
              <td colSpan={10}>
                <div className="skeleton-line" style={{ height: height || "24px" }}></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "card") {
    return (
      <div className="skeleton-grid">
        {items.map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: height || "120px" }}>
            <div className="skeleton-line title"></div>
            <div className="skeleton-line value"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-wrapper">
      {items.map((_, i) => (
        <div key={i} className="skeleton-line" style={{ height: height || "20px" }}></div>
      ))}
    </div>
  );
}
