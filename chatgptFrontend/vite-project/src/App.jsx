
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import React Router

import Chat from './components/chat';  // Component for the chat page

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

           <Route path="/" element={<Chat />} />  

        </Routes>
      </div>
    </Router>
  );
}

export default App;
