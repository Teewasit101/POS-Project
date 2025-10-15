import { useState } from 'react'


function App() {
  const [count, setCount] = useState(0)

  
  return (
    <>
      <div> Hello World</div>
      <div> Hello World</div>
      <div> Hello World</div>
      <hr></hr>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
      </div>
      <hr></hr>
      <div>
        <button onClick={() => setCount((count) => count - 1)}>count is {count}</button>
      </div>
      <hr></hr>
      <div>
        <button onClick={() => setCount((count) => count = 0)}>count is {count}</button>
      </div>

    </>

  )





}

export default App
