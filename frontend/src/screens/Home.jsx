import { useState, useEffect } from 'react'
import { useUser } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user, logout } = useUser()
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ projects, setProjects ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const [ projectsLoading, setProjectsLoading ] = useState(true)

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        if (!projectName.trim()) return
        
        setLoading(true)
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                // Optimistically add created project to list
                setProjects(prev => [ res.data, ...prev ])
                setProjectName('')
                setIsModalOpen(false)
                setLoading(false)
            })
            .catch((error) => {
                console.log(error.response?.data || error.message)
                setLoading(false)
                alert('Failed to create project. Please try again.')
            })
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Load projects only once when component mounts
    useEffect(() => {
        const loadProjects = async () => {
            try {
                setProjectsLoading(true)
                const response = await axios.get('/projects/all')
                setProjects(response.data.projects)
            } catch (err) {
                console.log(err)
                alert('Failed to load projects. Please refresh the page.')
            } finally {
                setProjectsLoading(false)
            }
        }

        loadProjects()
    }, []) // Empty dependency array - only run once

    return (
        <main className='p-4'>
            {/* Header with logout */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="projects flex flex-wrap gap-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project p-4 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                    <i className="ri-add-line mr-2"></i>
                    New Project
                </button>

                {projectsLoading ? (
                    <div className="w-full text-center py-8">
                        <div className="text-lg">Loading projects...</div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="w-full text-center py-8">
                        <div className="text-lg text-gray-500">No projects yet. Create your first project!</div>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-200 transition-colors">
                            <h2
                                className='font-semibold'
                            >{project.name}</h2>

                            <div className="flex gap-2">
                                <p> <small> <i className="ri-user-line"></i> Collaborators</small> :</p>
                                {project.users.length}
                            </div>

                        </div>
                    ))
                )}

            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-md shadow-md w-1/3 max-w-md">
                        <h2 className="text-xl mb-4">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" 
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="Enter project name"
                                    required 
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors" 
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    disabled={loading || !projectName.trim()}
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    )
}

export default Home