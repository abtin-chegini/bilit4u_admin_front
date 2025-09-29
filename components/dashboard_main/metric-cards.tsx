"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

const metrics = [
  { value: "۳۱۳", label: "لورم ایپسوم" },
  { value: "۳۱۳", label: "لورم ایپسوم" },
  { value: "۳۱۳", label: "لورم ایپسوم" },
  { value: "۳۱۳", label: "لورم ایپسوم" },
]

export default function MetricCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#2caffe] mb-2">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
