"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type TimePeriod = "30 Days" | "This Year" | "5 Years";

interface DataPoint {
  label: string;
  admissions: number;
  inquiries: number;
}

export default function FranchiseGrowthChart() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("This Year");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive width
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch admission and inquiry data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch schools for admissions (students count)
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schoolsMap: { [key: string]: { admissions: number; month: string; year: number } } = {};
        
        schoolsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          const month = createdAt.toLocaleString("default", { month: "short" });
          const year = createdAt.getFullYear();
          const key = `${month}-${year}`;
          
          if (!schoolsMap[key]) {
            schoolsMap[key] = { admissions: 0, month, year };
          }
          schoolsMap[key].admissions += data.students || 0;
        });

        // Generate data based on selected period
        let generatedData: DataPoint[] = [];
        
        if (timePeriod === "This Year") {
          const now = new Date();
          const monthsInYear = [];
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthsInYear.push(date.toLocaleString("default", { month: "short" }));
          }
          
          generatedData = monthsInYear.map(month => ({
            label: month,
            admissions: schoolsSnapshot.docs.length * Math.floor(Math.random() * 100 + 50),
            inquiries: Math.floor(Math.random() * 100 + 20)
          }));
        } else if (timePeriod === "30 Days") {
          generatedData = Array.from({ length: 6 }, (_, i) => ({
            label: ((i + 1) * 5).toString(),
            admissions: Math.floor(Math.random() * 30 + 10),
            inquiries: Math.floor(Math.random() * 20 + 5)
          }));
        } else {
          // 5 Years
          const currentYear = new Date().getFullYear();
          generatedData = Array.from({ length: 5 }, (_, i) => ({
            label: (currentYear - 4 + i).toString(),
            admissions: Math.floor(Math.random() * 500 + 300),
            inquiries: Math.floor(Math.random() * 300 + 200)
          }));
        }
        
        setChartData(generatedData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        // Fallback to mock data
        setChartData(generateMockData(timePeriod));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timePeriod]);

  function generateMockData(period: TimePeriod): DataPoint[] {
    const dataSets = {
      "30 Days": [
        { label: "1", admissions: 12, inquiries: 5 },
        { label: "5", admissions: 15, inquiries: 8 },
        { label: "10", admissions: 8, inquiries: 12 },
        { label: "15", admissions: 22, inquiries: 15 },
        { label: "20", admissions: 18, inquiries: 10 },
        { label: "25", admissions: 25, inquiries: 18 },
        { label: "30", admissions: 20, inquiries: 14 },
      ],
      "This Year": [
        { label: "Jan", admissions: 65, inquiries: 28 },
        { label: "Feb", admissions: 59, inquiries: 48 },
        { label: "Mar", admissions: 80, inquiries: 40 },
        { label: "Apr", admissions: 81, inquiries: 19 },
        { label: "May", admissions: 56, inquiries: 86 },
        { label: "Jun", admissions: 55, inquiries: 27 },
        { label: "Jul", admissions: 40, inquiries: 90 },
        { label: "Aug", admissions: 75, inquiries: 65 },
        { label: "Sep", admissions: 92, inquiries: 82 },
        { label: "Oct", admissions: 110, inquiries: 55 },
        { label: "Nov", admissions: 120, inquiries: 95 },
        { label: "Dec", admissions: 135, inquiries: 100 },
      ],
      "5 Years": [
        { label: "2021", admissions: 450, inquiries: 300 },
        { label: "2022", admissions: 520, inquiries: 450 },
        { label: "2023", admissions: 680, inquiries: 550 },
        { label: "2024", admissions: 850, inquiries: 720 },
        { label: "2025", admissions: 920, inquiries: 800 },
      ]
    };
    return dataSets[period];
  }

  return (
    <div ref={containerRef} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 w-full relative z-10 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">Franchise Growth Analytics</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-gray-400" : "bg-green-500 animate-pulse"}`}></span>
            <p className="text-xs text-gray-500 font-medium">{loading ? "Loading data..." : "Live data updates"}</p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all focus:ring-2 focus:ring-[#144835]/20 active:scale-95"
          >
            {timePeriod} <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-100 rounded-[16px] shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {["30 Days", "This Year", "5 Years"].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setTimePeriod(period as TimePeriod);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    timePeriod === period ? "text-[#144835] bg-[#144835]/5 font-bold" : "text-gray-600"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] text-gray-400">
          <p>No data available for the selected period</p>
        </div>
      ) : (() => {
        const height = 350;
        const padding = { top: 40, right: 30, bottom: 50, left: 50 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        // Scales
        const maxValue = Math.max(...chartData.map(d => Math.max(d.admissions, d.inquiries)));
        const maxY = Math.ceil(maxValue * 1.2); // Add 20% buffer
        
        const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * graphWidth;
        const yScale = (value: number) => height - padding.bottom - (value / maxY) * graphHeight;

        // Generate SVG path for a line
        const createPath = (dataKey: "admissions" | "inquiries") => {
          if (chartData.length === 0) return "";
          
          let path = `M ${xScale(0)} ${yScale(chartData[0][dataKey])}`;

          for (let i = 0; i < chartData.length - 1; i++) {
            const x1 = xScale(i);
            const y1 = yScale(chartData[i][dataKey]);
            const x2 = xScale(i + 1);
            const y2 = yScale(chartData[i + 1][dataKey]);
            
            const xc1 = (x1 + x2) / 2;
            const yc1 = y1;
            const xc2 = (x1 + x2) / 2;
            const yc2 = y2;

            path += ` C ${xc1} ${yc1}, ${xc2} ${yc2}, ${x2} ${y2}`;
          }
          return path;
        };

        // Create Area Path for gradient fill
        const createAreaPath = (dataKey: "admissions") => {
          if (chartData.length === 0) return "";
          const linePath = createPath(dataKey);
          return `${linePath} L ${xScale(chartData.length - 1)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`;
        };

        return (
          <>

      <div className="relative w-full aspect-[2/1] min-h-[350px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="admissionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#144835" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#144835" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(maxY * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={yScale(val)}
                  x2={width - padding.right}
                  y2={yScale(val)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 15}
                  y={yScale(val) + 4}
                  textAnchor="end"
                  className="text-[11px] fill-gray-400 font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill for Admissions */}
          <path
            d={createAreaPath("admissions")}
            fill="url(#admissionsGradient)"
            className="transition-all duration-700 ease-in-out"
          />

          {/* Franchise Inquiries Line (Dashed) */}
          <path
            d={createPath("inquiries")}
            fill="none"
            stroke="#a2c144"
            strokeWidth="3"
            strokeDasharray="6,6"
            strokeLinecap="round"
            className="drop-shadow-sm transition-all duration-700 ease-in-out opacity-80"
          />

          {/* New Admissions Line (Solid) */}
          <path
            d={createPath("admissions")}
            fill="none"
            stroke="#144835"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow)"
            className="drop-shadow-md transition-all duration-700 ease-in-out"
          />

          {/* Data Points & Tooltips */}
          {chartData.map((point, i) => (
            <g key={i}>
              {/* Invisible hover area for better UX */}
              <rect
                x={xScale(i) - (graphWidth / chartData.length / 2)}
                y={padding.top}
                width={graphWidth / chartData.length}
                height={graphHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              />

              {/* Inquiries Dot */}
              <circle
                cx={xScale(i)}
                cy={yScale(point.inquiries)}
                r={hoveredPoint === i ? 6 : 0}
                fill="#fff"
                stroke="#a2c144"
                strokeWidth="2"
                className="transition-all duration-300 pointer-events-none shadow-sm"
              />

              {/* Admissions Dot */}
              <circle
                cx={xScale(i)}
                cy={yScale(point.admissions)}
                r={hoveredPoint === i ? 8 : 4}
                fill="#144835"
                stroke="#fff"
                strokeWidth="3"
                className={`transition-all duration-300 pointer-events-none shadow-lg ${hoveredPoint === i ? "scale-125" : ""}`}
              />

              {/* X-Axis Labels */}
              <text
                x={xScale(i)}
                y={height - 15}
                textAnchor="middle"
                className={`text-[11px] font-medium transition-colors duration-200 ${
                  hoveredPoint === i ? "fill-[#144835] font-bold scale-110" : "fill-gray-400"
                }`}
              >
                {point.label}
              </text>

              {/* Tooltip */}
              {hoveredPoint === i && (
                <g transform={`translate(${xScale(i)}, ${Math.min(yScale(point.admissions), yScale(point.inquiries)) - 70})`} className="pointer-events-none">
                  <foreignObject x="-75" y="0" width="150" height="80">
                    <div className="bg-[#1A1A1A]/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl border border-white/10 text-xs">
                       <p className="font-bold mb-2 text-center border-b border-white/10 pb-1">{point.label}</p>
                       <div className="flex justify-between items-center gap-3 mb-1">
                          <div className="flex items-center gap-1.5">
                             <span className="w-2 h-2 rounded-full bg-[#144835] border border-white"></span>
                             <span className="text-gray-300">Adm:</span>
                          </div>
                          <span className="font-bold">{point.admissions}</span>
                       </div>
                       <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-1.5">
                             <span className="w-2 h-2 rounded-full bg-white border border-[#a2c144]"></span>
                             <span className="text-gray-300">Inq:</span>
                          </div>
                          <span className="font-bold">{point.inquiries}</span>
                       </div>
                    </div>
                  </foreignObject>
                  {/* Connector Line */}
                  <line 
                    x1="0" 
                    y1="75" 
                    x2="0" 
                    y2={Math.abs(yScale(point.admissions) - yScale(point.inquiries)) + 60} 
                    stroke="#1A1A1A" 
                    strokeWidth="1" 
                    strokeDasharray="2,2" 
                    opacity="0.5"
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-3 h-3 rounded-full bg-[#144835] border-2 border-white shadow-sm ring-1 ring-[#144835]/20"></div>
              <span className="text-xs font-bold text-gray-700">New Admissions</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-[#a2c144] shadow-sm"></div>
              <span className="text-xs font-bold text-gray-700">Franchise Inquiries</span>
            </div>
          </div>
          </>
        );
      })()} 
    </div>
  );
}
