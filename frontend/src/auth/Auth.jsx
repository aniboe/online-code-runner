
function Auth() {
  console.log('these are the cookies: ',document.cookie);
  
  return (
    
    <div>redirecting.... this ppage will redirect it to certain page based on cookie recieved
      if cookie is fine then go to multi file editor , if not back to single file editor with error
    </div>
  )
}

export default Auth