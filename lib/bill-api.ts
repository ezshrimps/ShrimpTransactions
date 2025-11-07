import type { ExpenseConfig } from "@/app/page"

const API_BASE = "/api/bills"

/**
 * 获取所有账单
 */
export async function fetchBills(): Promise<ExpenseConfig[]> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('xiami_user_id') : null
  const response = await fetch(API_BASE, { headers: userId ? { 'x-user-id': userId } : undefined })
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to fetch bills:", errorText)
    throw new Error(`获取账单列表失败: ${errorText}`)
  }
  return response.json()
}

/**
 * 创建新账单
 */
export async function createBill(id: string, name: string, rawInput: string): Promise<void> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('xiami_user_id') : null
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(userId ? { 'x-user-id': userId } : {}) },
    body: JSON.stringify({ id, name, rawInput }),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to create bill:", errorText)
    throw new Error(`创建账单失败: ${errorText}`)
  }
}

/**
 * 更新账单
 */
export async function updateBill(id: string, name: string, rawInput: string): Promise<void> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('xiami_user_id') : null
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(userId ? { 'x-user-id': userId } : {}) },
    body: JSON.stringify({ name, rawInput }),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to update bill:", errorText)
    throw new Error(`更新账单失败: ${errorText}`)
  }
}

/**
 * 删除账单
 */
export async function deleteBill(id: string): Promise<void> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('xiami_user_id') : null
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE", headers: userId ? { 'x-user-id': userId } : undefined })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to delete bill:", errorText)
    throw new Error(`删除账单失败: ${errorText}`)
  }
}

