"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];

export default function ChartCard({ title, type = "line", data = [], dataKey = "value", xKey = "name", height = 280, series }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend />
              {(series || [{ key: dataKey, color: COLORS[0] }]).map((s, i) => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color || COLORS[i % COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          ) : type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend />
              {(series || [{ key: dataKey, color: COLORS[0] }]).map((s, i) => (
                <Bar key={s.key} dataKey={s.key} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={90} label>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          ) : (
            <RadarChart data={data}>
              <PolarGrid /><PolarAngleAxis dataKey={xKey} fontSize={12} /><PolarRadiusAxis />
              <Radar dataKey={dataKey} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.5} />
              <Tooltip />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
