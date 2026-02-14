'use client'

import { useEffect, useState } from 'react'
import { getCreditLedger } from '@/lib/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type CreditLedgerRow = {
  _id: string
  type: string
  amount: number
  balanceAfter: number
  createdAt: string
  user?: {
    _id?: string
    username?: string
  }
}

type Pagination = {
  page: number
  hasMore: boolean
}

export default function CreditsPage() {
  const [rows, setRows] = useState<CreditLedgerRow[]>([])
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [type, setType] = useState('')
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (requestedPage = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await getCreditLedger({
        page: requestedPage,
        limit: 30,
        userId: userId || undefined,
        type: type || undefined,
      })
      setRows(res.data || [])
      setPagination(
        res.pagination
          ? { page: res.pagination.page, hasMore: res.pagination.hasMore }
          : null
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold'>Credit Ledger</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-3 flex flex-wrap gap-2'>
            <Input
              placeholder='Filter by userId'
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className='max-w-xs'
            />
            <Input
              placeholder='Filter by type'
              value={type}
              onChange={(e) => setType(e.target.value)}
              className='max-w-xs'
            />
            <Button
              onClick={() => {
                setPage(1)
                load(1)
              }}>
              Apply
            </Button>
          </div>
          {error ? <p className='text-sm text-error mb-2'>{error}</p> : null}
          {loading ? <p>Loading...</p> : null}
          {!loading ? (
            <div className='overflow-x-auto rounded-lg border border-border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>
                        <p className='font-medium'>{row.user?.username || '-'}</p>
                        <p className='text-xs text-muted-foreground'>
                          {row.user?._id || '-'}
                        </p>
                      </TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell
                        className={row.amount >= 0 ? 'text-success' : 'text-error'}>
                        {row.amount >= 0 ? `+${row.amount}` : row.amount}
                      </TableCell>
                      <TableCell>{row.balanceAfter}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <div className='mt-3 flex items-center justify-between'>
            <Button
              variant='outline'
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className='text-sm text-muted-foreground'>
              Page {pagination?.page || page}
            </span>
            <Button
              variant='outline'
              disabled={!pagination?.hasMore}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
