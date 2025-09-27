'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  onSearch?: (query: string) => Option[]
  variant?: 'default' | 'modal'
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  className = '',
  disabled = false,
  onSearch,
  variant = 'default'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Get the selected option label
  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search query
  useEffect(() => {
    if (!isOpen) {
      setFilteredOptions([])
      return
    }

    let filtered: Option[] = []

    if (onSearch && searchQuery) {
      // Use custom search function if provided
      filtered = onSearch(searchQuery)
    } else if (searchQuery) {
      // Default filtering
      filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else {
      // Show all options when no search query
      filtered = options.slice(0, 10) // Limit to first 10 for performance
    }

    setFilteredOptions(filtered)
    setHighlightedIndex(-1)
  }, [searchQuery, options, isOpen, onSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break

      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break

      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selected = filteredOptions[highlightedIndex]
          onChange(selected.value)
          setIsOpen(false)
          setSearchQuery('')
        }
        break
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  const handleOptionSelect = (option: Option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChange(undefined)
  }

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const getVariantStyles = () => {
    if (variant === 'modal') {
      return {
        container: `
          relative flex items-center min-h-[44px] px-3 py-2
          bg-white border border-gray-300 rounded-lg
          text-gray-900 text-sm
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          hover:border-gray-400
          transition-all duration-200 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `,
        input: 'flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 disabled:cursor-not-allowed',
        placeholder: 'text-gray-500',
        selected: 'text-gray-900',
        clearButton: 'p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200',
        arrow: 'text-gray-400',
        dropdown: 'absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto',
        option: (highlighted: boolean, selected: boolean) => `
          w-full px-4 py-2 text-left text-sm transition-colors duration-150
          ${highlighted ? 'bg-blue-50 text-blue-900' : 'text-gray-900 hover:bg-gray-50'}
          ${selected ? 'bg-blue-100 text-blue-900' : ''}
        `,
        noResults: 'px-4 py-3 text-sm text-gray-500 text-center'
      }
    }

    // Default glassmorphism variant
    return {
      container: `
        relative flex items-center min-h-[44px] px-3 py-3
        bg-white/5 backdrop-blur-sm
        border border-white/20 rounded-lg
        text-white text-sm
        focus-within:ring-2 focus-within:ring-blue-400/20 focus-within:border-blue-400
        hover:border-white/30
        transition-all duration-200 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isOpen ? 'ring-2 ring-blue-400/20 border-blue-400' : ''}
      `,
      input: 'flex-1 bg-transparent outline-none text-white placeholder-white/50 disabled:cursor-not-allowed',
      placeholder: 'text-white/50',
      selected: 'text-white',
      clearButton: 'p-1 text-white/60 hover:text-white transition-colors duration-200',
      arrow: 'text-white/60',
      dropdown: 'absolute top-full left-0 right-0 mt-1 z-50 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto',
      option: (highlighted: boolean, selected: boolean) => `
        w-full px-4 py-2 text-left text-sm transition-colors duration-150
        ${highlighted ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/10'}
        ${selected ? 'bg-blue-600/20 text-blue-400' : ''}
      `,
      noResults: 'px-4 py-3 text-sm text-white/60 text-center'
    }
  }

  const styles = getVariantStyles()

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Selected value display / Search input */}
      <div
        className={styles.container}
        onClick={handleInputClick}
      >
        {isOpen ? (
          // Search input when dropdown is open
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={styles.input}
            disabled={disabled}
            onKeyDown={handleKeyDown}
          />
        ) : (
          // Display selected value or placeholder
          <span className={`flex-1 ${selectedOption ? styles.selected : styles.placeholder}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}

        {/* Clear button (when value is selected and not disabled) */}
        {selectedOption && !disabled && !isOpen && (
          <button
            onClick={handleClear}
            className={styles.clearButton}
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown arrow */}
        <div className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className={`w-4 h-4 ${styles.arrow}`} />
        </div>
      </div>

      {/* Dropdown options */}
      {isOpen && (
        <div className={styles.dropdown}>
          {filteredOptions.length > 0 ? (
            <ul ref={listRef} className="py-1">
              {filteredOptions.map((option, index) => (
                <li key={`${option.value}-${index}`}>
                  <button
                    type="button"
                    className={styles.option(highlightedIndex === index, option.value === value)}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noResults}>
              {searchQuery ? 'No matches found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}