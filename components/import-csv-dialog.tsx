"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportParsed: (parsed: Record<string, Array<{ amount: number; description?: string }>>) => void
}

export function ImportCsvDialog({ open, onOpenChange, onImportParsed }: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [colCategory, setColCategory] = useState<string>("")
  const [colAmount, setColAmount] = useState<string>("")
  const [colDesc, setColDesc] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const parseCsv = (raw: string) => {
    const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean)
    if (lines.length === 0) return { headers: [], rows: [] }
    const hdr = lines[0].split(",").map((s) => s.trim())
    const body = lines.slice(1).map((ln) => ln.split(",").map((s) => s.trim()))
    return { headers: hdr, rows: body }
  }

  const handleFile = async (f: File) => {
    const t = await f.text()
    const { headers: hdr, rows: body } = parseCsv(t)
    setFile(f)
    setText(t)
    setHeaders(hdr)
    setRows(body)
    if (hdr.length >= 2) {
      setColCategory(hdr[0])
      setColAmount(hdr[1])
      setColDesc(hdr[2] || "")
    }
  }

  const canImport = useMemo(() => {
    return headers.length > 0 && colCategory && colAmount
  }, [headers, colCategory, colAmount])

  const onImport = () => {
    try {
      if (!canImport) return
      const cIdx = headers.indexOf(colCategory)
      const aIdx = headers.indexOf(colAmount)
      const dIdx = colDesc ? headers.indexOf(colDesc) : -1
      if (cIdx < 0 || aIdx < 0) {
        setError("请选择正确的列映射")
        return
      }
      const grouped: Record<string, Array<{ amount: number; description?: string }>> = {}
      for (const r of rows) {
        const category = (r[cIdx] || "").trim()
        const amount = Number.parseFloat((r[aIdx] || "").replace(/[$,]/g, ""))
        const description = dIdx >= 0 ? (r[dIdx] || "").trim() : undefined
        if (!category || !Number.isFinite(amount) || amount <= 0) continue
        if (!grouped[category]) grouped[category] = []
        grouped[category].push({ amount, description: description || undefined })
      }
      onImportParsed(grouped)
      setError(null)
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || "解析失败")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>导入 CSV</DialogTitle>
          <DialogDescription>上传 CSV 并映射列（类别/金额/备注），预览后导入</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
            {file && <div className="text-xs text-slate-500">已选择：{file.name}</div>}
          </div>
          {headers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">类别列</label>
                <select className="w-full border rounded px-2 py-1" value={colCategory} onChange={(e) => setColCategory(e.target.value)}>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">金额列</label>
                <select className="w-full border rounded px-2 py-1" value={colAmount} onChange={(e) => setColAmount(e.target.value)}>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">备注列（可选）</label>
                <select className="w-full border rounded px-2 py-1" value={colDesc} onChange={(e) => setColDesc(e.target.value)}>
                  <option value="">（无）</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {rows.length > 0 && (
            <div className="border rounded p-2 max-h-64 overflow-auto text-xs font-mono">
              <div className="text-slate-500 mb-2">预览（前 20 行）：</div>
              <table className="w-full">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="text-left pr-3 py-1 border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, idx) => (
                    <tr key={idx}>
                      {r.map((c, i) => (
                        <td key={i} className="pr-3 py-1 border-b border-slate-100">{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onImport} disabled={!canImport}>导入</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


