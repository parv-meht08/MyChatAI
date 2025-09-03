// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/user.context'
import axios from '../config/axios'

// eslint-disable-next-line react/prop-types
const UserAuth = ({ children }) => {

    const { user, setUser } = useUser()
    const [ loading, setLoading ] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            // If no token, redirect to login immediately
            if (!token) {
                setLoading(false)
                navigate('/login')
                return
            }

            // If user is already set in context, we're good
            if (user) {
                setLoading(false)
                return
            }

            // Check if we have user data in localStorage (for faster loading)
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser)
                    setUser(parsedUser)
                    setLoading(false)
                    return
                } catch (error) {
                    // If stored user is invalid, remove it
                    localStorage.removeItem('user')
                }
            }

            // Only make API call if we have token but no user data
            try {
                const response = await axios.get('/users/profile')
                const userData = response.data.user
                setUser(userData)
                // Store user data in localStorage for faster future loads
                localStorage.setItem('user', JSON.stringify(userData))
                setLoading(false)
            } catch (error) {
                console.error('Auth error:', error)
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setUser(null)
                setLoading(false)
                navigate('/login')
            }
        }

        checkAuth()
    }, [token, user, navigate, setUser])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Loading...</div>
        </div>
    }

    if (!user) {
        return null
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserAuth