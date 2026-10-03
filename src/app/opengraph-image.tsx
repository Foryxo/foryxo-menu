import { ImageResponse } from "next/og";

export const alt = "Foryxo Menu — digital menus for cafés and restaurants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 72,
        color: "#f8fafc",
        background: "#0b1020",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}>
          <span style={{ display: "flex", width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 18, background: "#5b88f7", color: "#091126" }}>F</span>
          Foryxo Menu
        </div>
        <div style={{ display: "flex", marginTop: 58, fontSize: 69, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2 }}>
          Menus worth opening.
        </div>
        <div style={{ display: "flex", marginTop: 26, maxWidth: 580, color: "#b9c5de", fontSize: 28, lineHeight: 1.35 }}>
          Beautiful, fast digital menus for cafés and restaurants.
        </div>
      </div>
      <div style={{ display: "flex", width: 300, height: 440, flexDirection: "column", gap: 18, padding: 24, border: "3px solid #34476c", borderRadius: 38, background: "#f7f8fc", transform: "rotate(5deg)" }}>
        <div style={{ display: "flex", width: 72, height: 8, alignSelf: "center", borderRadius: 8, background: "#d5d9e2" }} />
        <div style={{ display: "flex", marginTop: 25, color: "#14223f", fontSize: 25, fontWeight: 800 }}>Your café</div>
        <div style={{ display: "flex", width: 110, height: 8, borderRadius: 8, background: "#89aaf7" }} />
        {["Coffee", "Breakfast", "Dessert"].map((label, index) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, border: "2px solid #e5e9f1", borderRadius: 18, color: "#1d2d4d" }}>
            <div style={{ display: "flex", width: 54, height: 54, borderRadius: 14, background: ["#b88459", "#f0c27b", "#d69bb5"][index] }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{label}</span>
              <span style={{ width: 100, height: 7, borderRadius: 7, background: "#d6dce7" }} />
            </div>
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
