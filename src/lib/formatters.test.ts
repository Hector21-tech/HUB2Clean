import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  calculateAge,
  isContractExpiring,
  getPlayerInitials,
} from './formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format millions correctly', () => {
      expect(formatCurrency(1000000)).toBe('€1.0M')
      expect(formatCurrency(2500000)).toBe('€2.5M')
      expect(formatCurrency(10000000)).toBe('€10.0M')
    })

    it('should format thousands correctly', () => {
      expect(formatCurrency(1000)).toBe('€1K')
      expect(formatCurrency(500000)).toBe('€500K')
      expect(formatCurrency(999000)).toBe('€999K')
    })

    it('should format small amounts correctly', () => {
      expect(formatCurrency(500)).toBe('€500')
      expect(formatCurrency(100)).toBe('€100')
    })

    it('should return N/A for undefined or zero', () => {
      expect(formatCurrency(undefined)).toBe('N/A')
      expect(formatCurrency(0)).toBe('N/A')
    })
  })

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const tenYearsAgo = new Date()
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)

      expect(calculateAge(tenYearsAgo)).toBe(10)
    })

    it('should handle birthday not yet occurred this year', () => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 25)
      date.setMonth(date.getMonth() + 1) // Birthday next month

      expect(calculateAge(date)).toBe(24)
    })

    it('should return null for undefined date', () => {
      expect(calculateAge(undefined)).toBeNull()
    })
  })

  describe('isContractExpiring', () => {
    it('should return true for contracts expiring within 6 months', () => {
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

      expect(isContractExpiring(threeMonthsFromNow)).toBe(true)
    })

    it('should return false for contracts expiring after 6 months', () => {
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

      expect(isContractExpiring(oneYearFromNow)).toBe(false)
    })

    it('should return false for undefined date', () => {
      expect(isContractExpiring(undefined)).toBe(false)
    })

    it('should return false for already expired contracts', () => {
      const pastDate = new Date()
      pastDate.setMonth(pastDate.getMonth() - 1)

      expect(isContractExpiring(pastDate)).toBe(false)
    })
  })

  describe('getPlayerInitials', () => {
    it('should return initials from first and last name', () => {
      expect(getPlayerInitials('John', 'Doe')).toBe('JD')
      expect(getPlayerInitials('Zlatan', 'Ibrahimovic')).toBe('ZI')
    })

    it('should handle single names', () => {
      expect(getPlayerInitials('John', '')).toBe('J')
      expect(getPlayerInitials('', 'Doe')).toBe('D')
    })

    it('should handle undefined names', () => {
      expect(getPlayerInitials(undefined, undefined)).toBe('')
      expect(getPlayerInitials('John', undefined)).toBe('J')
    })

    it('should uppercase initials', () => {
      expect(getPlayerInitials('john', 'doe')).toBe('JD')
    })
  })
})
