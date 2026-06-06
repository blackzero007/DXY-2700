import { useEffect, useRef, useState } from "react"
import { Search, Tag, X, Filter, List } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useTagStore } from "@/store/tagStore"
import { useSampleTypeStore } from "@/store/sampleTypeStore"
import { SampleStatus } from "@/types"

const STATUS_OPTIONS = Object.values(SampleStatus)

export default function SearchBar() {
  const searchQuery = useSampleStore((s) => s.searchQuery)
  const setSearchQuery = useSampleStore((s) => s.setSearchQuery)
  const selectedTagId = useSampleStore((s) => s.selectedTagId)
  const setSelectedTagId = useSampleStore((s) => s.setSelectedTagId)
  const selectedStatus = useSampleStore((s) => s.selectedStatus)
  const setSelectedStatus = useSampleStore((s) => s.setSelectedStatus)
  const selectedSampleType = useSampleStore((s) => s.selectedSampleType)
  const setSelectedSampleType = useSampleStore((s) => s.setSelectedSampleType)
  const searchSamples = useSampleStore((s) => s.searchSamples)
  const { tags, fetchTags } = useTagStore()
  const { sampleTypes, fetchSampleTypes } = useSampleTypeStore()
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTags()
    fetchSampleTypes()
  }, [fetchTags, fetchSampleTypes])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
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

  const triggerSearch = () => {
    searchSamples(searchQuery, undefined, selectedTagId, selectedStatus, selectedSampleType)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      searchSamples(value, undefined, selectedTagId, selectedStatus, selectedSampleType)
    }, 300)
  }

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTagId(tagId)
    setShowTagDropdown(false)
    searchSamples(searchQuery, undefined, tagId, selectedStatus, selectedSampleType)
  }

  const handleStatusSelect = (status: string | null) => {
    setSelectedStatus(status)
    setShowStatusDropdown(false)
    searchSamples(searchQuery, undefined, selectedTagId, status, selectedSampleType)
  }

  const handleSampleTypeSelect = (sampleType: string | null) => {
    setSelectedSampleType(sampleType)
    setShowTypeDropdown(false)
    searchSamples(searchQuery, undefined, selectedTagId, selectedStatus, sampleType)
  }

  const selectedTag = tags.find((t) => t.id === selectedTagId)

  const hasActiveFilters = selectedTagId !== null || selectedStatus !== null || selectedSampleType !== null

  const clearAllFilters = () => {
    setSelectedTagId(null)
    setSelectedStatus(null)
    setSelectedSampleType(null)
    triggerSearch()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索样本编号、名称、类型、来源..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          />
        </div>
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown)
              setShowTagDropdown(false)
              setShowTypeDropdown(false)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors ${
              selectedStatus ? "border-primary text-primary" : "border-gray-200"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className={selectedStatus ? "text-primary" : "text-gray-400"}>
              {selectedStatus || "按状态筛选"}
            </span>
            {selectedStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusSelect(null)
                }}
                className="hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    selectedStatus === status ? "bg-primary/5 text-primary" : "text-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown)
              setShowTagDropdown(false)
              setShowStatusDropdown(false)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors ${
              selectedSampleType ? "border-primary text-primary" : "border-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
            <span className={selectedSampleType ? "text-primary" : "text-gray-400"}>
              {selectedSampleType || "按类型筛选"}
            </span>
            {selectedSampleType && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSampleTypeSelect(null)
                }}
                className="hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
          {showTypeDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
              {sampleTypes.length > 0 ? (
                sampleTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSampleTypeSelect(type.name)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      selectedSampleType === type.name ? "bg-primary/5 text-primary" : "text-gray-700"
                    }`}
                  >
                    {type.name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-400">暂无类型</p>
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={tagDropdownRef}>
          <button
            onClick={() => {
              setShowTagDropdown(!showTagDropdown)
              setShowStatusDropdown(false)
              setShowTypeDropdown(false)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors ${
              selectedTag ? "border-primary text-primary" : "border-gray-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className={selectedTag ? "text-primary" : "text-gray-400"}>
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
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">已选筛选：</span>
          {selectedStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
              状态: {selectedStatus}
              <button onClick={() => handleStatusSelect(null)} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSampleType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
              类型: {selectedSampleType}
              <button onClick={() => handleSampleTypeSelect(null)} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
              标签: {selectedTag.name}
              <button onClick={() => handleTagSelect(null)} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700 ml-2"
          >
            清除全部
          </button>
        </div>
      )}
    </div>
  )
}
