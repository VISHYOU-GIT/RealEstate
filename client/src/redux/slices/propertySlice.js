import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/properties`
  : '/api/properties'

const initialState = {
  properties: [],
  property: null,
  myProperties: [],
  savedProperties: [],
  pagination: null,
  isLoading: false,
  isError: false,
  message: ''
}

// Get all properties
export const getProperties = createAsyncThunk(
  'property/getAll',
  async (params, thunkAPI) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await axios.get(`${API_URL}?${queryString}`)
      return response.data.data
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get single property
export const getProperty = createAsyncThunk(
  'property/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`)
      return response.data.data.property
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Create property
export const createProperty = createAsyncThunk(
  'property/create',
  async (propertyData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.post(API_URL, propertyData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Property created successfully')
      return response.data.data.property
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Update property
export const updateProperty = createAsyncThunk(
  'property/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Property updated successfully')
      return response.data.data.property
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Delete property
export const deleteProperty = createAsyncThunk(
  'property/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Property deleted successfully')
      return id
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get my properties
export const getMyProperties = createAsyncThunk(
  'property/getMy',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(`${API_URL}/my/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.properties
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Toggle save property
export const toggleSaveProperty = createAsyncThunk(
  'property/toggleSave',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.put(`${API_URL}/${id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(response.data.message)
      return { id, isSaved: response.data.data.isSaved }
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get saved properties
export const getSavedProperties = createAsyncThunk(
  'property/getSaved',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.get(`${API_URL}/my/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data.properties
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Add review
export const addReview = createAsyncThunk(
  'property/addReview',
  async ({ id, data }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const response = await axios.post(`${API_URL}/${id}/reviews`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Review added successfully')
      return response.data.data.property
    } catch (error) {
      const message = error.response?.data?.message || error.message
      toast.error(message)
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isError = false
      state.message = ''
    },
    clearProperty: (state) => {
      state.property = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all properties
      .addCase(getProperties.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getProperties.fulfilled, (state, action) => {
        state.isLoading = false
        state.properties = action.payload.properties
        state.pagination = action.payload.pagination
      })
      .addCase(getProperties.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Get single property
      .addCase(getProperty.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getProperty.fulfilled, (state, action) => {
        state.isLoading = false
        state.property = action.payload
      })
      .addCase(getProperty.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Create property
      .addCase(createProperty.fulfilled, (state, action) => {
        state.myProperties.unshift(action.payload)
      })
      // Update property
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.property = action.payload
        const index = state.myProperties.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.myProperties[index] = action.payload
        }
      })
      // Delete property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.myProperties = state.myProperties.filter(p => p._id !== action.payload)
      })
      // Get my properties
      .addCase(getMyProperties.fulfilled, (state, action) => {
        state.myProperties = action.payload
      })
      // Get saved properties
      .addCase(getSavedProperties.fulfilled, (state, action) => {
        state.savedProperties = action.payload
      })
      // Add review
      .addCase(addReview.fulfilled, (state, action) => {
        state.property = action.payload
      })
  }
})

export const { reset, clearProperty } = propertySlice.actions
export default propertySlice.reducer
