import { useEffect, useRef, useState } from "react"
import { Search, Tag, X } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useTagStore } from "@/store/tagStore"

export default function SearchBar() {
  const searchQuery = useSampleStore((s) => s.searchQuery)
  const setSearchQuery = useSampleStore((s) => s.setSearchQuery)
  const selectedTagId = useSampleStore((s) => s.selectedTagId)
  const setSelectedTagId = useSampleStore((s) => s.setSelectedTagId)
  const searchSamples = useSampleStore((s) => s.searchSamples)
  const { tags, fetchTags } = useTagStore()
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      searchSamples(value, undefined, selectedTagId)
    }, 300)
  }

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTagId(tagId)
    setShowTagDropdown(false)
    searchSamples(searchQuery, undefined, tagId)
  }

  const selectedTag = tags.find((t) => t.id === selectedTagId)

  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索样本编号、名称..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
        />
      </div>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowTagDropdown(!showTagDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
        >
          <Tag className="w-4 h-4 text-gray-400" />
          <span className={selectedTag ? "text-gray-700" : "text-gray-400"}>
            {selectedTag ? selectedTag.name : "按标签筛选"}
          </span>
          {selectedTag && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleTagSelect(null)
              }}
              className="hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </button>
        {showTagDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    selectedTagId === tag.id ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-gray-700">{tag.name}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400">暂无标签</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
