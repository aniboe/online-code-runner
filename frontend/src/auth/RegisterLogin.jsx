// import { api } from '../main'


function RegisterLogin() {
   async function clickHandler(e){
    e.preventDefault()
    // await api.get(`/api/v1/auth/create-authUri`) // is doesnt work with redirects dumass
    window.location.href = `${import.meta.env.VITE_BACKEND_URI}/api/v1/auth/create-authUri`
  }
  
  return (
    <div className='h-screen flex items-center justify-center bg-zinc-700'>
        <section aria-label='login/regiater' className='bg-red-500 p-3 rounded-xl'>
            <button 
              className='bg-white p-1 rounded-sm'
              onClick={clickHandler}
            >
              google
            </button>
        </section>
    </div>
  )
}

export default RegisterLogin