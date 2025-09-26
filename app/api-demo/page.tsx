'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ApiDemoPage() {
  const [healthResult, setHealthResult] = useState<any>(null)
  const [playersResult, setPlayersResult] = useState<any>(null)
  const [statsResult, setStatsResult] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [tenant, setTenant] = useState('demo')

  const [newPlayer, setNewPlayer] = useState({
    firstName: '',
    lastName: '',
    position: '',
    club: '',
    nationality: '',
    rating: '',
    notes: ''
  })

  const testHealthApi = async () => {
    setLoading('health')
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthResult(data)
    } catch (error) {
      console.error('Health API error:', error)
      setHealthResult({ error: 'Request failed' })
    }
    setLoading(null)
  }

  const testPlayersApi = async () => {
    setLoading('players')
    try {
      const response = await fetch(`/api/players?tenant=${tenant}&dryRun=1`)
      const data = await response.json()
      setPlayersResult(data)
    } catch (error) {
      console.error('Players API error:', error)
      setPlayersResult({ error: 'Request failed' })
    }
    setLoading(null)
  }

  const testStatsApi = async () => {
    setLoading('stats')
    try {
      const response = await fetch(`/api/dashboard/stats?tenant=${tenant}`)
      const data = await response.json()
      setStatsResult(data)
    } catch (error) {
      console.error('Stats API error:', error)
      setStatsResult({ error: 'Request failed' })
    }
    setLoading(null)
  }

  const createPlayer = async () => {
    setLoading('create')
    try {
      const response = await fetch(`/api/players?tenant=${tenant}&dryRun=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlayer)
      })
      const data = await response.json()
      setPlayersResult(data)
    } catch (error) {
      console.error('Create player error:', error)
      setPlayersResult({ error: 'Request failed' })
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Scout Hub API Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Test the migrated API endpoints from HUB2-Innankaos
          </p>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tenant">Tenant ID/Slug</Label>
              <Input
                id="tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="Enter tenant ID or slug"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health API */}
          <Card>
            <CardHeader>
              <CardTitle>Health Check API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testHealthApi}
                disabled={loading === 'health'}
                className="w-full"
              >
                {loading === 'health' ? 'Testing...' : 'Test Health API'}
              </Button>
              {healthResult && (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(healthResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dashboard Stats API */}
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Stats API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testStatsApi}
                disabled={loading === 'stats'}
                className="w-full"
              >
                {loading === 'stats' ? 'Testing...' : 'Test Stats API'}
              </Button>
              {statsResult && (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(statsResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Players API */}
        <Card>
          <CardHeader>
            <CardTitle>Players API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Get Players */}
            <div>
              <Button
                onClick={testPlayersApi}
                disabled={loading === 'players'}
                className="w-full"
              >
                {loading === 'players' ? 'Testing...' : 'Test Get Players (Dry Run)'}
              </Button>
            </div>

            {/* Create Player Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Create New Player (Dry Run)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newPlayer.firstName}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newPlayer.lastName}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g. ST, CM, CB"
                  />
                </div>
                <div>
                  <Label htmlFor="club">Club</Label>
                  <Input
                    id="club"
                    value={newPlayer.club}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, club: e.target.value }))}
                    placeholder="Current club"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={newPlayer.nationality}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, nationality: e.target.value }))}
                    placeholder="Nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (0-10)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newPlayer.rating}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, rating: e.target.value }))}
                    placeholder="7.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPlayer.notes}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Scouting notes..."
                  rows={3}
                />
              </div>
              <Button
                onClick={createPlayer}
                disabled={loading === 'create' || !newPlayer.firstName || !newPlayer.lastName}
                className="w-full"
              >
                {loading === 'create' ? 'Creating...' : 'Create Player (Dry Run)'}
              </Button>
            </div>

            {/* API Response */}
            {playersResult && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">API Response:</h4>
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(playersResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}