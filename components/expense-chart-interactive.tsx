"use client"

import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import type { ExpenseEntry, ParsedExpenses } from "@/app/page"

interface ExpenseChartInteractiveProps {
  expenses: ParsedExpenses
  onMoveEntry?: (entryId: string, newCategory: string) => void
  onEditEntry?: (entryId: string) => void
  onCreateEntry?: (category: string) => void
}

type DisplayMode = "edit" | "preview"

// 固定配色方案
const FIXED_COLORS = [
  "#EBDFC5",
  "#E8BC8F",
  "#DB6A3E",
  "#81B7C3",
  "#7788A2",
]

// 固定类别顺序
const FIXED_CATEGORIES = ["超市", "车", "房", "餐饮", "娱乐", "订阅", "其他"]

interface SegmentData {
  entry: ExpenseEntry
  category: string
  y0: number
  y1: number
  x: number
  width: number
  color: string
  index: number
}

export function ExpenseChartInteractive({
  expenses,
  onMoveEntry,
  onEditEntry,
  onCreateEntry,
}: ExpenseChartInteractiveProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [draggedSegment, setDraggedSegment] = useState<SegmentData | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }) // 鼠标当前位置（g坐标系）
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>("preview")

  // 计算尺寸 - 根据数据动态调整，确保宽度在屏幕内
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && typeof window !== "undefined") {
        const rect = containerRef.current.getBoundingClientRect()
        // 限制宽度在屏幕内，留出一些边距
        const maxWidth = Math.min(rect.width || window.innerWidth * 0.8, window.innerWidth - 40)
        const width = Math.max(maxWidth, 600) // 最小宽度600px
        
        // 根据数据计算合适的图表高度
        const categories = Object.keys(expenses)
        const categoryCount = categories.length
        const maxTotal = Math.max(
          ...categories.map((cat) =>
            expenses[cat].reduce((sum, e) => sum + e.amount, 0)
          ),
          0
        )
        
        // 根据显示模式调整高度
        let calculatedHeight: number
        if (displayMode === "edit") {
          // 编辑模式：缩短高度，确保在屏幕内
          const maxEntryCount = Math.max(
            ...FIXED_CATEGORIES.map((cat) => (expenses[cat] || []).length),
            1
          )
          const fixedSegmentHeight = 25 // 缩短每个segment的高度
          const baseHeight = 200 // 基础高度（轴、标签等）
          calculatedHeight = Math.min(
            baseHeight + maxEntryCount * fixedSegmentHeight + 100,
            window.innerHeight * 0.7 // 最大不超过屏幕70%
          )
        } else {
          // 预览模式：高度按价格比例，但也要限制在屏幕内
          const baseHeight = 400
          const categoryHeight = categoryCount * 80
          const dataHeight = maxTotal > 0 ? Math.max(maxTotal * 2, 300) : 300
          calculatedHeight = Math.min(
            baseHeight + categoryHeight + dataHeight,
            window.innerHeight * 0.7 // 最大不超过屏幕70%
          )
        }
        
        setDimensions({
          width,
          height: calculatedHeight,
        })
      }
    }

    updateDimensions()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions)
      return () => window.removeEventListener("resize", updateDimensions)
    }
  }, [expenses, displayMode])

  // 绘制图表
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 40, right: 40, bottom: 120, left: 80 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    svg.attr("width", dimensions.width).attr("height", dimensions.height)

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // 准备数据 - 使用固定的类别顺序
    const allEntries: Array<{ entry: ExpenseEntry; category: string; index: number }> = []
    FIXED_CATEGORIES.forEach((category) => {
      if (expenses[category]) {
        expenses[category].forEach((entry, idx) => {
          allEntries.push({ entry, category, index: idx })
        })
      }
    })

    // 设置比例尺 - 使用固定类别顺序，即使没有数据也保留位置
    // 两种模式都使用相同的padding
    const xPadding = 0.15
    const xScale = (d3.scaleBand as any)()
      .domain(FIXED_CATEGORIES)
      .range([0, width])
      .padding(xPadding)

    // 计算所有支出金额
    const allAmounts: number[] = []
    FIXED_CATEGORIES.forEach((cat) => {
      if (expenses[cat]) {
        expenses[cat].forEach((entry) => {
          allAmounts.push(entry.amount)
        })
      }
    })
    
    const minAmount = allAmounts.length > 0 ? Math.min(...allAmounts) : 0
    const maxAmount = allAmounts.length > 0 ? Math.max(...allAmounts) : 0
    
    // 根据显示模式设置Y轴
    let yScale: any
    let yDomainMax = 0
    
    // 编辑模式下的顶部空白区域像素高度（用于点击创建新支出）
    // 固定为30px，确保始终可见且可点击
    const topEmptySpacePixels = 30
    
    if (displayMode === "edit") {
      // 编辑模式：高度固定，缩短每个segment的高度
      // 计算每个类别中的最大支出数量，用于确定固定高度
      const maxEntryCount = Math.max(
        ...FIXED_CATEGORIES.map((cat) => (expenses[cat] || []).length),
        1
      )
      // 每个segment固定高度，缩短高度
      const fixedSegmentHeight = 25 // 缩短每个segment的高度（从40改为25）
      
      // 计算可用高度（减去顶部空白区域）
      const availableHeight = height - topEmptySpacePixels
      
      // 计算segments需要的domain高度
      const segmentsDomainHeight = maxEntryCount * fixedSegmentHeight
      
      // Y轴的domain：从0（底部）到segmentsDomainHeight（顶部）
      // 但实际像素中，我们会为顶部空白区域留出空间
      yDomainMax = segmentsDomainHeight
      
      // Y轴只是用来定位，不代表价格
      // domain: [0, yDomainMax] 其中0是底部，yDomainMax是顶部
      // range: [height, topEmptySpacePixels] 其中height是底部，topEmptySpacePixels是顶部（segments从这里开始）
      // 这样segments从像素位置topEmptySpacePixels开始，不会覆盖顶部空白区域
      yScale = (d3.scaleLinear as any)()
        .domain([0, yDomainMax])
        .range([height, topEmptySpacePixels])
    } else {
      // 预览模式：高度按价格比例
      const fullStackData = FIXED_CATEGORIES.map((category) => {
        const entries = expenses[category] || []
        const totals = entries.reduce((acc, entry) => acc + entry.amount, 0)
        return { category, total: totals }
      })
      yDomainMax = (d3.max as any)(fullStackData, (d: any) => d.total) || 0
      const yPadding = yDomainMax < 100 ? 0.05 : 0.1
      yScale = (d3.scaleLinear as any)()
        .domain([0, yDomainMax * (1 + yPadding)])
        .range([height, 0])
        .nice()
    }

    // 创建segments - 按照固定类别顺序
    const segments: SegmentData[] = []
    FIXED_CATEGORIES.forEach((category) => {
      const entries = expenses[category] || []
      // 编辑模式下，segments从domain的0开始（对应像素的topEmptySpacePixels位置）
      // 这样segments不会覆盖顶部空白区域
      let y0 = displayMode === "edit" ? 0 : 0
      const fixedSegmentHeight = 25 // 编辑模式下的固定高度（缩短）

      entries.forEach((entry, entryIdx) => {
        let y1: number
        let color: string
        let segmentWidth: number
        
        if (displayMode === "edit") {
          // 编辑模式：固定高度，宽度占满类别宽度
          y1 = y0 + fixedSegmentHeight
          // 宽度占满类别宽度（恢复原来的设置）
          segmentWidth = xScale.bandwidth()
          
          // 颜色从绿到红，根据金额计算
          // 使用HSL颜色空间：绿色(120度)到红色(0度)
          const normalizedAmount = maxAmount > minAmount 
            ? (entry.amount - minAmount) / (maxAmount - minAmount)
            : 0.5
          // 从绿色(120度)到红色(0度)
          const hue = 120 * (1 - normalizedAmount)
          color = `hsl(${hue}, 70%, 50%)`
        } else {
          // 预览模式：按价格比例
          y1 = y0 + entry.amount
          segmentWidth = xScale.bandwidth()
          // 使用固定配色循环
          const entryIndex = allEntries.findIndex((e) => e.entry.id === entry.id)
          color = FIXED_COLORS[entryIndex % FIXED_COLORS.length]
        }
        
        // 计算x位置：两种模式都占满类别宽度
        const categoryX = xScale(category) || 0
        const segmentX = categoryX
        
        const segment: SegmentData = {
          entry,
          category,
          y0,
          y1,
          x: segmentX,
          width: segmentWidth,
          color,
          index: entryIdx,
        }
        segments.push(segment)
        y0 = y1
      })
    })

    // 绘制网格线 - 只在预览模式下显示（因为编辑模式下Y轴不代表价格）
    if (displayMode === "preview") {
      const yTicks = yScale.ticks(6)
      g.selectAll(".grid-line")
        .data(yTicks)
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
        .attr("stroke", "#E5E7EB")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "2,4")
        .attr("stroke-width", 0.5)
    }

    // 绘制segments
    const segmentGroups = g
      .selectAll(".segment-group")
      .data(segments)
      .enter()
      .append("g")
      .attr("class", "segment-group")
      .attr("data-entry-id", (d) => d.entry.id)
      .style("cursor", displayMode === "edit" ? "grab" : "default")

    const rects = segmentGroups
      .append("rect")
      .attr("x", (d) => d.x)
      .attr("width", (d) => d.width)
      .attr("y", (d) => {
        // 如果正在拖拽这个元素，不显示
        if (draggedSegment?.entry.id === d.entry.id) {
          return -1000 // 移到屏幕外
        }
        const y1Scaled = yScale(d.y1)
        return y1Scaled
      })
      .attr("height", (d) => {
        const y0Scaled = yScale(d.y0)
        const y1Scaled = yScale(d.y1)
        return Math.max(0, y0Scaled - y1Scaled)
      })
      .attr("fill", (d) => d.color)
      .attr("rx", 6) // 更圆润的边角
      .attr("stroke", "rgba(255,255,255,0.3)")
      .attr("stroke-width", 1.5)
      .style("transition", "all 0.2s ease")
      .attr("opacity", 1)
      .style("pointer-events", "all") // 确保segments可以接收拖拽事件
      .on("mouseenter", function (event: any, d: SegmentData) {
        if (draggedSegment?.entry.id !== d.entry.id) {
          d3.select(this as any)
            .attr("opacity", 0.85)
            .attr("stroke-width", 2)
            .attr("filter", "brightness(1.1)")
        }
      })
      .on("mouseleave", function () {
        d3.select(this as any)
          .attr("opacity", 1)
          .attr("stroke-width", 1.5)
          .attr("filter", "none")
      })

    // 添加文字标签 - 根据模式调整
    if (displayMode === "edit") {
      // 编辑模式：显示文字标签
      segmentGroups
        .filter((d: SegmentData) => yScale(d.y0) - yScale(d.y1) > 15 && !!d.entry.description)
        .append("text")
        .attr("x", (d) => d.x + d.width / 2)
        .attr("y", (d) => (yScale(d.y0) + yScale(d.y1)) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#2D3748") // 深灰色文字，更易读
        .attr("font-size", "9px") // 稍微缩小字体以适应更短的segment
        .attr("font-weight", "500")
        .attr("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
        .text((d) => {
          const text = d.entry.description || ""
          // 根据宽度计算能显示的最大字符数（每个字符约5.5px）
          const maxChars = Math.floor(d.width / 5.5)
          return text.length > maxChars ? text.substring(0, maxChars - 2) + ".." : text
        })
    } else {
      // 预览模式：原有逻辑
      segmentGroups
        .filter((d: SegmentData) => yScale(d.y0) - yScale(d.y1) > 25 && !!d.entry.description)
        .append("text")
        .attr("x", (d) => d.x + d.width / 2)
        .attr("y", (d) => (yScale(d.y0) + yScale(d.y1)) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#2D3748") // 深灰色文字，更易读
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .attr("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
        .text((d) => {
          const text = d.entry.description || ""
          return text.length > 15 ? text.substring(0, 15) + "..." : text
        })
      
      // 为小支出添加金额标签
      segmentGroups
        .filter((d: SegmentData) => yScale(d.y0) - yScale(d.y1) > 15 && yScale(d.y0) - yScale(d.y1) <= 25)
        .append("text")
        .attr("x", (d) => d.x + d.width / 2)
        .attr("y", (d) => (yScale(d.y0) + yScale(d.y1)) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#4A5568")
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
        .text((d) => `¥${d.entry.amount.toFixed(0)}`)
    }

    // 拖拽功能
    let dragStartPos = { x: 0, y: 0 }
    let segmentStartCenter = { x: 0, y: 0 } // segment的原始中心位置
    let currentDragSegment: SegmentData | null = null
    let currentHoveredCategory: string | null = null

    const drag = (d3.drag as any)()
      .on("start", function (this: SVGRectElement, event: any, d: SegmentData) {
        currentDragSegment = d
        setDraggedSegment(d)
        d3.select(this).attr("opacity", 0.3)
        // 获取鼠标在SVG坐标系中的位置
        const [mx, my] = (d3.pointer as any)(event, svg.node())
        dragStartPos = { x: mx - margin.left, y: my - margin.top }
        
        // 记录segment的原始中心位置（在g坐标系中）
        const y0Scaled = yScale(d.y0)
        const y1Scaled = yScale(d.y1)
        segmentStartCenter = {
          x: d.x + d.width / 2,
          y: (y0Scaled + y1Scaled) / 2,
        }
      })
      .on("drag", function (event: any, d: SegmentData) {
        if (!currentDragSegment) return

        // 获取鼠标在SVG坐标系中的位置（相对于g元素）
        const [mx, my] = (d3.pointer as any)(event, svg.node())
        const gx = mx - margin.left
        const gy = my - margin.top

        // 计算偏移量（相对于鼠标起始位置）
        const offsetX = gx - dragStartPos.x
        const offsetY = gy - dragStartPos.y
        setDragOffset({ x: offsetX, y: offsetY })
        // 同时记录鼠标当前位置
        setMousePos({ x: gx, y: gy })

        // 高亮目标类别 - 使用固定类别列表
        const targetCategory = FIXED_CATEGORIES.find((cat) => {
          const xPos = xScale(cat) || 0
          const xEnd = xPos + (xScale.bandwidth as any)()
          return gx >= xPos && gx <= xEnd
        })

        if (targetCategory && targetCategory !== d.category) {
          if (currentHoveredCategory !== targetCategory) {
            currentHoveredCategory = targetCategory
            setHoveredCategory(targetCategory)
          }
        } else {
          if (currentHoveredCategory) {
            currentHoveredCategory = null
            setHoveredCategory(null)
          }
        }
      })
      .on("end", function (this: SVGRectElement, event: any, d: SegmentData) {
        d3.select(this).attr("opacity", 1)

        // 立即清除预览和高亮元素
        const g = svg.select("g")
        g.selectAll(".hover-highlight").remove()
        g.selectAll(".drag-preview").remove()

        // 获取鼠标在SVG坐标系中的位置
        const [mx] = (d3.pointer as any)(event, svg.node())
        const gx = mx - margin.left

        // 确定目标类别 - 使用固定类别列表
        const targetCategory = FIXED_CATEGORIES.find((cat) => {
          const xPos = xScale(cat) || 0
          const xEnd = xPos + (xScale.bandwidth as any)()
          return gx >= xPos && gx <= xEnd
        })

        if (targetCategory && targetCategory !== d.category && onMoveEntry) {
          onMoveEntry(d.entry.id, targetCategory)
        }

        // 重置状态
        currentDragSegment = null
        currentHoveredCategory = null
        setDraggedSegment(null)
        setHoveredCategory(null)
        setDragOffset({ x: 0, y: 0 })
        setMousePos({ x: 0, y: 0 })
      })

    // 只在编辑模式下启用拖拽
    if (displayMode === "edit") {
      rects.call(drag)
    }

    // 添加整个空白区域（仅在编辑模式下）
    // 为每个类别创建从顶部到segments顶部的整个空白区域，都可以点击添加
    if (displayMode === "edit" && onCreateEntry) {
      // 为每个类别计算空白区域
      const categoryEmptyAreas = FIXED_CATEGORIES.map((category) => {
        // 找到当前类别最顶部的segment位置
        const categorySegments = segments.filter((s) => s.category === category)
        let emptyAreaTop = 0 // 类别顶部（像素坐标0）
        let emptyAreaBottom = topEmptySpacePixels // 默认从30px开始
        
        if (categorySegments.length > 0) {
          // 找到最顶部的segment位置
          const topSegment = categorySegments.reduce((min, seg) => {
            const segTop = Math.min(yScale(seg.y0), yScale(seg.y1))
            const minTop = Math.min(yScale(min.y0), yScale(min.y1))
            return segTop < minTop ? seg : min
          })
          const topSegmentY = Math.min(yScale(topSegment.y0), yScale(topSegment.y1))
          emptyAreaBottom = topSegmentY // 空白区域延伸到第一个segment的顶部
        } else {
          // 如果没有segments，整个区域都是空白（从顶部到segments应该开始的位置）
          emptyAreaBottom = topEmptySpacePixels
        }
        
        // 确保至少有一个可点击的空白区域（至少30px）
        const minEmptyHeight = 30
        if (emptyAreaBottom - emptyAreaTop < minEmptyHeight) {
          emptyAreaBottom = emptyAreaTop + minEmptyHeight
        }
        
        return {
          category,
          top: emptyAreaTop,
          bottom: emptyAreaBottom,
          height: emptyAreaBottom - emptyAreaTop,
        }
      })

      // 为每个类别创建空白区域（在segments之前插入，这样segments会在上面）
      const topClickAreas = g
        .selectAll(".empty-click-area")
        .data(categoryEmptyAreas)
        .enter()
        .insert("rect", ".segment-group") // 在segment-group之前插入，segments会在上面
        .attr("class", "empty-click-area")
        .attr("x", (d) => xScale(d.category) || 0)
        .attr("width", (xScale.bandwidth as any)())
        .attr("y", (d) => d.top)
        .attr("height", (d) => d.height)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .style("pointer-events", "all") // 确保可以接收点击事件
        .on("click", function (event: any, d: typeof categoryEmptyAreas[0]) {
          // 检查点击是否真的在当前类别的空白区域（不在segment上）
          const [mx, my] = (d3.pointer as any)(event, svg.node())
          const gx = mx - margin.left
          const gy = my - margin.top
          
          // 首先检查点击是否在当前类别的水平范围内
          const categoryX = xScale(d.category) || 0
          const categoryXEnd = categoryX + xScale.bandwidth()
          if (gx < categoryX || gx > categoryXEnd) {
            return // 不在当前类别范围内，不处理
          }
          
          // 检查是否点击在当前类别的空白区域内
          if (gy < d.top || gy > d.bottom) {
            return // 不在空白区域范围内，不处理
          }
          
          // 检查是否点击在当前类别的segment上
          let clickedOnSegment = false
          segments.forEach((segment) => {
            // 只检查当前类别的segments
            if (segment.category === d.category) {
              const segmentX = segment.x
              const segmentXEnd = segmentX + segment.width
              const segmentY0 = yScale(segment.y0)
              const segmentY1 = yScale(segment.y1)
              const segmentYTop = Math.min(segmentY0, segmentY1)
              const segmentYBottom = Math.max(segmentY0, segmentY1)

              if (
                gx >= segmentX &&
                gx <= segmentXEnd &&
                gy >= segmentYTop &&
                gy <= segmentYBottom
              ) {
                clickedOnSegment = true
              }
            }
          })

          // 只有在空白区域且不在segment上时才创建
          if (!clickedOnSegment && onCreateEntry) {
            event.stopPropagation()
            onCreateEntry(d.category)
          }
        })
        .on("mouseenter", function (event: any, d: typeof categoryEmptyAreas[0]) {
          const [mx, my] = (d3.pointer as any)(event, svg.node())
          const gy = my - margin.top
          const gx = mx - margin.left
          
          // 首先检查鼠标是否在当前类别的水平范围内
          const categoryX = xScale(d.category) || 0
          const categoryXEnd = categoryX + xScale.bandwidth()
          if (gx < categoryX || gx > categoryXEnd) {
            return // 不在当前类别范围内，不处理
          }
          
          // 检查是否在空白区域内
          if (gy < d.top || gy > d.bottom) {
            return // 不在空白区域范围内，不处理
          }
          
          // 检查是否在当前类别的segment上
          let onSegment = false
          segments.forEach((segment) => {
            if (segment.category === d.category) {
              const segmentX = segment.x
              const segmentXEnd = segmentX + segment.width
              const segmentY0 = yScale(segment.y0)
              const segmentY1 = yScale(segment.y1)
              const segmentYTop = Math.min(segmentY0, segmentY1)
              const segmentYBottom = Math.max(segmentY0, segmentY1)
              if (
                gx >= segmentX &&
                gx <= segmentXEnd &&
                gy >= segmentYTop &&
                gy <= segmentYBottom
              ) {
                onSegment = true
              }
            }
          })
          
          // 只在空白区域且不在segment上时显示效果
          if (!onSegment) {
            d3.select(this)
              .attr("fill", "rgba(148, 163, 184, 0.08)")
              .attr("stroke", "rgba(148, 163, 184, 0.3)")
              .attr("stroke-width", 1)
              .attr("stroke-dasharray", "4,4")
            
            // 显示提示文字
            const hint = g.select(`.empty-click-hint-${d.category}`)
            if (hint.empty()) {
              const xPos = xScale(d.category) || 0
              const width = xScale.bandwidth()
              g.append("text")
                .attr("class", `empty-click-hint-${d.category}`)
                .attr("x", xPos + width / 2)
                .attr("y", d.top + d.height / 2) // 空白区域中心
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#64748B")
                .attr("font-size", "10px")
                .attr("font-weight", "500")
                .text("点击添加")
                .style("pointer-events", "none")
            }
          }
        })
        .on("mouseleave", function (event: any, d: typeof categoryEmptyAreas[0]) {
          d3.select(this)
            .attr("fill", "transparent")
            .attr("stroke", "none")
          g.select(`.empty-click-hint-${d.category}`).remove()
        })
    }

    // X轴 - 更优雅的样式
    const xAxis = (d3.axisBottom as any)(xScale)
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("fill", "#64748B")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
    
    // 对于没有数据的类别，使用灰色显示
    xAxisGroup.each(function (d: any) {
      const category = d as string
      const hasData = expenses[category] && expenses[category].length > 0
      if (!hasData) {
        d3.select(this).attr("fill", "#CBD5E1").attr("opacity", 0.5)
      }
    })
    
    // X轴线
    g.select(".x-axis")
      .select(".domain")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-width", 1.5)
    
    g.select(".x-axis")
      .selectAll("line")
      .attr("stroke", "#E2E8F0")
      .attr("stroke-width", 1)

    // Y轴 - 只在预览模式下显示价格
    if (displayMode === "preview") {
      const yAxis = (d3.axisLeft as any)(yScale).tickFormat((d: number) => `¥${d}`)
      g.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("text")
        .attr("fill", "#64748B")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
      
      // Y轴线
      g.select(".y-axis")
        .select(".domain")
        .attr("stroke", "#CBD5E1")
        .attr("stroke-width", 1.5)
      
      g.select(".y-axis")
        .selectAll("line")
        .attr("stroke", "#E2E8F0")
        .attr("stroke-width", 1)
    } else {
      // 编辑模式：Y轴不显示价格标签
      const yAxis = (d3.axisLeft as any)(yScale).tickFormat(() => "")
      g.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
      
      g.select(".y-axis")
        .select(".domain")
        .attr("stroke", "#CBD5E1")
        .attr("stroke-width", 1.5)
      
      g.select(".y-axis")
        .selectAll("line")
        .attr("stroke", "#E2E8F0")
        .attr("stroke-width", 1)
    }

  }, [dimensions, expenses, onMoveEntry, onCreateEntry, displayMode])

  // 单独处理拖拽预览和高亮
  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const g = svg.select("g")
    if (g.empty()) return

    // 如果没有正在拖拽的元素，清除所有预览和高亮
    if (!draggedSegment || (mousePos.x === 0 && mousePos.y === 0)) {
      g.selectAll(".hover-highlight").remove()
      g.selectAll(".drag-preview").remove()
      return
    }

    const margin = { top: 40, right: 40, bottom: 120, left: 80 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const xScale = (d3.scaleBand as any)()
      .domain(FIXED_CATEGORIES)
      .range([0, width])
      .padding(0.15)

    // 清除之前的预览和高亮
    g.selectAll(".hover-highlight").remove()
    g.selectAll(".drag-preview").remove()

    // 高亮目标类别
    if (hoveredCategory) {
      const xPos = xScale(hoveredCategory) || 0
      const xWidth = xScale.bandwidth()

      g.append("rect")
        .attr("class", "hover-highlight")
        .attr("x", xPos)
        .attr("width", xWidth)
        .attr("y", 0)
        .attr("height", height)
        .attr("fill", "rgba(148, 163, 184, 0.12)") // 柔和的灰色高亮
        .attr("stroke", "rgba(148, 163, 184, 0.4)")
        .attr("stroke-width", 2.5)
        .attr("rx", 6)
        .attr("pointer-events", "none")
    }

    // 拖拽中的预览 - 跟随鼠标位置
    const allAmounts: number[] = []
    FIXED_CATEGORIES.forEach((cat) => {
      if (expenses[cat]) {
        expenses[cat].forEach((entry) => {
          allAmounts.push(entry.amount)
        })
      }
    })
    const maxAmount = allAmounts.length > 0 ? Math.max(...allAmounts) : 0
    const minAmount = allAmounts.length > 0 ? Math.min(...allAmounts) : 0
    const normalizedAmount = maxAmount > minAmount 
      ? (draggedSegment.entry.amount - minAmount) / (maxAmount - minAmount)
      : 0.5
    const hue = 120 * (1 - normalizedAmount)
    const previewColor = displayMode === "edit" 
      ? `hsl(${hue}, 70%, 50%)`
      : draggedSegment.color

    const fixedSegmentHeight = 25 // 编辑模式下的固定高度
    const previewHeight = displayMode === "edit" 
      ? fixedSegmentHeight
      : height * 0.1 // 预览模式下的预览高度

    // 计算预览位置：直接跟随鼠标位置
    // 需要重新计算yScale来获取segment的原始像素位置
    let yScaleForPreview: any
    if (displayMode === "edit") {
      const maxEntryCount = Math.max(
        ...FIXED_CATEGORIES.map((cat) => (expenses[cat] || []).length),
        1
      )
      const fixedSegmentHeight = 25
      const yDomainMax = maxEntryCount * fixedSegmentHeight
      yScaleForPreview = (d3.scaleLinear as any)()
        .domain([0, yDomainMax])
        .range([height, 0])
    } else {
      const fullStackData = FIXED_CATEGORIES.map((category) => {
        const entries = expenses[category] || []
        const totals = entries.reduce((acc, entry) => acc + entry.amount, 0)
        return { category, total: totals }
      })
      const yDomainMax = (d3.max as any)(fullStackData, (d: any) => d.total) || 0
      const yPadding = yDomainMax < 100 ? 0.05 : 0.1
      yScaleForPreview = (d3.scaleLinear as any)()
        .domain([0, yDomainMax * (1 + yPadding)])
        .range([height, 0])
        .nice()
    }
    
    // 预览位置：完全跟随鼠标位置（居中显示）
    const previewX = mousePos.x - draggedSegment.width / 2
    const previewY = mousePos.y - previewHeight / 2

    // 如果悬停在目标类别上，将预览居中显示在该类别
    let finalPreviewX = previewX
    if (hoveredCategory) {
      const targetXPos = xScale(hoveredCategory) || 0
      finalPreviewX = targetXPos + (xScale.bandwidth() - draggedSegment.width) / 2
    }

    g.append("rect")
      .attr("class", "drag-preview")
      .attr("x", finalPreviewX)
      .attr("width", draggedSegment.width)
      .attr("y", previewY - previewHeight / 2)
      .attr("height", previewHeight)
      .attr("fill", previewColor)
      .attr("opacity", 0.75)
      .attr("rx", 6)
      .attr("stroke", "rgba(255,255,255,0.9)")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "6,4")
      .attr("pointer-events", "none")
      .attr("filter", "drop-shadow(0 6px 12px rgba(0,0,0,0.25))")
  }, [draggedSegment, dragOffset, mousePos, hoveredCategory, dimensions, expenses, displayMode])

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        minHeight: 400,
        height: dimensions.height || 600,
      }}
    >
      {/* 控制面板 */}
      <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          显示模式：
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode("edit")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              displayMode === "edit"
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            编辑模式
          </button>
          <button
            onClick={() => setDisplayMode("preview")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              displayMode === "preview"
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            预览模式
          </button>
        </div>
        <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {displayMode === "edit" && (
            <span>所有支出高度相同，颜色由金额决定（绿→红），可拖拽调整</span>
          )}
          {displayMode === "preview" && (
            <span>高度按价格比例，使用固定配色，不可拖拽</span>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: dimensions.height || 600 }}
      />
    </div>
  )
}

