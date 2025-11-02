import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/contracts`
  : '/api/contracts'

const initialState = {
  contracts: [],
  contract: null,
  isLoading: false,
  isError: false,
  message: ''
}

// Get all contracts
export const getContracts = createAsyncThunk(
  'contract/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.contracts
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get single contract
export const getContract = createAsyncThunk(
  'contract/getOne',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.contract
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Create contract
export const createContract = createAsyncThunk(
  'contract/create',
  async (contractData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.post(API_URL, contractData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Contract created successfully')
      return response.data.data.contract
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Sign contract
export const signContract = createAsyncThunk(
  'contract/sign',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.put(`${API_URL}/${id}/sign`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Contract signed successfully')
      return response.data.data.contract
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Download PDF
export const downloadPDF = createAsyncThunk(
  'contract/downloadPDF',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(`${API_URL}/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `contract-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('PDF downloaded successfully')
      return id
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to download PDF'
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isError = false
      state.message = ''
    },
    clearContract: (state) => {
      state.contract = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all contracts
      .addCase(getContracts.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getContracts.fulfilled, (state, action) => {
        state.isLoading = false
        state.contracts = action.payload
      })
      .addCase(getContracts.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Get single contract
      .addCase(getContract.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getContract.fulfilled, (state, action) => {
        state.isLoading = false
        state.contract = action.payload
      })
      .addCase(getContract.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Create contract
      .addCase(createContract.fulfilled, (state, action) => {
        state.contracts.unshift(action.payload)
      })
      // Sign contract
      .addCase(signContract.fulfilled, (state, action) => {
        state.contract = action.payload
        const index = state.contracts.findIndex(c => c._id === action.payload._id)
        if (index !== -1) {
          state.contracts[index] = action.payload
        }
      })
  }
})

export const { reset, clearContract } = contractSlice.actions
export default contractSlice.reducer
