import { useState, memo } from 'react'
import { FaSearch } from 'react-icons/fa'

const SearchInput = memo(({ onSearchChange, placeholder = "Search by location, title..." }) => {
  const [value, setValue] = useState('')

  const handleChange = (e) => {
    setValue(e.target.value)
  }

  const handleSearch = () => {
    onSearchChange(value)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="relative flex-1 max-w-2xl flex gap-2">
      <div className="relative flex-1">
        <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full pl-14 pr-6 py-4 text-base rounded-2xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
        />
      </div>
      <button
        onClick={handleSearch}
        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-2xl font-semibold hover:from-primary-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
      >
        <FaSearch />
        <span className="hidden sm:inline">Search</span>
      </button>
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
