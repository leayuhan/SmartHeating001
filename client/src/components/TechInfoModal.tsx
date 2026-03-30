/**
 * TechInfoModal - 室温辨识技术说明弹窗
 * 面向展会嘉宾，通俗易懂地解释技术原理
 * Macaron Tech Theme
 */
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function TechInfoModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(76,29,149,0.15)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(860px, 95vw)",
          maxHeight: "88vh",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          borderRadius: 24,
          border: "1.5px solid rgba(184,169,245,0.3)",
          boxShadow: "0 24px 80px rgba(184,169,245,0.25), 0 8px 32px rgba(0,0,0,0.08)",
          animation: "slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(237,233,254,0.9), rgba(255,204,231,0.5))",
            borderBottom: "1.5px solid rgba(184,169,245,0.2)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-2xl text-3xl"
              style={{ width: 52, height: 52, background: "linear-gradient(135deg, #B8A9F5, #FFCCE7)", boxShadow: "0 6px 16px rgba(184,169,245,0.4)" }}
            >
              🧠
            </div>
            <div>
              <h2 className="font-black text-xl" style={{ color: "#4C1D95" }}>算法模块：室温虚拟感知技术</h2>
              <p className="text-sm mt-0.5" style={{ color: "#7C3AED", opacity: 0.8 }}>
                无需入户安装传感器，AI精准预测每户室温
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.06)" }}>
            <X size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {/* Problem statement */}
          <div
            className="p-5 rounded-2xl mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(255,228,230,0.6), rgba(255,204,231,0.4))",
              border: "1.5px solid rgba(255,179,186,0.4)",
            }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: "#DC2626" }}>🔑 核心问题</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              入户安装室温传感器面临巨大工程挑战：用户不在家、隐私顾虑、推进困难。
              目前典型小区500户中<strong>仅10户安装室温计</strong>，覆盖率低，无法支撑全网决策。
              <br /><br />
              <strong style={{ color: "#DC2626" }}>室温虚拟感知技术</strong>从根本上解决这一瓶颈——
              <strong>无需大规模入户，即可获取全网每户室温的估算与预测值。</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Technical principle */}
            <div className="p-5 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(237,233,254,0.6), rgba(255,255,255,0.8))", border: "1.5px solid rgba(184,169,245,0.25)" }}>
              <p className="text-sm font-black mb-3" style={{ color: "#4C1D95" }}>🔬 技术原理</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "#374151" }}>
                基于用户分类建模：将小区用户按楼栋位置、楼层、朝向（阳面/阴面）、面积等特征分类。
                每类用户仅需1~2个实测室温采样点，结合室外温度传感器、供回水温度、历史热量数据，
                通过机器学习模型推算同类型所有用户的室温。
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  "阳面与阴面用户建立独立模型（太阳辐射影响显著）",
                  "考虑建筑热惰性（调节后延迟响应）",
                  "用户行为干扰（开窗、关阀）通过异常检测剔除",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#B8A9F5" }} />
                    <p className="text-xs" style={{ color: "#4B5563" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical roadmap */}
            <div className="p-5 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(168,230,207,0.2), rgba(255,255,255,0.8))", border: "1.5px solid rgba(168,230,207,0.3)" }}>
              <p className="text-sm font-black mb-3" style={{ color: "#065F46" }}>🗺️ 技术路线</p>
              <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                构建"预测-决策一体化"智能模型体系，以数据驱动预测为基础，以优化目标决策为输出，
                形成<strong>"感知—预判—决策—执行"</strong>的智能闭环。
              </p>
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {["感知", "→", "预判", "→", "决策", "→", "执行"].map((item, i) => (
                  <span key={i} className={item === "→" ? "text-xs text-gray-400" : "text-xs font-bold px-2.5 py-1 rounded-full"}
                    style={item !== "→" ? { background: "#A8E6CF", color: "#065F46" } : {}}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Inputs */}
            <div className="p-5 rounded-2xl"
              style={{ background: "rgba(248,246,255,0.8)", border: "1.5px solid rgba(184,169,245,0.2)" }}>
              <p className="text-sm font-black mb-3" style={{ color: "#4C1D95" }}>📥 输入数据</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "气象数据", items: ["室外温度（实时+预报）", "风速、日照、湿度"], color: "#FFF1A8", textColor: "#92400E" },
                  { label: "楼栋特征", items: ["楼栋拓扑（高度、面积）", "玻璃窗占比、朝向"], color: "#EDE9FE", textColor: "#4C1D95" },
                  { label: "管网数据", items: ["管网位置关系（近端/远端）", "历史热量、供回水温度、流量、压力"], color: "#DBEAFE", textColor: "#1D4ED8" },
                  { label: "采样室温", items: ["少量采样室温（2%~5%用户）", "缴费状态（孤岛用户识别）"], color: "#D1FAE5", textColor: "#065F46" },
                ].map(group => (
                  <div key={group.label} className="p-2.5 rounded-xl"
                    style={{ background: group.color }}>
                    <p className="text-xs font-bold mb-1" style={{ color: group.textColor }}>{group.label}</p>
                    {group.items.map((item, i) => (
                      <p key={i} className="text-xs" style={{ color: group.textColor, opacity: 0.8 }}>· {item}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs + decisions */}
            <div className="flex flex-col gap-3">
              <div className="p-5 rounded-2xl"
                style={{ background: "rgba(248,246,255,0.8)", border: "1.5px solid rgba(168,230,207,0.3)" }}>
                <p className="text-sm font-black mb-3" style={{ color: "#065F46" }}>📤 输出结果</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { icon: "🌡️", text: "每户估算室温（当前时刻）" },
                    { icon: "🔮", text: "未来2~12小时室温预测" },
                    { icon: "⚠️", text: "低于18°C风险用户预警列表" },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: "rgba(168,230,207,0.2)" }}>
                      <span className="text-base">{item.icon}</span>
                      <p className="text-xs font-semibold" style={{ color: "#065F46" }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(184,169,245,0.12), rgba(255,204,231,0.08))", border: "1.5px solid rgba(184,169,245,0.25)" }}>
                <p className="text-xs font-black mb-2" style={{ color: "#4C1D95" }}>🤖 系统决策建议</p>
                <div className="flex flex-col gap-1">
                  {[
                    "调节阀门（目标值、现场才能到达平衡）",
                    "调整供热（按需增减热量）",
                    "能耗管理（单位面积/建筑/区域能耗）",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#B8A9F5" }} />
                      <p className="text-xs" style={{ color: "#4B5563" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Model results */}
          <div className="p-5 rounded-2xl"
            style={{ background: "linear-gradient(135deg, rgba(237,233,254,0.5), rgba(255,204,231,0.3))", border: "1.5px solid rgba(184,169,245,0.25)" }}>
            <p className="text-sm font-black mb-4" style={{ color: "#4C1D95" }}>📊 模型训练结果（1296万条全仿真数据）</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { horizon: "30分钟预测", r2: "99.96%", mae: "0.154°C", rmse: "0.202°C", samples: "1296万", color: "#B8A9F5", bg: "#EDE9FE" },
                { horizon: "1小时预测", r2: "99.91%", mae: "0.220°C", rmse: "0.293°C", samples: "1295万", color: "#A8E6CF", bg: "#D1FAE5" },
                { horizon: "2小时预测", r2: "99.79%", mae: "0.322°C", rmse: "0.442°C", samples: "1295万", color: "#FFD4B2", bg: "#FFF3E0" },
              ].map(m => (
                <div key={m.horizon} className="p-4 rounded-2xl text-center"
                  style={{ background: m.bg, border: `1.5px solid ${m.color}` }}>
                  <p className="text-xs font-bold mb-3" style={{ color: "#374151" }}>{m.horizon}</p>
                  <div className="mb-2">
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>R² 决定系数</p>
                    <p className="font-black text-2xl" style={{ color: "#4C1D95" }}>{m.r2}</p>
                  </div>
                  <div className="flex justify-around">
                    <div>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>MAE误差</p>
                      <p className="font-bold text-sm" style={{ color: "#059669" }}>{m.mae}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>RMSE</p>
                      <p className="font-bold text-sm" style={{ color: "#6D28D9" }}>{m.rmse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "#9CA3AF" }}>
              R²接近1.0表示模型预测精度极高，MAE误差仅0.15~0.32°C，远低于人体感知阈值（±1°C）
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(184,169,245,0.15)", background: "rgba(248,246,255,0.8)" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            💡 点击系统图中的楼栋或换热站，查看AI实时预测结果
          </p>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #B8A9F5, #FFCCE7)", boxShadow: "0 4px 12px rgba(184,169,245,0.35)" }}>
            开始体验 →
          </button>
        </div>
      </div>
    </div>
  );
}
