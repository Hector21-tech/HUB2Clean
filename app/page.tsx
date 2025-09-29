import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Target, BarChart3, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Target className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Scout Hub</h1>
          </div>
          <p className="text-slate-600 text-lg font-medium">Professional Football Scouting</p>
          <p className="text-slate-500 text-sm mt-1">Manage players, organize trials, and streamline scouting operations</p>
        </div>

        {/* Action Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl shadow-blue-100/50">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome to Scout Hub</h2>
              <p className="text-slate-600 text-sm">Choose how you'd like to get started</p>
            </div>

            <div className="space-y-4">
              <Link href="/login" className="block">
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50">
                  <Users className="w-5 h-5" />
                  Get Started
                </Button>
              </Link>

              <Link href="/admin" className="block">
                <Button variant="outline" size="lg" className="w-full border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-2">
            <Shield className="w-4 h-4" />
            <span>Secure Platform</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2025 Scout Hub. Enterprise Football Scouting Platform.
          </p>
        </div>
      </div>
    </div>
  )
}
