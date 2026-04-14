const SHEET_ID = '1oG10Q8gWyeiqS0rl0sNik7radJFkZQJ1okWuz8D0N04'
const SHEET_GID = '0'
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`

// Google Apps Script Web App URL — deploy the script bound to this sheet and paste the URL here
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''

function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (inQuotes) {
      if (char === '"' && csv[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(current.trim())
      current = ''
    } else if (char === '\n' || (char === '\r' && csv[i + 1] === '\n')) {
      row.push(current.trim())
      current = ''
      if (row.some((cell) => cell !== '')) {
        rows.push(row)
      }
      row = []
      if (char === '\r') i++
    } else {
      current += char
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim())
    if (row.some((cell) => cell !== '')) {
      rows.push(row)
    }
  }

  return rows
}

export interface SheetRow {
  [key: string]: string
}

function rowsToObjects(rows: string[][]): SheetRow[] {
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => header.toLowerCase().trim())
  return rows.slice(1).map((row) => {
    const obj: SheetRow = {}
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? ''
    })
    return obj
  })
}

export interface SheetPricingData {
  licenses?: Array<{ id: string; name: string; basePrice: number }>
  visas?: Array<{ id: string; name: string; fee: number }>
  addOns?: Array<{ id: string; name: string; fee: number; groupId: string }>
  activities?: Array<{ code: string; name: string; categoryId: string; preApproval: boolean }>
  durations?: Record<number, number>
  config?: {
    extraShareholderFee?: number
    includedShareholders?: number
    includedActivityCount?: number
    extraActivityFee?: number
    visaAllocationFee?: number
    immigrationCardFee?: number
    changeStatusInsideFee?: number
  }
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

function mapSheetData(objects: SheetRow[]): SheetPricingData {
  const data: SheetPricingData = {}

  const licenses: SheetPricingData['licenses'] = []
  const visas: SheetPricingData['visas'] = []
  const addOns: SheetPricingData['addOns'] = []
  const activities: SheetPricingData['activities'] = []
  const durations: Record<number, number> = {}
  const config: NonNullable<SheetPricingData['config']> = {}

  for (const row of objects) {
    const type = (row['type'] ?? row['category'] ?? '').toLowerCase()
    const name = row['name'] ?? row['item'] ?? ''
    const id = row['id'] ?? name.toLowerCase().replace(/\s+/g, '-')
    const price = parseNumber(row['price'] ?? row['fee'] ?? row['cost'] ?? row['amount'] ?? '0')

    if (!name && !type) continue

    switch (type) {
      case 'license':
        licenses.push({ id, name, basePrice: price })
        break
      case 'visa':
        visas.push({ id, name, fee: price })
        break
      case 'addon':
      case 'add-on':
      case 'add on': {
        const groupId = (row['group'] ?? row['groupid'] ?? row['group_id'] ?? '').toLowerCase()
        addOns.push({ id, name, fee: price, groupId })
        break
      }
      case 'activity': {
        const categoryId = (row['categoryid'] ?? row['category_id'] ?? row['group'] ?? '').toLowerCase()
        const code = row['code'] ?? ''
        const preApproval = (row['preapproval'] ?? row['pre_approval'] ?? '').toLowerCase() === 'true'
        activities.push({ code, name, categoryId, preApproval })
        break
      }
      case 'duration': {
        const years = parseNumber(row['years'] ?? row['duration'] ?? '0')
        if (years > 0) durations[years] = price
        break
      }
      case 'config':
      case 'setting': {
        const key = (row['key'] ?? row['setting'] ?? name).toLowerCase().replace(/\s+/g, '')
        const value = parseNumber(row['value'] ?? String(price))
        if (key.includes('shareholder') && key.includes('fee')) config.extraShareholderFee = value
        else if (key.includes('includedshareholder')) config.includedShareholders = value
        else if (key.includes('includedactivity') || key.includes('activitycount')) config.includedActivityCount = value
        else if (key.includes('activityfee') || key.includes('extraactivity')) config.extraActivityFee = value
        else if (key.includes('visaallocation')) config.visaAllocationFee = value
        else if (key.includes('immigration')) config.immigrationCardFee = value
        else if (key.includes('changestatus') || key.includes('statusfee')) config.changeStatusInsideFee = value
        break
      }
    }
  }

  if (licenses.length > 0) data.licenses = licenses
  if (visas.length > 0) data.visas = visas
  if (addOns.length > 0) data.addOns = addOns
  if (activities.length > 0) data.activities = activities
  if (Object.keys(durations).length > 0) data.durations = durations
  if (Object.keys(config).length > 0) data.config = config

  return data
}

export async function fetchSheetData(): Promise<SheetPricingData | null> {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('text/html')) {
      return null
    }

    const csv = await response.text()
    if (!csv.trim() || csv.includes('<!DOCTYPE') || csv.includes('<html')) {
      return null
    }

    const rows = parseCSV(csv)
    const objects = rowsToObjects(rows)
    return mapSheetData(objects)
  } catch {
    return null
  }
}

export interface QuoteSubmission {
  fullName: string
  currentCountryOfResidence: string
  phone: string
  email: string
  licenseName: string
  durationYears: number
  shareholders: number
  activities: string[]
  investorVisa: boolean
  employeeVisas: number
  dependentVisas: number
  applicantsInsideUae: number
  addOns: string[]
  totalAed: number
}

export async function submitQuoteToSheet(data: QuoteSubmission): Promise<boolean> {
  if (!APPS_SCRIPT_URL) {
    console.warn('VITE_APPS_SCRIPT_URL is not set — quote will not be saved to Google Sheets.')
    return false
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        fullName: data.fullName,
        currentCountryOfResidence: data.currentCountryOfResidence,
        phone: data.phone,
        email: data.email,
        licenseName: data.licenseName,
        durationYears: data.durationYears,
        shareholders: data.shareholders,
        activities: data.activities.join(', '),
        investorVisa: data.investorVisa ? 'Yes' : 'No',
        employeeVisas: data.employeeVisas,
        dependentVisas: data.dependentVisas,
        applicantsInsideUae: data.applicantsInsideUae,
        addOns: data.addOns.join(', '),
        totalAed: data.totalAed,
      }),
      signal: AbortSignal.timeout(10000),
    })

    return response.ok
  } catch {
    return false
  }
}
