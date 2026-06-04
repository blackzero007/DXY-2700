import { useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"

export default function SearchBar() {
  const searchQuery = useSampleStore((s) => s.searchQuery)
  const setSearchQuery = useSampleStore((s) => s.setSearchQuery)
  const searchSamples = useSampleStore((s) => s.searchSamples)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = (value: string) => {
    setSearchQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      searchSamples(value)
    }, 300)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索样本编号、名称..."
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
      />
    </div>
  )
}
