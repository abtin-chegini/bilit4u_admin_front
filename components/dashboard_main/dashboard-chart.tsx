"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const chartData = [
  { month: "دی", نور: 85, "هتل و اقامتگاه": 78, هواپیما: 82, قطار: 65, اتوبوس: 70 },
  { month: "بهمن", نور: 90, "هتل و اقامتگاه": 75, هواپیما: 85, قطار: 68, اتوبوس: 72 },
  { month: "اسفند", نور: 180, "هتل و اقامتگاه": 78, هواپیما: 88, قطار: 70, اتوبوس: 75 },
  { month: "فروردین", نور: 320, "هتل و اقامتگاه": 82, هواپیما: 92, قطار: 72, اتوبوس: 78 },
  { month: "اردیبهشت", نور: 380, "هتل و اقامتگاه": 85, هواپیما: 95, قطار: 75, اتوبوس: 80 },
  { month: "خرداد", نور: 420, "هتل و اقامتگاه": 88, هواپیما: 98, قطار: 78, اتوبوس: 82 },
]

const chartColors = {
  نور: "#2caffe",
  "هتل و اقامتگاه": "#544fc5",
  هواپیما: "#00e272",
  قطار: "#fe6a35",
  اتوبوس: "#6b8abc",
}

export default function DashboardChart() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-right">آمار فروش ماهانه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
                <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                {Object.entries(chartColors).map(([key, color]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={3}
                    dot={{ fill: color, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: color, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
