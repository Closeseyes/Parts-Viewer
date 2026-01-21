import React, { useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import './ImportParts.css'

interface ImportPartsProps {
  onImported: (summary: { inserted: number; skipped: number }) => void
}

type ColumnMapping = {
  partname: string
  vendor: string
  price: string
  price_usd: string
  price_krw: string
  sap_code: string
  category: string
  id: string
}

export const ImportParts: React.FC<ImportPartsProps> = ({ onImported }) => {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [rawRows, setRawRows] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    partname: '',
    vendor: '',
    price: '',
    price_usd: '',
    price_krw: '',
    sap_code: '',
    category: '',
    id: '',
  })
  const [parsing, setParsing] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'idle' | 'mapping' | 'preview'>('idle')
  const [validated, setValidated] = useState<Array<{ row: any; valid: boolean; errors: string[] }>>([])

  const note = '필수 컬럼: partname, vendor, price | 선택: sap_code, category, id | price는 자동으로 원화/달러 판단'

  // 통화 타입 감지: 셀 값에서 원화/달러 구분
  const detectCurrencyAndValue = (cellValue: any): { price_usd: number | null; price_krw: number | null } => {
    if (!cellValue) return { price_usd: null, price_krw: null }

    const str = String(cellValue).trim()
    const num = parseFloat(str.replace(/[^\d.]/g, ''))

    if (!Number.isFinite(num)) {
      return { price_usd: null, price_krw: null }
    }

    // 달러 표시 찾기
    const isDollar = /\$|dollar|usd|USD/i.test(str)

    // 원화 표시 찾기
    const isKrw = /원|₩|won|krw|KRW/i.test(str)

    if (isDollar && !isKrw) {
      return { price_usd: num, price_krw: null }
    }

    if (isKrw && !isDollar) {
      return { price_usd: null, price_krw: num }
    }

    // 기호가 없으면 숫자 크기로 판단
    // 보통 원화는 1000 이상, 달러는 1000 미만
    if (num >= 1000) {
      return { price_usd: null, price_krw: num }
    } else {
      return { price_usd: num, price_krw: null }
    }
  }

  const handleFiles = (file: File) => {
    setParsing(true)
    setMessage('')
    setStep('idle')
    setRawRows([])
    setHeaders([])
    setValidated([])

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = Array.isArray(res.data) ? (res.data as any[]) : []
          if (data.length > 0) {
            const cols = Object.keys(data[0])
            setHeaders(cols)
            setRawRows(data)
            autoMapColumns(cols)
            setStep('mapping')
          }
          setParsing(false)
        },
        error: (err) => {
          setParsing(false)
          setMessage('CSV 파싱 오류: ' + err.message)
        },
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
          
          if (json.length < 2) {
            setMessage('엑셀 파일에 데이터가 없습니다.')
            setParsing(false)
            return
          }

          // A~Z열까지만 (최대 26개)
          const maxCols = Math.min(json[0].length, 26)
          const cols = json[0].slice(0, maxCols).map((c: any, idx: number) => {
            const cellValue = String(c ?? '').trim()
            const colLetter = String.fromCharCode(65 + idx)
            return cellValue ? `${colLetter}열: ${cellValue}` : `${colLetter}열 (빈칸)`
          })
          
          const dataRows = json.slice(1).map((row) => {
            const obj: any = {}
            cols.forEach((col, i) => {
              obj[col] = row[i]
            })
            return obj
          })

          setHeaders(cols)
          setRawRows(dataRows)
          autoMapColumns(cols)
          setStep('mapping')
          setParsing(false)
        } catch (err: any) {
          setParsing(false)
          setMessage('엑셀 파싱 오류: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setParsing(false)
      setMessage('지원하지 않는 파일 형식입니다. CSV 또는 XLSX만 가능합니다.')
    }
  }

  const autoMapColumns = (cols: string[]) => {
    const lower = cols.map((c) => c.toLowerCase())
    const findCol = (candidates: string[]) => {
      for (const cand of candidates) {
        const idx = lower.findIndex(c => c.includes(cand.toLowerCase()))
        if (idx !== -1) return cols[idx]
      }
      return ''
    }

    setMapping({
      partname: findCol(['partname', 'part_name', 'name', '부품명']),
      vendor: findCol(['vendor', 'supplier', '공급업체', '업체']),
      price: findCol(['price', 'unit_price', 'cost', '단가', '가격', '원화', '달러', '원', '$']),
      price_usd: '',
      price_krw: '',
      sap_code: findCol(['sap_code', 'sap', 'code', 'SAP코드']),
      category: findCol(['category', 'cat', 'type', '카테고리', '분류']),
      id: findCol(['id', 'part_id']),
    })
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFiles(file)
  }

  const onPreview = () => {
    if (!mapping.partname || !mapping.vendor || !mapping.price) {
      alert('필수 컬럼(partname, vendor, price)을 모두 매핑해주세요.')
      return
    }

    const validationResults = rawRows.map((row) => {
      const errors: string[] = []
      const partname = String(row[mapping.partname] ?? '').trim()
      const vendor = String(row[mapping.vendor] ?? '').trim()
      const priceRaw = row[mapping.price]
      const sapCode = mapping.sap_code ? String(row[mapping.sap_code] ?? '').trim() : ''
      const categoryName = mapping.category ? String(row[mapping.category] ?? '').trim() : ''

      // 통화 감지 및 가격 파싱
      const { price_usd, price_krw } = detectCurrencyAndValue(priceRaw)

      // 필수 필드 공백 체크
      if (!partname) errors.push('부품명 누락')
      if (!vendor) errors.push('공급업체 누락')
      if (price_usd === null && price_krw === null) errors.push('가격 오류 (원화 또는 달러 감지 실패)')
      
      // 선택 필드도 값이 있으면 공백 체크
      if (mapping.sap_code && row[mapping.sap_code] !== undefined && row[mapping.sap_code] !== '' && !sapCode) {
        errors.push('SAP코드 공백')
      }

      return { row, valid: errors.length === 0, errors }
    })

    setValidated(validationResults)
    setStep('preview')
  }

  const onImport = async () => {
    const validRows = validated.filter((v) => v.valid).map((v) => v.row)
    if (!validRows.length) {
      alert('가져올 유효한 데이터가 없습니다.')
      return
    }

    try {
      const normalized = validRows.map((r) => {
        const { price_usd, price_krw } = detectCurrencyAndValue(r[mapping.price])
        return {
          id: mapping.id ? r[mapping.id] : undefined,
          partname: r[mapping.partname],
          vendor: r[mapping.vendor],
          price: price_usd ?? price_krw ?? 0, // 기본 price 값
          price_usd: price_usd,
          price_krw: price_krw,
          sap_code: mapping.sap_code ? r[mapping.sap_code] : undefined,
          category: mapping.category ? r[mapping.category] : undefined,
        }
      })

      const api = (window as any).electron
      if (!api || typeof api.bulkAddParts !== 'function') {
        const msg = 'Electron API가 없습니다. 브라우저에서 실행 중입니다. (Electron 앱에서 실행해주세요)'
        setMessage(msg)
        alert(msg)
        return
      }

      const result = await api.bulkAddParts(normalized)
      const totalRows = validated.length
      const failedRows = validated.filter((v) => !v.valid).length
      
      const successCount = result.inserted ?? 0
      const updatedCount = result.updated ?? 0
      const skippedCount = result.skipped ?? 0

      const summaryMsg = `✅ 신규 등록: ${successCount}건 | 🔄 가격 업데이트: ${updatedCount}건 | ❌ 등록 실패: ${failedRows}건 | ⚠️ 건너뜀: ${skippedCount}건 (총 ${totalRows}건)`
      const errorSamples = (result.errors || []).slice(0, 3).map((e: any) => `행 ${e.index + 2}: ${e.message}`).join('\n')

      setMessage(summaryMsg)
      onImported({ inserted: successCount, skipped: skippedCount })
      alert([
        '등록 결과',
        '',
        summaryMsg,
        errorSamples ? '\n상위 오류:\n' + errorSamples : ''
      ].join('\n'))
      setStep('idle')
      setRawRows([])
      setValidated([])
    } catch (e: any) {
      const msg = '등록 실패: ' + (e?.message ?? 'unknown')
      setMessage(msg)
      alert(msg)
    }
  }

  const reset = () => {
    setRawRows([])
    setHeaders([])
    setValidated([])
    setMessage('')
    setStep('idle')
  }

  return (
    <div className="import-container">
      <div className="import-card">
        <div className="import-header">
          <h2>CSV/Excel 일괄 등록</h2>
          <div className="hint">{note}</div>
        </div>
      <div className="import-body">
        {step === 'idle' && (
          <>
            <div
              className="dropzone"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={onDrop}
            >
              여기로 CSV 또는 Excel 파일을 드래그하거나
              <button className="btn small" onClick={() => fileRef.current?.click()}>파일 선택</button>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFiles(file)
              }} />
            </div>
            <div className="import-status">
              {parsing ? '파싱 중...' : '대기 중'}
            </div>
          </>
        )}

        {step === 'mapping' && (
          <div className="mapping-section">
            <h3>컬럼 매핑</h3>
            <p className="mapping-desc">파일의 각 컬럼을 시스템 필드에 연결해주세요.</p>
            <table className="mapping-table">
              <thead>
                <tr>
                  <th>시스템 필드</th>
                  <th>파일 컬럼</th>
                  <th>필수 여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>부품명 (partname)</td>
                  <td>
                    <select value={mapping.partname} onChange={(e) => setMapping({ ...mapping, partname: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="required">필수</td>
                </tr>
                <tr>
                  <td>공급업체 (vendor)</td>
                  <td>
                    <select value={mapping.vendor} onChange={(e) => setMapping({ ...mapping, vendor: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="required">필수</td>
                </tr>
                <tr>
                  <td>단가 (price) - 자동으로 원화/달러 판단</td>
                  <td>
                    <select value={mapping.price} onChange={(e) => setMapping({ ...mapping, price: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="required">필수</td>
                </tr>
                <tr>
                  <td>SAP 코드 (sap_code)</td>
                  <td>
                    <select value={mapping.sap_code} onChange={(e) => setMapping({ ...mapping, sap_code: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="optional">선택</td>
                </tr>
                <tr>
                  <td>카테고리 (category)</td>
                  <td>
                    <select value={mapping.category} onChange={(e) => setMapping({ ...mapping, category: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="optional">선택</td>
                </tr>
                <tr>
                  <td>ID (id)</td>
                  <td>
                    <select value={mapping.id} onChange={(e) => setMapping({ ...mapping, id: e.target.value })}>
                      <option value="">선택 안 함</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="optional">선택 (자동생성)</td>
                </tr>
              </tbody>
            </table>
            <div className="import-actions">
              <button className="btn save" onClick={onPreview}>미리보기</button>
              <button className="btn cancel" onClick={reset}>취소</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="preview-section">
            <h3>데이터 미리보기</h3>
            <p className="preview-desc">
              총 {validated.length}행 중 유효: {validated.filter((v) => v.valid).length}행, 
              오류: {validated.filter((v) => !v.valid).length}행
            </p>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>부품명</th>
                    <th>공급업체</th>
                    <th>단가</th>
                    <th>SAP 코드</th>
                    <th>오류</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.slice(0, 100).map((v, idx) => (
                    <tr key={idx} className={v.valid ? 'valid-row' : 'error-row'}>
                      <td>{v.valid ? '✓' : '✗'}</td>
                      <td>{v.row[mapping.partname]}</td>
                      <td>{v.row[mapping.vendor]}</td>
                      <td>{v.row[mapping.price]}</td>
                      <td>{mapping.sap_code ? v.row[mapping.sap_code] : '-'}</td>
                      <td className="error-cell">{v.errors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validated.length > 100 && <div className="preview-note">처음 100행만 표시됩니다.</div>}
            <div className="import-actions">
              <button className="btn save" onClick={onImport}>가져오기 ({validated.filter((v) => v.valid).length}건)</button>
              <button className="btn" onClick={() => setStep('mapping')}>뒤로</button>
              <button className="btn cancel" onClick={reset}>취소</button>
            </div>
          </div>
        )}

        {message && <div className="import-message">{message}</div>}
      </div>
    </div>
    </div>
  )
}
