export const getApiUrl = () => {
  let API_URL

  console.log(import.meta.env)

  if (import.meta.env.PROD) {
    API_URL = "https://notes-app-backend.onrender.com/api"
  } else {
    API_URL = "http://localhost:3000/api"
  }

  return API_URL
}
